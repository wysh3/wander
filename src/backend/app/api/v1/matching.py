from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import json

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.activity import Activity
from app.models.user_history import UserHistory
from app.models.group import Group, GroupMember
from app.models.host import Host
from app.schemas.matching import MatchStartedResponse, MatchStatusResponse, MatchResultResponse, GroupResult, ConstraintStats
from app.services.matching.engine import solve_matching
from app.core.exceptions import NotFoundError, MatchingError

router = APIRouter()

MATCH_TTL = 3600


def _compute_group_score(members: list[dict]) -> float:
    """Compute average weighted personality similarity within a group."""
    if len(members) < 2:
        return 0.80
    weights = [1.0, 0.8, 0.7, 1.0, 1.5]
    total = 0.0
    count = 0
    for i in range(len(members)):
        v1 = members[i].get("vector")
        if not v1 or len(v1) != 5:
            continue
        for j in range(i + 1, len(members)):
            v2 = members[j].get("vector")
            if not v2 or len(v2) != 5:
                continue
            dot = sum(w * a * b for w, a, b in zip(weights, v1, v2))
            n1 = sum(w * a * a for w, a in zip(weights, v1)) ** 0.5
            n2 = sum(w * b * b for w, b in zip(weights, v2)) ** 0.5
            if n1 > 0 and n2 > 0:
                total += dot / (n1 * n2)
            count += 1
    return round(total / count, 2) if count > 0 else 0.80


def _get_redis():
    from app.db.redis import _redis_pool
    return _redis_pool


async def _match_redis_set(key: str, data: dict):
    redis = _get_redis()
    if redis:
        await redis.setex(f"match:{key}", MATCH_TTL, json.dumps(data, default=str))


async def _match_redis_get(key: str) -> dict | None:
    redis = _get_redis()
    if redis:
        raw = await redis.get(f"match:{key}")
        if raw:
            return json.loads(raw)
    return None


async def _run_matching_task(match_key: str, activity_id: uuid.UUID):
    from app.db.session import async_session_factory
    from app.services.geolocation import haversine_km as geo_haversine
    from app.services.nearby_users import (
        fetch_active_users_within_radius,
        filter_by_travel_time,
    )

    async with async_session_factory() as db:
        try:
            result = await db.execute(select(Activity).where(Activity.id == activity_id))
            activity = result.scalar_one_or_none()
            if not activity:
                await _match_redis_set(match_key, {"status": "failed", "error": "Activity not found"})
                return

            match_data = await _match_redis_get(match_key) or {}
            match_user_id = match_data.get("current_user_id")

            # --- PHASE 1: Fetch the requesting user first ---
            current_user = None
            if match_user_id:
                current_user = await db.get(User, uuid.UUID(match_user_id))

            # Determine geo-center: use activity location, or current user's live location
            center_lat = None
            center_lng = None
            search_radius_km = 20.0

            if activity.lat and activity.lng:
                center_lat = float(activity.lat)
                center_lng = float(activity.lng)
            elif current_user and current_user.live_lat and current_user.live_lng:
                center_lat = float(current_user.live_lat)
                center_lng = float(current_user.live_lng)

            if current_user:
                search_radius_km = float(current_user.preferred_radius_km or 20)

            await _match_redis_set(match_key, {
                "status": "running",
                "progress": 5,
                "phase": "geo_filtering",
                "current_user_id": match_user_id,
            })

            # --- PHASE 2: Geo-filtered user acquisition ---
            if center_lat is not None and center_lng is not None:
                # Use live GPS + PostGIS for hyperlocal matching
                users = await fetch_active_users_within_radius(
                    db=db,
                    origin_lat=center_lat,
                    origin_lng=center_lng,
                    radius_km=search_radius_km,
                    user_id_to_exclude=match_user_id,
                    limit=100,
                    activity_cutoff_minutes=30,
                )
                geo_method = "postgis_live_gps"
            else:
                # Fallback: fetch users by home location proximity
                users_result = await db.execute(
                    select(User).where(
                        User.personality_vector.isnot(None),
                        User.onboarding_completed == True,
                    )
                )
                users = list(users_result.scalars().all())

                if center_lat and center_lng:
                    users = [
                        u
                        for u in users
                        if u.home_lat
                        and u.home_lng
                        and geo_haversine(
                            center_lat, center_lng, float(u.home_lat), float(u.home_lng)
                        )
                        <= search_radius_km
                    ]
                geo_method = "home_haversine"

            # Insert current user at front if not already in pool
            if current_user:
                current_user_in_pool = any(u.id == current_user.id for u in users)
                if not current_user_in_pool:
                    users.insert(0, current_user)

            if not users:
                await _match_redis_set(match_key, {
                    "status": "failed",
                    "error": "No nearby users available. Try increasing your search radius.",
                })
                return

            await _match_redis_set(match_key, {
                "status": "running",
                "progress": 15,
                "phase": "geo_filtering",
                "total_users": len(users),
                "geo_method": geo_method,
                "search_radius_km": search_radius_km,
                "current_user_id": match_user_id,
            })

            # --- PHASE 3: Travel-time feasibility check ---
            travel_time_users = users
            if center_lat is not None and center_lng is not None and len(users) > 1:
                travel_time_users = await filter_by_travel_time(
                    origin_lat=center_lat,
                    origin_lng=center_lng,
                    users=users,
                    max_travel_minutes=30.0,
                )
                if travel_time_users:
                    users = travel_time_users
                # If all filtered out, keep original pool (graceful degradation)

            # Limit pool size for solver performance
            users = users[:50]

            await _match_redis_set(match_key, {
                "status": "running",
                "progress": 25,
                "phase": "constraints",
                "total_users": len(users),
                "current_user_id": match_user_id,
            })

            history_result = await db.execute(select(UserHistory))
            history_records = history_result.scalars().all()

            hosts_result = await db.execute(select(Host).where(Host.active == True))
            available_hosts = hosts_result.scalars().all()

            user_id_to_index = {str(u.id): i for i, u in enumerate(users)}
            host_indices = []
            for host in available_hosts:
                host_user_id_str = str(host.user_id)
                if host_user_id_str in user_id_to_index:
                    host_indices.append(user_id_to_index[host_user_id_str])
            host_indices = host_indices[:activity.max_groups]

            await _match_redis_set(match_key, {"status": "solving", "progress": 50, "total_users": len(users), "current_user_id": match_user_id})

            groups, stats = solve_matching(users, activity, host_indices, history_records)

            if not groups:
                await _match_redis_set(match_key, {
                    "status": "failed",
                    "error": "No feasible groups found. Try increasing your search radius or adjusting group size settings.",
                })
                return

            saved_groups = []
            user_assigned = False
            for g_data in groups:
                host_uuid = None
                if g_data["group_index"] < len(host_indices):
                    host_user_idx = host_indices[g_data["group_index"]]
                    if host_user_idx < len(users):
                        host_uuid = users[host_user_idx].id

                group = Group(
                    activity_id=activity.id,
                    host_id=host_uuid,
                    match_score=0.85,
                    no_show_risk=0.12,
                    status="pending",
                )
                db.add(group)
                await db.flush()

                for user_id_str in g_data["user_ids"]:
                    if match_user_id and user_id_str == match_user_id:
                        user_assigned = True
                    member = GroupMember(
                        group_id=group.id,
                        user_id=uuid.UUID(user_id_str),
                    )
                    db.add(member)

                saved_groups.append({
                    "id": str(group.id),
                    "host_id": str(host_uuid) if host_uuid else None,
                    "member_ids": g_data["user_ids"],
                    "members": g_data["members"],
                    "activity_title": activity.title,
                    "activity_category": activity.category,
                    "scheduled_at": activity.scheduled_at.isoformat() if activity.scheduled_at else None,
                    "area": activity.area,
                    "match_score": _compute_group_score(g_data["members"]),
                })

            if not user_assigned and groups and match_user_id:
                group = Group(
                    activity_id=activity.id,
                    host_id=None,
                    match_score=0.80,
                    no_show_risk=0.15,
                    status="pending",
                )
                db.add(group)
                await db.flush()
                db.add(GroupMember(group_id=group.id, user_id=uuid.UUID(match_user_id)))
                saved_groups.insert(0, {
                    "id": str(group.id),
                    "host_id": None,
                    "member_ids": [match_user_id],
                    "members": [{"id": match_user_id, "name": "You", "gender": None}],
                    "activity_title": activity.title,
                    "activity_category": activity.category,
                    "scheduled_at": activity.scheduled_at.isoformat() if activity.scheduled_at else None,
                    "area": activity.area,
                    "match_score": 0.80,
                })

            await db.commit()

            await _match_redis_set(match_key, {
                "status": "complete",
                "progress": 100,
                "total_users": len(users),
                "groups": saved_groups,
                "stats": stats,
                "current_user_id": match_user_id,
            })

        except Exception as e:
            await _match_redis_set(match_key, {"status": "failed", "error": str(e)})


@router.post("/{activity_id}", response_model=MatchStartedResponse)
async def trigger_matching(
    activity_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise NotFoundError("Activity", str(activity_id))

    users_result = await db.execute(
        select(User).where(
            User.personality_vector.isnot(None),
            User.onboarding_completed == True,
        )
    )
    users = list(users_result.scalars().all())
    total_users = len(users[:20])

    match_key = str(activity_id)
    await _match_redis_set(match_key, {
        "status": "running",
        "progress": 0,
        "total_users": total_users,
        "current_user_id": str(current_user.id),
    })

    background_tasks.add_task(_run_matching_task, match_key, activity_id)

    return MatchStartedResponse(
        match_key=match_key,
        status="running",
        total_users=total_users,
    )


@router.get("/{activity_id}/status", response_model=MatchStatusResponse)
async def get_match_status(
    activity_id: uuid.UUID,
):
    match_key = str(activity_id)
    status_data = await _match_redis_get(match_key) or {"status": "idle", "progress": 0, "total_users": 0}
    return MatchStatusResponse(
        status=status_data.get("status", "idle"),
        progress=status_data.get("progress", 0),
        total_users=status_data.get("total_users", 0),
        phase=status_data.get("phase"),
    )


@router.get("/{activity_id}/result", response_model=MatchResultResponse)
async def get_match_result(
    activity_id: uuid.UUID,
):
    match_key = str(activity_id)
    status_data = await _match_redis_get(match_key)

    if not status_data or status_data.get("status") != "complete":
        return MatchResultResponse(groups=[], total_users=0, total_groups=0)

    stats = status_data.get("stats", {})
    groups = [
        GroupResult(
            id=uuid.UUID(g["id"]) if g.get("id") else None,
            host_id=uuid.UUID(g["host_id"]) if g.get("host_id") else None,
            match_score=stats.get("match_score", 0.85),
            member_ids=[uuid.UUID(mid) for mid in g.get("member_ids", [])],
            members=g.get("members", []),
        )
        for g in status_data.get("groups", [])
    ]

    constraint_stats = None
    if any(k in stats for k in ("personality_similarity_avg", "repeat_pairs_avoided")):
        constraint_stats = ConstraintStats(
            personality_similarity_avg=stats.get("personality_similarity_avg", 0.0),
            repeat_pairs_avoided=stats.get("repeat_pairs_avoided", 0),
            women_only_groups=stats.get("women_only_groups", 0),
            hosts_assigned=stats.get("hosts_assigned", 0),
            total_constraints=stats.get("total_constraints", 6),
        )

    return MatchResultResponse(
        groups=groups,
        solved_in_ms=stats.get("solved_in_ms", 0),
        solver=stats.get("solver", "cp-sat"),
        total_users=stats.get("total_users", len(status_data.get("users", []))),
        total_groups=len(groups),
        constraint_stats=constraint_stats,
    )
