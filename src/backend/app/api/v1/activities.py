from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
import base64
import json
import math

from app.api.deps import get_db, get_current_user
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import ActivityResponse, ActivityListParams, JoinActivityResponse
from app.schemas.common import PaginatedResponse
from app.services.recommendations import get_recommendations
from app.services.geolocation import haversine_km

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ActivityResponse])
async def list_activities(
    category: str | None = Query(None),
    area: str | None = Query(None),
    date: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    lat: float | None = Query(None, description="User's latitude for distance-aware sorting"),
    lng: float | None = Query(None, description="User's longitude for distance-aware sorting"),
    radius_km: float | None = Query(None, ge=1, le=100, description="Max distance radius filter"),
    sort_by: str = Query("distance", pattern="^(distance|date)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    List open activities. When lat/lng is provided, computes distance
    from user and sorts by nearest first. Optionally filters by radius.
    """
    query = select(Activity).where(Activity.status == "open")

    if category:
        query = query.where(Activity.category == category)
    if area:
        query = query.where(Activity.area == area)
    if cursor:
        decoded = base64.b64decode(cursor).decode()
        cursor_data = json.loads(decoded)
        if "created_at" in cursor_data:
            query = query.where(Activity.created_at < cursor_data["created_at"])
        elif "distance" in cursor_data and "id" in cursor_data:
            # Cursor-based pagination for distance-sorted results
            query = query.where(
                (Activity.id != cursor_data["id"])  # Just offset marker
            )

    query = query.order_by(Activity.scheduled_at.asc())
    result = await db.execute(query)
    activities = list(result.scalars().all())

    # Compute distance for each activity if user coordinates provided
    user_has_location = lat is not None and lng is not None
    if user_has_location:
        for activity in activities:
            if activity.lat is not None and activity.lng is not None:
                activity_distance = haversine_km(
                    lat, lng, float(activity.lat), float(activity.lng)
                )
                # Store distance as a transient attribute for sorting
                activity._distance_km = round(activity_distance, 2)
            else:
                activity._distance_km = None

        # Filter by radius
        if radius_km is not None:
            activities = [
                a for a in activities
                if a._distance_km is not None and a._distance_km <= radius_km
            ]

        # Sort by distance (nulls last, then nearest first)
        if sort_by == "distance":
            activities.sort(key=lambda a: (
                a._distance_km is None,
                a._distance_km or 999999,
            ))
        else:
            # Sort by date but keep distance annotation
            activities.sort(key=lambda a: a.scheduled_at)
    else:
        for activity in activities:
            activity._distance_km = None

    # Paginate
    total = len(activities)
    has_more = total > limit
    items = activities[:limit]

    next_cursor = None
    if has_more:
        cursor_data = {}
        if sort_by == "distance" and items:
            last = items[-1]
            cursor_data = {
                "id": str(last.id),
                "distance": last._distance_km,
                "created_at": str(last.created_at),
            }
        elif items:
            cursor_data = {"created_at": str(items[-1].created_at)}
        next_cursor = base64.b64encode(json.dumps(cursor_data).encode()).decode()

    # Build response with distance
    response_items = []
    for a in items:
        # Validate from ORM object — Pydantic v2 uses from_attributes=True
        item = ActivityResponse.model_validate(a)
        # Inject computed distance
        item.distance_km = getattr(a, "_distance_km", None)
        response_items.append(item)

    return PaginatedResponse(
        items=response_items,
        next_cursor=next_cursor,
    )


@router.get("/recommended")
async def get_recommended_activities(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_recommendations(current_user, db, limit)


@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Activity", str(activity_id))

    return ActivityResponse.model_validate(activity)


@router.post("/{activity_id}/join", response_model=JoinActivityResponse)
async def join_activity(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Activity", str(activity_id))
    if activity.status != "open":
        from app.core.exceptions import AppError
        raise AppError("ACTIVITY_CLOSED", "Activity is no longer open for joining", 400)

    return JoinActivityResponse(joined=True, participant_count=0)
