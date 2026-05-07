from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.push_notification import (
    PushSubscriptionCreate,
    PushSubscriptionResponse,
    PushSendRequest,
    PushSendResponse,
)
from app.services import push_notification as push_svc

logger = structlog.get_logger()
router = APIRouter()


@router.post("/push/subscribe", response_model=PushSubscriptionResponse)
async def subscribe_push(
    body: PushSubscriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = await push_svc.subscribe(
        db=db,
        user_id=str(current_user.id),
        endpoint=body.endpoint,
        p256dh_key=body.p256dh_key,
        auth_key=body.auth_key,
        user_agent=body.user_agent,
    )
    return PushSubscriptionResponse(
        id=sub.id,
        endpoint=sub.endpoint,
        active=sub.active,
        created_at=sub.created_at,
    )


@router.delete("/push/subscribe")
async def unsubscribe_push(
    endpoint: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await push_svc.unsubscribe(db=db, user_id=str(current_user.id), endpoint=endpoint)
    return {"ok": True}


@router.get("/push/subscriptions", response_model=list[PushSubscriptionResponse])
async def list_subscriptions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subs = await push_svc.get_user_subscriptions(db, str(current_user.id))
    return [
        PushSubscriptionResponse(
            id=s.id, endpoint=s.endpoint, active=s.active, created_at=s.created_at
        )
        for s in subs
    ]


@router.post("/push/send", response_model=PushSendResponse)
async def send_push_from_server(
    body: PushSendRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.admin import AdminNotification

    sent, failed = 0, 0
    if body.target_user_id:
        sent, failed = await push_svc.send_push_to_user(
            db, str(body.target_user_id), body.title, body.body, body.url
        )
    else:
        sent, failed = await push_svc.send_push_to_all(db, body.title, body.body, body.url)

    notif = AdminNotification(
        title=body.title,
        body=body.body,
        target_type="user" if body.target_user_id else "all",
        target_id=body.target_user_id,
        sent_at=datetime.now(timezone.utc),
        delivered_count=sent,
        created_by=current_user.id,
    )
    db.add(notif)
    await db.commit()
    return PushSendResponse(sent=sent, failed=failed)
