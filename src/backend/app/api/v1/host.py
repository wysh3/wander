from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.host import Host
from app.models.activity import Activity
from app.schemas.admin import GenerateEventsRequest, GenerateEventsResponse, AdminEventCreate, AdminEventResponse

router = APIRouter()


@router.get("/dashboard")
async def host_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    host_result = await db.execute(
        select(Host).where(Host.user_id == current_user.id)
    )
    host = host_result.scalar_one_or_none()

    if not host:
        return {
            "upcoming_groups": [],
            "stats": {"total_experiences_hosted": 0, "rating_avg": 0},
        }

    return {
        "upcoming_groups": [],
        "stats": {
            "total_experiences_hosted": host.total_experiences_hosted,
            "rating_avg": float(host.rating_avg) if host.rating_avg else 0,
        },
    }


@router.get("/groups")
async def host_groups(
    status: str = Query("upcoming"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {"items": []}


@router.post("/generate-local-events", response_model=GenerateEventsResponse)
async def host_generate_local_events(
    body: GenerateEventsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate local events by searching the web for real events."""
    from app.services.event_generation import generate_local_events as gen_events

    result = await gen_events(
        areas=body.areas,
        date_from=body.date_from,
        date_to=body.date_to,
        limit_per_area=body.limit_per_area,
    )
    return GenerateEventsResponse(**result)


@router.post("/events", response_model=AdminEventResponse)
async def host_create_event(
    body: AdminEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create an event as a host."""
    event = Activity(
        title=body.title,
        description=body.description,
        category=body.category,
        lat=body.lat,
        lng=body.lng,
        area=body.area,
        city=body.city,
        scheduled_at=body.scheduled_at,
        duration_minutes=body.duration_minutes,
        group_size_min=body.group_size_min,
        group_size_max=body.group_size_max,
        max_groups=body.max_groups,
        min_capacity=body.min_capacity,
        max_capacity=body.max_capacity,
        ticket_type=body.ticket_type,
        ticket_price_inr=body.ticket_price_inr,
        visibility=body.visibility,
        host_user_id=current_user.id,
        host_ids=[current_user.id],
        tags=body.tags or [],
        phone_free_encouraged=body.phone_free_encouraged,
        women_only=body.women_only,
        status=body.status,
        cover_photo_url=body.cover_photo_url,
        is_local_event=body.is_local_event,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    return AdminEventResponse(
        id=event.id, title=event.title, description=event.description,
        category=event.category, lat=event.lat, lng=event.lng, area=event.area,
        city=event.city, scheduled_at=event.scheduled_at, duration_minutes=event.duration_minutes,
        group_size_min=event.group_size_min, group_size_max=event.group_size_max,
        max_groups=event.max_groups, host_ids=event.host_ids or [],
        host_user_id=event.host_user_id, status=event.status,
        is_local_event=event.is_local_event, cover_photo_url=event.cover_photo_url,
        min_capacity=event.min_capacity, max_capacity=event.max_capacity,
        ticket_type=event.ticket_type, ticket_price_inr=event.ticket_price_inr,
        visibility=event.visibility, tags=event.tags or [],
        participant_count=0, created_at=event.created_at,
    )
