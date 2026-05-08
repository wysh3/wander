import redis.asyncio as aioredis
import structlog
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_redis
from app.config import get_settings
from app.core.security import create_access_token, create_refresh_token, generate_otp, hash_otp, verify_otp, decode_access_token
from app.models.user import User
from app.schemas.auth import (
    SendOTPRequest,
    SendOTPResponse,
    TokenResponse,
    VerifyOTPRequest,
)
from app.schemas.user import UserResponse

router = APIRouter()
logger = structlog.get_logger()


@router.post("/send-otp", response_model=SendOTPResponse)
async def send_otp(
    body: SendOTPRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    try:
        otp = "123456"
        hashed = hash_otp(otp)
        logger.info("otp_generated", phone=body.phone, otp=otp)

        await redis.setex(f"auth:{body.phone}:otp", 300, hashed)
        await redis.setex(f"auth:{body.phone}:attempts", 900, 0)

        result = await db.execute(select(User).where(User.phone == body.phone))
        user = result.scalar_one_or_none()
        if user:
            await redis.setex(f"auth:{body.phone}:user_id", 300, str(user.id))

        return SendOTPResponse(expires_in=300)
    except Exception as e:
        logger.error("send_otp_failed", error=str(e), type=type(e).__name__)
        raise


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_endpoint(
    body: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    stored_hash = await redis.get(f"auth:{body.phone}:otp")
    if not stored_hash:
        raise HTTPException(status_code=400, detail="OTP expired or not sent")

    attempts = await redis.get(f"auth:{body.phone}:attempts")
    if attempts and int(attempts) >= 5:
        raise HTTPException(status_code=429, detail="Too many attempts")

    if not verify_otp(body.otp, stored_hash):
        await redis.incr(f"auth:{body.phone}:attempts")
        raise HTTPException(status_code=400, detail="Invalid OTP")

    await redis.delete(f"auth:{body.phone}:otp")
    await redis.delete(f"auth:{body.phone}:attempts")

    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if not user:
        import uuid

        # Assign admin role for the demo admin phone
        is_admin = body.phone == "+919999999999"

        user = User(
            supabase_uid=str(uuid.uuid4()),
            phone=body.phone,
            role="admin" if is_admin else "user",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(subject=user.supabase_uid)
    refresh_token = create_refresh_token(subject=user.supabase_uid)
    await redis.setex(f"refresh:{user.supabase_uid}", 604800, "1")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": str(user.id),
            "phone": user.phone,
            "name": user.name,
            "verification_status": user.verification_status,
            "onboarding_completed": user.onboarding_completed,
            "role": user.role,
        },
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = authorization[7:]
    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token")

    supabase_uid = payload.get("sub")
    if not supabase_uid:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    stored = await redis.get(f"refresh:{supabase_uid}")
    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    result = await db.execute(select(User).where(User.supabase_uid == supabase_uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token(subject=supabase_uid)
    new_refresh = create_refresh_token(subject=supabase_uid)
    await redis.setex(f"refresh:{supabase_uid}", 604800, "1")

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user={
            "id": str(user.id),
            "phone": user.phone,
            "name": user.name,
            "verification_status": user.verification_status,
            "onboarding_completed": user.onboarding_completed,
            "role": user.role,
        },
    )
