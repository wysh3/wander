from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
import base64
import json

from app.api.deps import get_db, get_current_user
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import ActivityResponse, ActivityListParams, JoinActivityResponse
from app.schemas.common import PaginatedResponse
from app.services.recommendations import get_recommendations

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ActivityResponse])
async def list_activities(
    category: str | None = Query(None),
    area: str | None = Query(None),
    date: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    query = select(Activity).where(Activity.status == "open")

    if category:
        query = query.where(Activity.category == category)
    if area:
        query = query.where(Activity.area == area)
    if cursor:
        decoded = base64.b64decode(cursor).decode()
        cursor_data = json.loads(decoded)
        query = query.where(Activity.created_at < cursor_data["created_at"])

    query = query.order_by(Activity.scheduled_at.asc()).limit(limit + 1)
    result = await db.execute(query)
    activities = result.scalars().all()

    has_more = len(activities) > limit
    items = activities[:limit]
    next_cursor = None
    if has_more:
        cursor_data = json.dumps({"created_at": str(items[-1].created_at)})
        next_cursor = base64.b64encode(cursor_data.encode()).decode()

    return PaginatedResponse(
        items=[ActivityResponse.model_validate(a) for a in items],
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
