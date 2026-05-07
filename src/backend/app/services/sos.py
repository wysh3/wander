"""SOS service — alert routing with triple redundancy: WebSocket, polling, SMS."""

import asyncio
import httpx
from app.config import get_settings


async def send_sms_alert(phone: str, user_name: str, lat: float | None, lng: float | None) -> bool:
    """Send SMS via Twilio fallback."""
    settings = get_settings()
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        return False

    try:
        async with httpx.AsyncClient() as client:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            response = await client.post(url, data={
                "From": settings.TWILIO_PHONE_NUMBER,
                "To": phone,
                "Body": (
                    f"EMERGENCY: {user_name} triggered SOS on Wander. "
                    f"Location: lat={lat}, lng={lng}. "
                    f"Nearest police: Chikkaballapur Rural PS (+91 8156 295 300). "
                    f"Check Wander app for details."
                ),
            }, auth=auth, timeout=10)
            return response.status_code < 400
    except Exception:
        return False


async def schedule_sms_fallback(
    sos_event_id: str,
    user_name: str,
    lat: float | None,
    lng: float | None,
    ec_phone: str,
    delay: int = 5,
):
    """After delay seconds, send SMS if SOS still unresolved."""
    await asyncio.sleep(delay)
    try:
        from app.db.session import async_session_factory
        from sqlalchemy import select
        from app.models.sos_event import SOSEvent
        async with async_session_factory() as db:
            result = await db.execute(select(SOSEvent).where(SOSEvent.id == sos_event_id))
            event = result.scalar_one_or_none()
            if event and not event.emergency_contact_notified and not event.resolved:
                sent = await send_sms_alert(ec_phone, user_name, lat, lng)
                if sent:
                    event.emergency_contact_notified = True
                    await db.commit()
    except Exception:
        pass
