from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import structlog
import time
import asyncio

from app.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import setup_logging
from app.api.v1.router import router as v1_router
from app.api.v1.location import router as location_router
from app.db.redis import init_redis, close_redis, _redis_pool

settings = get_settings()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("wander_api_starting", environment=settings.ENVIRONMENT)
    await init_redis()
    # Start Redis pubsub listener for location broadcasts
    asyncio.create_task(_start_location_pubsub_task())
    yield
    await close_redis()
    logger.info("wander_api_shutdown")


async def _start_location_pubsub_task():
    """Wrapper to start the Redis pubsub listener without blocking."""
    try:
        from app.api.v1.location import start_location_pubsub
        await start_location_pubsub()
    except Exception as e:
        logger.error("location_pubsub_start_failed", error=str(e))


app = FastAPI(
    title="Wander API",
    description="AI That Cures Loneliness",
    version="1.0.0",
    lifespan=lifespan,
)

# Log CORS origins for debugging
cors_origins = settings.cors_origins_list
logger.info("cors_configuration", origins=cors_origins, environment=settings.ENVIRONMENT)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list if settings.ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if _redis_pool and request.url.path.startswith("/api/"):
        client_ip = request.client.host if request.client else "unknown"
        key = f"ratelimit:{client_ip}:{request.url.path}"
        try:
            current = await _redis_pool.get(key)
            count = int(current) + 1 if current else 1
            pipe = _redis_pool.pipeline()
            pipe.set(key, count, ex=60)
            pipe.ttl(key)
            results = await pipe.execute()
            ttl = results[1] if len(results) > 1 else 60
        except Exception:
            return await call_next(request)

        limit = 100
        remaining = max(0, limit - count)
        if count > limit:
            response = JSONResponse(
                status_code=429,
                content={"error": {"code": "RATE_LIMITED", "message": "Too many requests", "details": {}}},
            )
        else:
            response = await call_next(request)

        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(ttl)
        return response

    return await call_next(request)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    logger.info("request", method=request.method, path=request.url.path)
    response = await call_next(request)
    logger.info("response", status_code=response.status_code)
    return response


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "wander-api"}


@app.get("/seed")
async def seed_data():
    from scripts.seed import seed
    await seed()
    return {"status": "ok", "message": "Database seeded successfully"}


app.include_router(v1_router, prefix="/api/v1")

# Mount static files for image uploads
import os
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(os.path.join(static_dir, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")
