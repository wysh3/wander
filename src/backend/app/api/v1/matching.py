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
    async with async_session_factory() as db:
        try:
            result = await db.execute(select(Activity).where(Activity.id == activity_id))
            activity = result.scalar_one_or_none()
            if not activity:
                await _match_redis_set(match_key, {"status": "failed", "error": "Activity not found"})
                return

            users_result = await db.execute(
                select(User).where(
                    User.personality_vector.isnot(None),
                    User.onboarding_completed == True,
                )
            )
            users = list(users_result.scalars().all())

            match_data = await _match_redis_get(match_key) or {}
            match_user_id = match_data.get("current_user_id")
            if match_user_id:
                current_user = await db.get(User, uuid.UUID(match_user_id))
                if current_user:
                    current_user_in_pool = any(u.id == current_user.id for u in users)
                    if not current_user_in_pool:
                        users.insert(0, current_user)

            users = users[:20]

            if activity.lat and activity.lng:
                import math
                def haversine_km(lat1, lng1, lat2, lng2):
                    R = 6371
                    dlat = math.radians(lat2 - lat1)
                    dlng = math.radians(lng2 - lng1)
                    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
                    return R * 2 * math.asin(math.sqrt(a))

                location_filtered = [u for u in users if u.home_lat and u.home_lng and
                         haversine_km(float(activity.lat), float(activity.lng), float(u.home_lat), float(u.home_lng)) <= 20.0]
                if location_filtered:
                    users = location_filtered

            if not users:
                await _match_redis_set(match_key, {"status": "failed", "error": "No users available for matching"})
                return

            history_result = await db.execute(select(UserHistory))
            history_records = history_result.scalars().all()

            hosts_result = await db.execute(select(Host).where(Host.active == True))
            available_hosts = hosts_result.scalars().all()
            host_indices = list(range(min(len(available_hosts), activity.max_groups)))

            await _match_redis_set(match_key, {"status": "solving", "progress": 50, "total_users": len(users), "current_user_id": match_user_id})

            groups, stats = solve_matching(users, activity, host_indices, history_records)

            saved_groups = []
            user_assigned = False
            for g_data in groups:
                host_uuid = None
                if g_data["group_index"] < len(host_indices):
                    host_uuid = available_hosts[g_data["group_index"]].user_id

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
