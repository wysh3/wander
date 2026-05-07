"""Report service — aggregation and PDF generation for Wander Reports."""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.models.group import Group, GroupMember


async def build_report_data(user_id: uuid.UUID, db: AsyncSession) -> dict:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return {}

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
            total_people_met += max(0, member_count or 0)
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
        "screen_time_percent": round((screen_time_delta / max(user.screen_time_before or 300, 1)) * 100, 1),
        "recent_groups": recent_groups[:5],
        "badges": [
            {"name": "First Adventure", "icon": "map_pin", "earned": True},
            {"name": "Social Butterfly", "icon": "users", "earned": True},
            {"name": "Explorer", "icon": "compass", "earned": True},
        ],
        "quote": "Every other app measures engagement with their platform. We measure engagement with the world.",
    }


def generate_pdf_text(data: dict) -> str:
    return f"""
Wander Report for {data.get('name', 'Wanderer')}
==================================================

Total Experiences: {data.get('total_experiences', 0)}
People Met: {data.get('total_people_met', 0)}
Neighborhoods Explored: {data.get('total_neighborhoods_explored', 0)}
Week Streak: {data.get('streak_weeks', 0)}

Screen Time Reduction: {data.get('screen_time_percent', 0)}%

Top Categories:
{chr(10).join(f"  - {c['category']}: {c['count']} times" for c in data.get('top_categories', []))}

Badges Earned:
{chr(10).join(f"  - {b['name']}" for b in data.get('badges', []) if b.get('earned'))}

"{data.get('quote', '')}"
""".strip()
