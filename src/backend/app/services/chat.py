"""Chat service — ephemeral chat TTL management and broadcast helpers."""

import json
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.group import Group
from app.models.chat_message import ChatMessage


async def get_chat_expires_at(group_id: uuid.UUID, db: AsyncSession) -> datetime | None:
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    if group:
        return group.chat_expires_at
    return None


async def set_chat_meta_redis(group_id: str, opens_at: datetime, expires_at: datetime):
    try:
        from app.db.redis import init_redis
        redis = await init_redis()
        await redis.hset(f"chat:{group_id}:meta", mapping={
            "opens_at": opens_at.isoformat(),
            "expires_at": expires_at.isoformat(),
            "group_name": group_id,
        })
        ttl = max(1, int((expires_at - datetime.utcnow()).total_seconds()))
        await redis.expire(f"chat:{group_id}:meta", ttl)
        await redis.expire(f"chat:{group_id}:messages", ttl)
        await redis.close()
    except Exception:
        pass


async def cleanup_expired_messages(db: AsyncSession):
    from sqlalchemy import delete
    await db.execute(
        delete(ChatMessage).where(ChatMessage.expires_at < datetime.utcnow())
    )
    await db.commit()
