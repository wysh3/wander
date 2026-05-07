from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
import uuid
from datetime import datetime, timezone
import asyncio
import redis.asyncio as aioredis

from app.api.deps import get_db, get_current_user, get_redis
from app.models.user import User
from app.models.group import Group, GroupMember
from app.models.chat_message import ChatMessage
from app.schemas.chat import ChatMessageResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()

# In-memory WebSocket connection tracking: {group_id: {user_id: [websocket, ...]}}
active_connections: dict[str, dict[str, list[WebSocket]]] = {}


@router.get("/{group_id}/chat/history", response_model=PaginatedResponse[ChatMessageResponse])
async def get_chat_history(
    group_id: uuid.UUID,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    redis: aioredis.Redis = Depends(get_redis),
):
    group_key = str(group_id)

    try:
        redis_messages = await redis.zrange(f"chat:{group_key}:messages", 0, limit - 1)
        if redis_messages:
            items = [ChatMessageResponse(**json.loads(m)) for m in redis_messages]
            return PaginatedResponse(items=items)
    except Exception:
        pass

    import base64
    message_query = select(ChatMessage).where(
        ChatMessage.group_id == group_id
    ).order_by(ChatMessage.created_at.desc()).limit(limit + 1)

    if cursor:
        decoded = base64.b64decode(cursor).decode()
        cursor_data = json.loads(decoded)
        message_query = message_query.where(ChatMessage.created_at < cursor_data["created_at"])

    result = await db.execute(message_query)
    messages = result.scalars().all()
    has_more = len(messages) > limit

    items = []
    for msg in reversed(messages[:limit]):
        user = None
        if msg.user_id:
            user_result = await db.execute(select(User).where(User.id == msg.user_id))
            user = user_result.scalar_one_or_none()
        items.append(ChatMessageResponse(
            id=msg.id,
            group_id=msg.group_id,
            user_id=msg.user_id,
            user_name=user.name if user else None,
            content=msg.content,
            message_type=msg.message_type,
            created_at=msg.created_at,
        ))

    next_cursor = None
    if has_more and messages:
        cursor_data = json.dumps({"created_at": str(messages[-1].created_at)})
        next_cursor = base64.b64encode(cursor_data.encode()).decode()

    return PaginatedResponse(items=items, next_cursor=next_cursor)


@router.websocket("/{group_id}/chat")
async def websocket_chat(
    websocket: WebSocket,
    group_id: str,
    token: str = Query(...),
):
    await websocket.accept()

    user = None
    chat_expires_at = None
    try:
        from app.core.security import decode_access_token
        payload = decode_access_token(token)
        supabase_uid = payload.get("sub")

        from app.db.session import async_session_factory
        async with async_session_factory() as db:
            result = await db.execute(select(User).where(User.supabase_uid == supabase_uid))
            user = result.scalar_one_or_none()

            if not user:
                await websocket.close(code=4001)
                return

            member_result = await db.execute(
                select(GroupMember).where(
                    GroupMember.group_id == uuid.UUID(group_id),
                    GroupMember.user_id == user.id,
                )
            )
            if not member_result.scalar_one_or_none():
                await websocket.close(code=4003)
                return

            group_result = await db.execute(select(Group).where(Group.id == uuid.UUID(group_id)))
            group = group_result.scalar_one_or_none()
            if group:
                chat_expires_at = group.chat_expires_at

    except Exception:
        await websocket.close(code=4001)
        return

    user_id = str(user.id)
    user_name = user.name or "User"

    if group_id not in active_connections:
        active_connections[group_id] = {}
    if user_id not in active_connections[group_id]:
        active_connections[group_id][user_id] = []
    active_connections[group_id][user_id].append(websocket)

    # Also track in Redis for cross-process
    try:
        from app.db.redis import init_redis
        redis_track = await init_redis()
        conn_id = f"{user_id}:{id(websocket)}"
        await redis_track.sadd(f"ws:user:{user_id}", conn_id)
        await redis_track.sadd(f"ws:group:{group_id}", user_id)
        await redis_track.close()
    except Exception:
        pass

    await broadcast_to_group(group_id, {
        "type": "user_joined",
        "user_name": user_name,
        "user_id": user_id,
    }, exclude_user=user_id)

    # Periodic TTL update task
    ttl_task: asyncio.Task | None = None

    async def send_ttl_updates():
        nonlocal chat_expires_at
        while True:
            await asyncio.sleep(60)
            if chat_expires_at is None:
                try:
                    from app.db.session import async_session_factory
                    async with async_session_factory() as db:
                        gresult = await db.execute(select(Group).where(Group.id == uuid.UUID(group_id)))
                        g = gresult.scalar_one_or_none()
                        if g:
                            chat_expires_at = g.chat_expires_at
                except Exception:
                    pass
            if chat_expires_at is None:
                continue
            ttl_exp = chat_expires_at.replace(tzinfo=None) if chat_expires_at.tzinfo else chat_expires_at
            remaining = max(0, int((ttl_exp - datetime.utcnow()).total_seconds()))
            try:
                await websocket.send_json({
                    "type": "chat_ttl_update",
                    "remaining_seconds": remaining,
                })
            except Exception:
                break
            if remaining <= 0:
                try:
                    await websocket.send_json({"type": "chat_expired"})
                except Exception:
                    pass
                break

    if chat_expires_at:
        ttl_task = asyncio.create_task(send_ttl_updates())

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            if message_data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if message_data.get("type") == "send_message":
                content = message_data.get("content", "")
                if not content.strip():
                    continue

                message_id = str(uuid.uuid4())
                timestamp = datetime.now(timezone.utc).isoformat()

                msg_json = json.dumps({
                    "id": message_id,
                    "group_id": group_id,
                    "user_id": user_id,
                    "user_name": user_name,
                    "content": content,
                    "message_type": "text",
                    "created_at": timestamp,
                })

                try:
                    from app.db.redis import init_redis
                    redis_store = await init_redis()
                    await redis_store.zadd(f"chat:{group_id}:messages",
                                           {msg_json: int(datetime.utcnow().timestamp())})
                    meta = await redis_store.hgetall(f"chat:{group_id}:meta")
                    if meta and meta.get("expires_at"):
                        ttl = max(0, int(datetime.fromisoformat(meta["expires_at"]).timestamp() - datetime.utcnow().timestamp()))
                        await redis_store.expire(f"chat:{group_id}:messages", ttl)
                    await redis_store.close()
                except Exception:
                    pass

                try:
                    from app.db.session import async_session_factory
                    async with async_session_factory() as db:
                        chat_msg = ChatMessage(
                            id=uuid.UUID(message_id),
                            group_id=uuid.UUID(group_id),
                            user_id=user.id,
                            content=content,
                            message_type="text",
                            expires_at=chat_expires_at or datetime.utcnow(),
                        )
                        db.add(chat_msg)
                        await db.commit()
                except Exception:
                    pass

                await broadcast_to_group(group_id, {
                    "type": "new_message",
                    "id": message_id,
                    "user_id": user_id,
                    "user_name": user_name,
                    "content": content,
                    "timestamp": timestamp,
                }, exclude_user=user_id)

    except WebSocketDisconnect:
        pass
    finally:
        if ttl_task:
            ttl_task.cancel()
            try:
                await ttl_task
            except asyncio.CancelledError:
                pass

        if group_id in active_connections and user_id in active_connections[group_id]:
            active_connections[group_id][user_id].remove(websocket)
            if not active_connections[group_id][user_id]:
                del active_connections[group_id][user_id]
            if not active_connections[group_id]:
                del active_connections[group_id]

        # Clean up Redis tracking
        try:
            from app.db.redis import init_redis
            redis_clean = await init_redis()
            conn_id = f"{user_id}:{id(websocket)}"
            await redis_clean.srem(f"ws:user:{user_id}", conn_id)
            await redis_clean.close()
        except Exception:
            pass

        await broadcast_to_group(group_id, {
            "type": "user_left",
            "user_name": user_name,
            "user_id": user_id,
        }, exclude_user=user_id)


async def broadcast_to_group(group_id: str, message: dict, exclude_user: str | None = None):
    if group_id not in active_connections:
        return
    for uid, connections in list(active_connections[group_id].items()):
        if exclude_user and uid == exclude_user:
            continue
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                pass
