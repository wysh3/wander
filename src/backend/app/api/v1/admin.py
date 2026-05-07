from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.sos_event import SOSEvent
from app.models.host import Host
from app.schemas.common import PaginatedResponse

router = APIRouter()


async def require_admin(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Host).where(Host.user_id == current_user.id, Host.active == True))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/sos-events")
async def list_sos_events(
    resolved: bool | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = select(SOSEvent).order_by(SOSEvent.triggered_at.desc())
    if resolved is not None:
        query = query.where(SOSEvent.resolved == resolved)
    query = query.limit(limit)
    result = await db.execute(query)
    events = result.scalars().all()

    items = []
    for e in events:
        user_r = await db.execute(select(User).where(User.id == e.user_id))
        u = user_r.scalar_one_or_none()
        items.append({
            "id": str(e.id),
            "user_name": u.name if u else "Unknown",
            "lat": float(e.lat) if e.lat else None,
            "lng": float(e.lng) if e.lng else None,
            "nearest_police_station": e.nearest_police_station,
            "resolved": e.resolved,
            "triggered_at": str(e.triggered_at),
        })

    return PaginatedResponse(items=items)


@router.get("/verifications")
async def list_verifications(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(User).where(User.verification_status == "pending")
        .order_by(User.created_at.desc()).limit(20)
    )
    users = result.scalars().all()
    return {
        "items": [
            {"id": str(u.id), "phone": u.phone, "method": u.verification_method, "status": u.verification_status}
            for u in users
        ]
    }


@router.get("/activity-logs")
async def activity_logs(
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    from app.models.user_history import UserHistory
    result = await db.execute(
        select(UserHistory).order_by(UserHistory.met_at.desc()).limit(limit)
    )
    records = result.scalars().all()
    return {
        "items": [
            {
                "user_id": str(r.user_id),
                "other_user_id": str(r.other_user_id),
                "activity_id": str(r.activity_id) if r.activity_id else None,
                "group_id": str(r.group_id) if r.group_id else None,
                "met_at": str(r.met_at),
            }
            for r in records
        ]
    }
