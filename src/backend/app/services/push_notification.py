import json
import structlog
from pywebpush import webpush, WebPushException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.push_subscription import PushSubscription
from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


def _get_vapid_claims() -> dict:
    return {
        "sub": f"mailto:{settings.VAPID_CLAIM_EMAIL}",
    }


async def subscribe(
    db: AsyncSession,
    user_id: str,
    endpoint: str,
    p256dh_key: str,
    auth_key: str,
    user_agent: str | None = None,
) -> PushSubscription:
    existing = await db.execute(
        select(PushSubscription).where(
            PushSubscription.user_id == user_id,
            PushSubscription.endpoint == endpoint,
        )
    )
    sub = existing.scalar_one_or_none()
    if sub:
        sub.p256dh_key = p256dh_key
        sub.auth_key = auth_key
        sub.user_agent = user_agent
        sub.active = True
    else:
        sub = PushSubscription(
            user_id=user_id,
            endpoint=endpoint,
            p256dh_key=p256dh_key,
            auth_key=auth_key,
            user_agent=user_agent,
            active=True,
        )
        db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


async def unsubscribe(db: AsyncSession, user_id: str, endpoint: str | None = None):
    if endpoint:
        await db.execute(
            delete(PushSubscription).where(
                PushSubscription.user_id == user_id,
                PushSubscription.endpoint == endpoint,
            )
        )
    else:
        await db.execute(
            delete(PushSubscription).where(PushSubscription.user_id == user_id)
        )
    await db.commit()


async def get_user_subscriptions(db: AsyncSession, user_id: str) -> list[PushSubscription]:
    r = await db.execute(
        select(PushSubscription).where(
            PushSubscription.user_id == user_id,
            PushSubscription.active == True,
        )
    )
    return list(r.scalars().all())


async def get_all_subscriptions(db: AsyncSession) -> list[PushSubscription]:
    r = await db.execute(
        select(PushSubscription).where(PushSubscription.active == True)
    )
    return list(r.scalars().all())


async def get_event_subscriptions(db: AsyncSession, event_id: str) -> list[PushSubscription]:
    from app.models.group import Group, GroupMember
    r = await db.execute(
        select(PushSubscription).distinct()
        .join(GroupMember, GroupMember.user_id == PushSubscription.user_id)
        .join(Group, Group.id == GroupMember.group_id)
        .where(
            Group.activity_id == event_id,
            PushSubscription.active == True,
        )
    )
    return list(r.scalars().all())


async def get_group_subscriptions(db: AsyncSession, group_id: str) -> list[PushSubscription]:
    from app.models.group import GroupMember
    r = await db.execute(
        select(PushSubscription).distinct()
        .join(GroupMember, GroupMember.user_id == PushSubscription.user_id)
        .where(
            GroupMember.group_id == group_id,
            PushSubscription.active == True,
        )
    )
    return list(r.scalars().all())


async def send_push(
    subscription: PushSubscription,
    title: str,
    body: str,
    url: str | None = None,
) -> bool:
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.warning("vapid_keys_not_configured")
        return False

    payload = {
        "title": title,
        "body": body,
    }
    if url:
        payload["url"] = url

    sub_info = {
        "endpoint": subscription.endpoint,
        "keys": {
            "p256dh": subscription.p256dh_key,
            "auth": subscription.auth_key,
        },
    }

    try:
        webpush(
            subscription_info=sub_info,
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims=_get_vapid_claims(),
        )
        return True
    except WebPushException as e:
        if e.response and e.response.status_code in (410, 404):
            logger.info("push_subscription_gone", endpoint=subscription.endpoint)
            subscription.active = False
        else:
            logger.error("push_send_failed", error=str(e), endpoint=subscription.endpoint)
        return False


async def send_push_to_user(
    db: AsyncSession,
    user_id: str,
    title: str,
    body: str,
    url: str | None = None,
) -> tuple[int, int]:
    subs = await get_user_subscriptions(db, user_id)
    sent = 0
    failed = 0
    for sub in subs:
        ok = await send_push(sub, title, body, url)
        if ok:
            sent += 1
        else:
            failed += 1
    await db.commit()
    return sent, failed


async def send_push_to_all(
    db: AsyncSession,
    title: str,
    body: str,
    url: str | None = None,
) -> tuple[int, int]:
    subs = await get_all_subscriptions(db)
    sent = 0
    failed = 0
    for sub in subs:
        ok = await send_push(sub, title, body, url)
        if ok:
            sent += 1
        else:
            failed += 1
    await db.commit()
    return sent, failed


async def send_push_to_event_attendees(
    db: AsyncSession,
    event_id: str,
    title: str,
    body: str,
    url: str | None = None,
) -> tuple[int, int]:
    subs = await get_event_subscriptions(db, event_id)
    sent = 0
    failed = 0
    for sub in subs:
        ok = await send_push(sub, title, body, url)
        if ok:
            sent += 1
        else:
            failed += 1
    await db.commit()
    return sent, failed


async def send_push_to_group(
    db: AsyncSession,
    group_id: str,
    title: str,
    body: str,
    url: str | None = None,
) -> tuple[int, int]:
    subs = await get_group_subscriptions(db, group_id)
    sent = 0
    failed = 0
    for sub in subs:
        ok = await send_push(sub, title, body, url)
        if ok:
            sent += 1
        else:
            failed += 1
    await db.commit()
    return sent, failed
