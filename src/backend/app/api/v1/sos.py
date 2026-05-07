from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import json
import uuid
from datetime import datetime, timedelta
import httpx

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.group import Group, GroupMember
from app.models.sos_event import SOSEvent
from app.schemas.sos import SOSTriggerRequest, SOSTriggerResponse, SOSCancelRequest, SOSCancelResponse
from app.core.exceptions import NotFoundError
from app.config import get_settings

router = APIRouter()

# Active SOS WebSocket connections: {user_id: [websocket, ...]}
sos_connections: dict[str, list[WebSocket]] = {}


@router.post("/trigger", response_model=SOSTriggerResponse)
async def trigger_sos(
    body: SOSTriggerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id

    # Find user's active group
    group_result = await db.execute(
        select(GroupMember).where(GroupMember.user_id == user_id)
    )
    membership = group_result.scalars().first()
    group = None
    if membership:
        group_result = await db.execute(select(Group).where(Group.id == membership.group_id))
        group = group_result.scalar_one_or_none()

    # Create SOS event record
    sos_event = SOSEvent(
        user_id=user_id,
        group_id=group.id if group else None,
        activity_id=group.activity_id if group else None,
        lat=body.lat,
        lng=body.lng,
        emergency_contact_notified=False,
        nearest_police_station="Chikkaballapur Rural PS",
    )
    db.add(sos_event)
    await db.commit()
    await db.refresh(sos_event)

    # Try WebSocket delivery to emergency contact
    group_size = 0
    if group:
        count_result = await db.execute(
            select(func.count(GroupMember.id)).where(GroupMember.group_id == group.id)
        )
        group_size = count_result.scalar() or 0

    notified = False
    ec_phone = current_user.emergency_contact_phone
    if ec_phone:
        ec_result = await db.execute(select(User).where(User.phone == ec_phone))
        ec_user = ec_result.scalar_one_or_none()
        if ec_user and str(ec_user.id) in sos_connections:
            alert_data = {
                "type": "sos_alert",
                "sos_id": str(sos_event.id),
                "user_name": current_user.name or "User",
                "lat": body.lat,
                "lng": body.lng,
                "nearest_police_station": "Chikkaballapur Rural PS",
                "police_phone": "+91 8156 295 300",
                "group_size": group_size,
                "host_name": "Arjun Kumar",
                "host_phone": "+91 98765 43210",
                "timestamp": datetime.utcnow().isoformat(),
            }
            for ws in sos_connections[str(ec_user.id)]:
                try:
                    await ws.send_json(alert_data)
                    notified = True
                except Exception:
                    pass

    sos_event.emergency_contact_notified = notified
    await db.commit()

    # SMS fallback via Twilio (background, fires if WS delivery didn't work)
    import asyncio
    if not notified and ec_phone:
        asyncio.create_task(_send_sms_fallback(
            sos_event_id=str(sos_event.id),
            user_name=current_user.name or "User",
            lat=body.lat,
            lng=body.lng,
            ec_phone=ec_phone,
            delay=5,
        ))

    return SOSTriggerResponse(
        sos_id=sos_event.id,
        notified=notified,
    )


async def _send_sms_fallback(
    sos_event_id: str,
    user_name: str,
    lat: float | None,
    lng: float | None,
    ec_phone: str,
    delay: int = 5,
):
    """After `delay` seconds, check if SOS is still unresolved and send SMS."""
    await asyncio.sleep(delay)

    try:
        from app.db.session import async_session_factory
        from sqlalchemy import select
        async with async_session_factory() as db:
            result = await db.execute(select(SOSEvent).where(SOSEvent.id == sos_event_id))
            event = result.scalar_one_or_none()
            if event and not event.emergency_contact_notified and not event.resolved:
                settings = get_settings()
                if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
                    try:
                        async with httpx.AsyncClient() as client:
                            from urllib.parse import urlencode
                            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
                            auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                            body_data = {
                                "From": settings.TWILIO_PHONE_NUMBER,
                                "To": ec_phone,
                                "Body": f"EMERGENCY: {user_name} has triggered an SOS on Wander. "
                                        f"Location: lat={lat}, lng={lng}. Nearest police: Chikkaballapur Rural PS (+91 8156 295 300). "
                                        "Check the Wander app for details.",
                            }
                            resp = await client.post(url, data=body_data, auth=auth, timeout=10)
                            if resp.status_code < 400:
                                event.emergency_contact_notified = True
                                await db.commit()
                    except Exception:
                        pass
    except Exception:
        pass


@router.post("/cancel", response_model=SOSCancelResponse)
async def cancel_sos(
    body: SOSCancelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(SOSEvent).where(SOSEvent.id == body.sos_id))
    sos_event = result.scalar_one_or_none()
    if not sos_event:
        raise NotFoundError("SOSEvent", str(body.sos_id))

    sos_event.resolved = True
    await db.commit()

    return SOSCancelResponse(cancelled=True)


@router.get("/{user_id}/poll")
async def sos_poll(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Polling fallback: check for active SOS alerts where this user is the emergency contact."""
    poll_user = await db.execute(select(User).where(User.id == user_id))
    poll_user = poll_user.scalar_one_or_none()
    if not poll_user or not poll_user.phone:
        return {"alerts": []}

    result = await db.execute(
        select(SOSEvent).join(User, SOSEvent.user_id == User.id)
        .where(
            User.emergency_contact_phone == poll_user.phone,
            SOSEvent.emergency_contact_notified == False,
            SOSEvent.resolved == False,
            SOSEvent.triggered_at >= datetime.utcnow() - timedelta(hours=24),
        ).limit(10)
    )
    events = result.scalars().all()

    alerts = []
    for event in events:
        user_result = await db.execute(select(User).where(User.id == event.user_id))
        trigger_user = user_result.scalar_one_or_none()
        alerts.append({
            "type": "sos_alert",
            "sos_id": str(event.id),
            "user_name": trigger_user.name if trigger_user else "User",
            "lat": event.lat,
            "lng": event.lng,
            "nearest_police_station": event.nearest_police_station,
            "timestamp": event.triggered_at.isoformat(),
        })

    return {"alerts": alerts}


@router.websocket("/{user_id}")
async def websocket_sos(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...),
):
    await websocket.accept()

    user = None
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
    except Exception:
        await websocket.close(code=4001)
        return

    if user_id not in sos_connections:
        sos_connections[user_id] = []
    sos_connections[user_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        if user_id in sos_connections:
            sos_connections[user_id].remove(websocket)
            if not sos_connections[user_id]:
                del sos_connections[user_id]
