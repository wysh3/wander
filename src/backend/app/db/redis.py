import redis.asyncio as aioredis
from app.config import get_settings

settings = get_settings()


async def get_redis() -> aioredis.Redis:
    client = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
    try:
        yield client
    finally:
        await client.close()


_redis_pool: aioredis.Redis | None = None


async def init_redis() -> aioredis.Redis:
    global _redis_pool
    _redis_pool = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
    return _redis_pool


async def close_redis():
    global _redis_pool
    if _redis_pool:
        await _redis_pool.close()
        _redis_pool = None
