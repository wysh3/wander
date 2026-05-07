"""Friend matching — multi-factor compatibility scoring + pgvector KNN pipeline."""

import math
import structlog
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.models.user import User
from app.models.user_history import UserHistory
from app.models.friend_connection import FriendConnection
from app.models.user_block import UserBlock

logger = structlog.get_logger()

VIBE_COMPAT = {
    "chill":       {"chill": 1.0, "balanced": 0.8, "energetic": 0.3, "curious": 0.6, "adventurous": 0.4, "creative": 0.7},
    "balanced":    {"chill": 0.8, "balanced": 1.0, "energetic": 0.7, "curious": 0.8, "adventurous": 0.6, "creative": 0.7},
    "energetic":   {"chill": 0.3, "balanced": 0.7, "energetic": 1.0, "curious": 0.6, "adventurous": 0.9, "creative": 0.5},
    "curious":     {"chill": 0.6, "balanced": 0.8, "energetic": 0.6, "curious": 1.0, "adventurous": 0.8, "creative": 0.9},
    "adventurous": {"chill": 0.4, "balanced": 0.6, "energetic": 0.9, "curious": 0.8, "adventurous": 1.0, "creative": 0.6},
    "creative":    {"chill": 0.7, "balanced": 0.7, "energetic": 0.5, "curious": 0.9, "adventurous": 0.6, "creative": 1.0},
}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def personality_similarity(user_a: User, user_b: User) -> float:
    from app.services.matching.scoring import personality_similarity as ps
    return ps(user_a, user_b)


def interest_overlap(user_a: User, user_b: User) -> float:
    a = set(user_a.interests or [])
    b = set(user_b.interests or [])
    if not a and not b:
        return 0.0
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def vibe_compatibility(user_a: User, user_b: User) -> float:
    a_v = user_a.vibe or "balanced"
    b_v = user_b.vibe or "balanced"
    return VIBE_COMPAT.get(a_v, {}).get(b_v, 0.5)


def location_proximity(user_a: User, user_b: User) -> float:
    if not all([user_a.home_lat, user_a.home_lng, user_b.home_lat, user_b.home_lng]):
        return 0.5
    dist = haversine_km(
        float(user_a.home_lat), float(user_a.home_lng),
        float(user_b.home_lat), float(user_b.home_lng),
    )
    combined = (float(user_a.travel_radius_km or 15)) + (float(user_b.travel_radius_km or 15))
    if dist <= 5.0:
        return 1.0
    if dist >= combined:
        return 0.0
    return 1.0 - (dist - 5.0) / (combined - 5.0)


def complementary_diversity(user_a: User, user_b: User) -> float:
    if not (user_a.personality_vector and user_b.personality_vector):
        return 0.0
    pv_a, pv_b = list(user_a.personality_vector), list(user_b.personality_vector)
    if len(pv_a) != 5 or len(pv_b) != 5:
        return 0.0

    adv_diff = abs(pv_a[0] - pv_b[0])
    con_diff = abs(pv_a[4] - pv_b[4])
    soc_diff = abs(pv_a[2] - pv_b[2])

    adv_score = max(0.0, 0.5 - abs(0.35 - adv_diff) / 0.35)
    con_score = max(0.0, 0.5 - abs(0.35 - con_diff) / 0.35)
    soc_score = max(0.0, 1.0 - soc_diff / 0.3)

    return adv_score * 0.35 + con_score * 0.35 + soc_score * 0.3


def compatibility(user_a: User, user_b: User) -> float:
    return (
        0.35 * personality_similarity(user_a, user_b)
        + 0.30 * interest_overlap(user_a, user_b)
        + 0.10 * vibe_compatibility(user_a, user_b)
        + 0.15 * location_proximity(user_a, user_b)
        + 0.10 * complementary_diversity(user_a, user_b)
    )


async def generate_friend_reason(user_a: User, user_b: User, score: float) -> str:
    try:
        from app.services.onboarding import call_nvidia

        shared = list(set(user_a.interests or []) & set(user_b.interests or []))
        prompt = (
            f"User A: interests={user_a.interests}, vibe={user_a.vibe}. "
            f"User B: interests={user_b.interests}, vibe={user_b.vibe}. "
            f"Compatibility score: {score:.0%}. "
            f"Shared interests: {shared}. "
            f"Give ONE friendly sentence under 120 chars explaining why they'd be good friends. "
            f"Reply ONLY with the sentence."
        )
        result = await call_nvidia(prompt)
        if result and isinstance(result, dict):
            reason = result.get("response") or result.get("reason", "")
            if reason:
                return reason
    except Exception:
        pass

    shared = list(set(user_a.interests or []) & set(user_b.interests or []))
    if shared:
        return f"You both love {shared[0]} — and you live nearby"
    if user_a.vibe == user_b.vibe:
        return f"Both {user_a.vibe} vibes — instant energy match"
    return f"Strong personality compatibility at {score:.0%}"


async def get_friend_suggestions(user: User, db: AsyncSession, limit: int = 10) -> list[dict]:
    cutoff = datetime.utcnow() - timedelta(days=90)

    met_result = await db.execute(
        select(UserHistory.other_user_id).where(
            UserHistory.user_id == user.id,
            UserHistory.met_at >= cutoff,
        )
    )
    met_ids = {row[0] for row in met_result.fetchall()}

    conn_result = await db.execute(
        select(FriendConnection.friend_id).where(
            FriendConnection.user_id == user.id,
            FriendConnection.status.in_(["accepted", "pending"]),
        )
    )
    connected_ids = {row[0] for row in conn_result.fetchall()}

    block_result = await db.execute(
        select(UserBlock.blocked_id).where(UserBlock.blocker_id == user.id)
    )
    blocked_ids = {row[0] for row in block_result.fetchall()}

    block_back_result = await db.execute(
        select(UserBlock.blocker_id).where(UserBlock.blocked_id == user.id)
    )
    blocked_by_ids = {row[0] for row in block_back_result.fetchall()}

    exclude_ids = met_ids | connected_ids | blocked_ids | blocked_by_ids | {user.id}

    if user.personality_vector is not None and len(user.personality_vector) == 5:
        vec_str = str(list(user.personality_vector))
        knn_query = text("""
            SELECT id, name, interests, vibe, home_lat, home_lng, travel_radius_km,
                   personality_vector, home_area,
                   personality_vector <=> CAST(:target_vector AS vector) AS distance
            FROM users
            WHERE id != :user_id
              AND onboarding_completed = true
              AND verification_status = 'verified'
              AND city = :city
            ORDER BY personality_vector <=> CAST(:target_vector AS vector)
            LIMIT :knn_limit
        """)
        try:
            result = await db.execute(knn_query, {
                "target_vector": vec_str,
                "user_id": user.id,
                "city": user.city,
                "knn_limit": 50,
            })
        except Exception:
            result = await db.execute(
                select(User).where(
                    User.id != user.id,
                    User.onboarding_completed == True,
                    User.verification_status == "verified",
                    User.city == user.city,
                ).limit(50)
            )

        candidates = result.fetchall()
    else:
        result = await db.execute(
            select(User).where(
                User.id != user.id,
                User.onboarding_completed == True,
                User.verification_status == "verified",
                User.city == user.city,
            ).limit(50)
        )
        candidates = result.fetchall()

    scored = []
    for row in candidates:
        if isinstance(row, tuple):
            candidate_id = row[0]
        else:
            candidate_id = row.id

        if candidate_id in exclude_ids:
            continue

        candidate = await db.get(User, candidate_id)
        if not candidate:
            continue

        score = compatibility(user, candidate)
        dist_km = 0.0
        if user.home_lat and user.home_lng and candidate.home_lat and candidate.home_lng:
            dist_km = round(haversine_km(
                float(user.home_lat), float(user.home_lng),
                float(candidate.home_lat), float(candidate.home_lng),
            ), 1)

        shared = list(set(user.interests or []) & set(candidate.interests or []))

        pdist = 0.0
        if isinstance(row, tuple) and len(row) > 8 and row[8] is not None:
            pdist = float(row[8])

        scored.append({
            "user": candidate,
            "compatibility": round(min(1.0, score), 2),
            "shared_interests": shared,
            "distance_km": dist_km,
            "personality_distance": round(pdist, 3),
        })

    scored.sort(key=lambda x: x["compatibility"], reverse=True)
    top = scored[:limit]

    for item in top[:3]:
        item["ai_reason"] = await generate_friend_reason(user, item["user"], item["compatibility"])

    return top
