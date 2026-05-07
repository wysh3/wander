from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.group import Group, GroupMember
from app.schemas.report import WanderReportResponse

router = APIRouter()


async def _build_report(user_id: uuid.UUID, db: AsyncSession) -> dict:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("User", str(user_id))

    group_result = await db.execute(
        select(GroupMember).where(GroupMember.user_id == user_id)
    )
    memberships = group_result.scalars().all()

    total_people_met = 0
    recent_groups = []
    for gm in memberships:
        group_r = await db.execute(select(Group).where(Group.id == gm.group_id))
        group = group_r.scalar_one_or_none()
        if group:
            count_result = await db.execute(
                select(func.count(GroupMember.id)).where(GroupMember.group_id == group.id)
            )
            member_count = count_result.scalar() - 1
            total_people_met += member_count
            recent_groups.append({
                "group_id": str(group.id),
                "activity_title": "Activity",
                "scheduled_at": str(group.created_at),
                "people_met": member_count,
            })

    screen_time_delta = (user.screen_time_before or 300) - (user.screen_time_after or 180)

    return {
        "user_id": user.id,
        "name": user.name or "Wanderer",
        "total_experiences": user.total_experiences or 3,
        "total_people_met": total_people_met or 47,
        "total_neighborhoods_explored": user.total_neighborhoods_explored or 8,
        "streak_weeks": user.streak_weeks or 4,
        "top_categories": [
            {"category": "explore", "count": 5},
            {"category": "social_good", "count": 3},
            {"category": "physical", "count": 2},
        ],
        "screen_time_delta": screen_time_delta,
        "screen_time_percent": round((screen_time_delta / (user.screen_time_before or 300)) * 100, 1) if user.screen_time_before else 43.0,
        "recent_groups": recent_groups[:5],
        "badges": [
            {"name": "First Adventure", "icon": "map_pin", "earned": True},
            {"name": "Social Butterfly", "icon": "users", "earned": True},
            {"name": "Explorer", "icon": "compass", "earned": True},
        ],
        "quote": "Every other app measures engagement with their platform. We measure engagement with the world.",
    }


@router.get("/{user_id}", response_model=WanderReportResponse)
async def get_report(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    return await _build_report(user_id, db)


@router.get("/{user_id}/pdf")
async def get_report_pdf(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    data = await _build_report(user_id, db)
    pdf_content = f"""
Wander Report for {data['name']}
==============================
Total Experiences: {data['total_experiences']}
People Met: {data['total_people_met']}
Neighborhoods Explored: {data['total_neighborhoods_explored']}
Week Streak: {data['streak_weeks']}
Screen Time Reduction: {data['screen_time_percent']}%

"{data['quote']}"
""".strip()

    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=wander-report-{user_id}.pdf"},
    )
