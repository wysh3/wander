"""Recommendation engine — hybrid scoring for activity suggestions."""

import math
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.models.user import User
from app.models.activity import Activity
from app.models.group import Group, GroupMember
from app.models.user_history import UserHistory

logger = structlog.get_logger()

CATEGORY_IDEAL_VECTORS = {
    "physical":    [0.90, 0.85, 0.50, 0.60, 0.50],
    "social_good": [0.40, 0.45, 0.85, 0.75, 0.80],
    "skill":       [0.40, 0.35, 0.55, 0.90, 0.70],
    "mental":      [0.20, 0.20, 0.40, 0.85, 0.85],
    "chaotic":     [0.85, 0.90, 0.85, 0.70, 0.25],
    "explore":     [0.75, 0.55, 0.70, 0.85, 0.45],
    "slow":        [0.15, 0.15, 0.45, 0.55, 0.80],
}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def cosine_similarity_vecs(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or len(a) == 0:
        return 0.0
    dot = float(sum(x * y for x, y in zip(a, b)))
    norm_a = math.sqrt(sum(float(x) * float(x) for x in a))
    norm_b = math.sqrt(sum(float(y) * float(y) for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def interest_match(user: User, activity: Activity) -> float:
    activity_tags = set(activity.tags or [])
    user_interests = set(user.interests or [])

    if not activity_tags:
        return 0.5
    if not user_interests:
        return 0.5

    intersection = user_interests & activity_tags
    union = user_interests | activity_tags
    return len(intersection) / len(union) if union else 0.0


def location_score(user: User, activity: Activity) -> float:
    if not (user.home_lat and user.home_lng and activity.lat and activity.lng):
        return 0.5

    dist = haversine_km(float(user.home_lat), float(user.home_lng), float(activity.lat), float(activity.lng))
    radius = float(user.travel_radius_km or 15)

    if dist <= 5.0:
        return 1.0
    if dist >= radius:
        return 0.0
    return 1.0 - (dist - 5.0) / (radius - 5.0)


def personality_fit(user: User, activity: Activity) -> float:
    if user.personality_vector is None or len(user.personality_vector) != 5:
        return 0.5

    ideal = CATEGORY_IDEAL_VECTORS.get(activity.category)
    if not ideal:
        return 0.5

    return cosine_similarity_vecs(list(user.personality_vector), ideal)


async def social_proof(user: User, activity: Activity, db: AsyncSession) -> float:
    join_result = await db.execute(
        select(func.count(GroupMember.id)).join(Group, GroupMember.group_id == Group.id)
        .where(Group.activity_id == activity.id)
    )
    join_count = join_result.scalar() or 0
    if join_count == 0:
        return 0.5

    if user.personality_vector is None or len(user.personality_vector) != 5:
        return 0.5

    pv = list(user.personality_vector)
    threshold = 0.15

    similar_count = 0
    members_result = await db.execute(
        select(GroupMember.user_id).join(Group, GroupMember.group_id == Group.id)
        .where(Group.activity_id == activity.id)
    )
    member_ids = [row[0] for row in members_result.fetchall()]

    for member_id in member_ids:
        m_result = await db.execute(
            select(User.personality_vector).where(User.id == member_id)
        )
        mpv = m_result.scalar_one_or_none()
        if mpv is not None and len(mpv) == 5:
            dist = 1.0 - cosine_similarity_vecs(pv, list(mpv))
            if dist <= threshold:
                similar_count += 1

    return min(1.0, similar_count / max(1, join_count))


async def score_activity(user: User, activity: Activity, db: AsyncSession) -> dict:
    interest = interest_match(user, activity)
    location = location_score(user, activity)
    personality = personality_fit(user, activity)
    social = await social_proof(user, activity, db)

    total = float(0.40 * interest + 0.25 * location + 0.15 * personality + 0.20 * social)

    return {
        "score": round(total, 2),
        "score_breakdown": {
            "interest_match": round(float(interest), 2),
            "location_score": round(float(location), 2),
            "personality_fit": round(float(personality), 2),
            "social_proof": round(float(social), 2),
        },
    }


def _fallback_reason(user: User, activity: Activity) -> str:
    shared = [i for i in (user.interests or []) if i in (activity.tags or [])]
    if shared:
        return f"Perfect for {', '.join(shared[:2])} enthusiasts like you"
    if user.vibe:
        return f"A {activity.category} experience suited for your {user.vibe} vibe"
    return f"Popular in {activity.area or 'your area'}"


async def generate_reason(user: User, activity: Activity) -> str:
    try:
        from app.services.onboarding import call_nvidia
        from app.config import get_settings

        settings = get_settings()
        pv = list(user.personality_vector) if user.personality_vector else [0.5] * 5

        prompt = (
            f"This user has interests: {user.interests}. Their vibe is {user.vibe}. "
            f"Personality: adventure={pv[0]:.2f}, energy={pv[1]:.2f}, social={pv[2]:.2f}, "
            f"openness={pv[3]:.2f}, conscientiousness={pv[4]:.2f}. "
            f"Recommend this activity: '{activity.title}' ({activity.category}) in {activity.area}. "
            f"Give ONE compelling sentence under 100 chars explaining why it matches them. Reply ONLY with the sentence."
        )

        result = await call_nvidia(prompt)
        if result and isinstance(result, dict) and result.get("personality_vector") is None:
            reason = result.get("response") or result.get("reason", "")
            if reason:
                return reason

        return _fallback_reason(user, activity)
    except Exception:
        return _fallback_reason(user, activity)


async def get_recommendations(
    user: User, db: AsyncSession, limit: int = 5,
) -> list[dict]:
    result = await db.execute(
        select(Activity).where(Activity.status == "open").order_by(Activity.scheduled_at.asc())
    )
    activities = result.scalars().all()

    scored = []
    for activity in activities:
        s = await score_activity(user, activity, db)
        scored.append((activity, s))

    scored.sort(key=lambda x: x[1]["score"], reverse=True)
    top = scored[:limit]

    output = []
    for activity, s in top:
        from app.schemas.activity import ActivityResponse

        reason = await generate_reason(user, activity)

        output.append({
            "activity": ActivityResponse.model_validate(activity),
            "score": s["score"],
            "ai_reason": reason,
            "score_breakdown": s["score_breakdown"],
        })

    return output
