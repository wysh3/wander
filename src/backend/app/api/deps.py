from fastapi import Depends, Header, WebSocket, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.db.session import get_db as _get_db
from app.db.redis import get_redis as _get_redis
from app.core.security import decode_access_token
from app.models.user import User
from app.core.exceptions import AuthError


async def get_db() -> AsyncSession:
    async for session in _get_db():
        yield session


async def get_redis() -> aioredis.Redis:
    from app.db.redis import _redis_pool
    if _redis_pool is not None:
        yield _redis_pool
    else:
        async for client in _get_redis():
            yield client


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise AuthError("Missing or invalid authorization header")
    token = authorization[7:]
    try:
        payload = decode_access_token(token)
    except ValueError:
        raise AuthError("Invalid or expired token")
    supabase_uid = payload.get("sub")
    if not supabase_uid:
        raise AuthError("Invalid token payload")
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.supabase_uid == supabase_uid))
    user = result.scalar_one_or_none()
    if not user:
        raise AuthError("User not found")
    return user
