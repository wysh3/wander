"""Admin Panel API — full CRUD for events, users, hosts, moderation, config, notifications, analytics."""
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, and_, or_
from datetime import datetime, timezone, timedelta
import uuid
import math

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.activity import Activity
from app.models.group import Group, GroupMember
from app.models.host import Host
from app.models.sos_event import SOSEvent
from app.models.chat_message import ChatMessage
from app.models.user_history import UserHistory
from app.models.admin import PlatformConfig, AdminNotification, FlaggedUser
from app.schemas.admin import (
    AdminStatsResponse, AdminEventCreate, AdminEventUpdate, AdminEventResponse,
    AttendeeResponse, AdminUserResponse, AdminUserDetailResponse, UserActionRequest,
    AdminHostResponse, FlaggedUserResponse, SOSIncidentResponse, ChatAuditResponse,
    ResolutionRequest, PlatformConfigResponse, ConfigUpdateRequest,
    NotificationCreate, NotificationResponse, PlatformReportResponse,
    ImageUploadResponse,
)
from app.schemas.common import PaginatedResponse

router = APIRouter()


# ── Auth guard ──
async def require_admin(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    if current_user.role != "admin":
        # Also check host table for backward compat
        r = await db.execute(
            select(Host).where(Host.user_id == current_user.id, Host.active == True)
        )
        if not r.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ═══════════════════════════════════════════════════════════════
# 1. DASHBOARD STATS
# ═══════════════════════════════════════════════════════════════
@router.get("/stats", response_model=AdminStatsResponse)
async def dashboard_stats(db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total events this month
    r = await db.execute(select(func.count(Activity.id)).where(Activity.created_at >= month_start))
    events_month = r.scalar() or 0

    # Total events all time
    r = await db.execute(select(func.count(Activity.id)))
    events_all = r.scalar() or 0

    # Total users
    r = await db.execute(select(func.count(User.id)))
    total_users = r.scalar() or 0

    # Active groups (status = 'matched' or 'pending')
    r = await db.execute(select(func.count(Group.id)).where(Group.status.in_(["matched", "pending"])))
    active_groups = r.scalar() or 0

    # SOS triggers 30d
    r = await db.execute(select(func.count(SOSEvent.id)).where(SOSEvent.triggered_at >= month_ago))
    sos_30d = r.scalar() or 0

    # Avg group rating (from non-null ratings in group_members)
    r = await db.execute(
        select(func.avg(GroupMember.rating)).where(GroupMember.rating != None)  # noqa: E711
    )
    avg_rating = r.scalar()
    avg_rating = round(float(avg_rating), 2) if avg_rating else 0.0

    # Avg screen time delta
    r = await db.execute(
        select(func.avg(User.screen_time_before - User.screen_time_after))
        .where(User.screen_time_before != None, User.screen_time_after != None)  # noqa: E711
    )
    avg_delta = r.scalar()
    avg_screen_delta = round(float(avg_delta), 1) if avg_delta else None

    # ── Chart data ──

    # Events per week (last 8 weeks)
    r = await db.execute(text("""
        SELECT date_trunc('week', created_at) AS week, COUNT(*) as count
        FROM activities
        WHERE created_at >= NOW() - INTERVAL '8 weeks'
        GROUP BY week ORDER BY week
    """))
    events_per_week = [{"week": str(row[0])[:10], "count": row[1]} for row in r.fetchall()]

    # Signups over time (last 8 weeks)
    r = await db.execute(text("""
        SELECT date_trunc('week', created_at) AS week, COUNT(*) as count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '8 weeks'
        GROUP BY week ORDER BY week
    """))
    signups = [{"week": str(row[0])[:10], "count": row[1]} for row in r.fetchall()]

    # Category distribution
    r = await db.execute(
        select(Activity.category, func.count(Activity.id)).where(Activity.category != None).group_by(Activity.category)  # noqa: E711
    )
    categories = [{"name": row[0] or "uncategorized", "count": row[1]} for row in r.fetchall()]

    # Matching success rate (groups formed vs joined users) per week
    r = await db.execute(text("""
        SELECT date_trunc('week', g.created_at) AS week,
               COUNT(DISTINCT g.id) as groups_formed,
               COUNT(DISTINCT gm.user_id) as users_matched
        FROM groups g
        LEFT JOIN group_members gm ON gm.group_id = g.id
        WHERE g.created_at >= NOW() - INTERVAL '8 weeks'
        GROUP BY week ORDER BY week
    """))
    matching = [{"week": str(row[0])[:10], "groups": row[1], "users": row[2]} for row in r.fetchall()]

    # SOS heatmap by hour
    r = await db.execute(text("""
        SELECT EXTRACT(HOUR FROM triggered_at)::int AS hour, COUNT(*) as count
        FROM sos_events
        WHERE triggered_at >= NOW() - INTERVAL '30 days'
        GROUP BY hour ORDER BY hour
    """))
    sos_heatmap = [{"hour": row[0], "count": row[1]} for row in r.fetchall()]

    return AdminStatsResponse(
        total_events_this_month=events_month,
        total_events_all_time=events_all,
        total_users=total_users,
        active_groups_now=active_groups,
        sos_triggers_30d=sos_30d,
        avg_group_rating=avg_rating,
        avg_screen_time_delta=avg_screen_delta,
        events_per_week=events_per_week,
        signups_over_time=signups,
        category_distribution=categories,
        matching_success_rate=matching,
        sos_heatmap=sos_heatmap,
    )


# ═══════════════════════════════════════════════════════════════
# 2. EVENTS MANAGEMENT
# ═══════════════════════════════════════════════════════════════
@router.get("/events", response_model=PaginatedResponse)
async def list_events(
    status: str | None = Query(None),
    category: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    q = select(Activity).order_by(Activity.scheduled_at.desc())
    if status:
        q = q.where(Activity.status == status)
    if category:
        q = q.where(Activity.category == category)
    if date_from:
        q = q.where(Activity.scheduled_at >= date_from)
    if date_to:
        q = q.where(Activity.scheduled_at <= date_to)

    offset = (page - 1) * limit
    q = q.offset(offset).limit(limit)

    r = await db.execute(q)
    events = r.scalars().all()

    # Count participants per event
    items = []
    for e in events:
        pr = await db.execute(
            select(func.count(GroupMember.id))
            .join(Group, GroupMember.group_id == Group.id)
            .where(Group.activity_id == e.id)
        )
        participant_count = pr.scalar() or 0

        host_name = None
        if e.host_user_id:
            hr = await db.execute(select(User.name).where(User.id == e.host_user_id))
            host_name = hr.scalar_one_or_none()

        items.append(AdminEventResponse(
            id=e.id,
            title=e.title,
            description=e.description,
            category=e.category,
            lat=e.lat,
            lng=e.lng,
            area=e.area,
            city=e.city,
            scheduled_at=e.scheduled_at,
            duration_minutes=e.duration_minutes,
            group_size_min=e.group_size_min,
            group_size_max=e.group_size_max,
            max_groups=e.max_groups,
            host_ids=e.host_ids or [],
            host_user_id=e.host_user_id,
            host_name=host_name,
            status=e.status,
            is_local_event=e.is_local_event,
            cover_photo_url=e.cover_photo_url,
            min_capacity=e.min_capacity,
            max_capacity=e.max_capacity,
            ticket_type=e.ticket_type,
            ticket_price_inr=e.ticket_price_inr,
            visibility=e.visibility,
            tags=e.tags or [],
            participant_count=participant_count,
            created_at=e.created_at,
        ))

    total_r = await db.execute(select(func.count(Activity.id)))
    total = total_r.scalar() or 0

    return PaginatedResponse(items=items)


@router.post("/events", response_model=AdminEventResponse)
async def create_event(
    body: AdminEventCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
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
        host_user_id=body.host_user_id,
        host_ids=[body.host_user_id] if body.host_user_id else [],
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


@router.get("/events/{event_id}", response_model=AdminEventResponse)
async def get_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    r = await db.execute(select(Activity).where(Activity.id == event_id))
    event = r.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    pr = await db.execute(
        select(func.count(GroupMember.id))
        .join(Group, GroupMember.group_id == Group.id)
        .where(Group.activity_id == event.id)
    )
    participant_count = pr.scalar() or 0

    host_name = None
    if event.host_user_id:
        hr = await db.execute(select(User.name).where(User.id == event.host_user_id))
        host_name = hr.scalar_one_or_none()

    return AdminEventResponse(
        id=event.id, title=event.title, description=event.description,
        category=event.category, lat=event.lat, lng=event.lng, area=event.area,
        city=event.city, scheduled_at=event.scheduled_at, duration_minutes=event.duration_minutes,
        group_size_min=event.group_size_min, group_size_max=event.group_size_max,
        max_groups=event.max_groups, host_ids=event.host_ids or [],
        host_user_id=event.host_user_id, host_name=host_name,
        status=event.status, is_local_event=event.is_local_event,
        cover_photo_url=event.cover_photo_url, min_capacity=event.min_capacity,
        max_capacity=event.max_capacity, ticket_type=event.ticket_type,
        ticket_price_inr=event.ticket_price_inr, visibility=event.visibility,
        tags=event.tags or [], participant_count=participant_count,
        created_at=event.created_at,
    )


@router.put("/events/{event_id}", response_model=AdminEventResponse)
async def update_event(
    event_id: uuid.UUID,
    body: AdminEventUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    r = await db.execute(select(Activity).where(Activity.id == event_id))
    event = r.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = body.model_dump(exclude_unset=True)
    if "host_user_id" in update_data and update_data["host_user_id"]:
        update_data["host_ids"] = [update_data["host_user_id"]]
    for key, val in update_data.items():
        setattr(event, key, val)
    await db.commit()
    await db.refresh(event)

    pr = await db.execute(
        select(func.count(GroupMember.id))
        .join(Group, GroupMember.group_id == Group.id)
        .where(Group.activity_id == event.id)
    )
    participant_count = pr.scalar() or 0

    host_name = None
    if event.host_user_id:
        hr = await db.execute(select(User.name).where(User.id == event.host_user_id))
        host_name = hr.scalar_one_or_none()

    return AdminEventResponse(
        id=event.id, title=event.title, description=event.description,
        category=event.category, lat=event.lat, lng=event.lng, area=event.area,
        city=event.city, scheduled_at=event.scheduled_at, duration_minutes=event.duration_minutes,
        group_size_min=event.group_size_min, group_size_max=event.group_size_max,
        max_groups=event.max_groups, host_ids=event.host_ids or [],
        host_user_id=event.host_user_id, host_name=host_name,
        status=event.status, is_local_event=event.is_local_event,
        cover_photo_url=event.cover_photo_url, min_capacity=event.min_capacity,
        max_capacity=event.max_capacity, ticket_type=event.ticket_type,
        ticket_price_inr=event.ticket_price_inr, visibility=event.visibility,
        tags=event.tags or [], participant_count=participant_count,
        created_at=event.created_at,
    )


@router.post("/events/{event_id}/run-matching")
async def trigger_matching(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    r = await db.execute(select(Activity).where(Activity.id == event_id))
    event = r.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get all participants who joined this event
    mr = await db.execute(
        select(User)
        .join(GroupMember, GroupMember.user_id == User.id)
        .join(Group, Group.id == GroupMember.group_id)
        .where(Group.activity_id == event_id)
        .distinct()
    )
    users = mr.scalars().all()

    if len(users) < event.group_size_min:
        return {"matched": False, "reason": f"Not enough users ({len(users)} < min {event.group_size_min})"}

    # Run CP-SAT solver
    from app.services.matching.engine import solve_matching
    hr = await db.execute(
        select(UserHistory).where(UserHistory.activity_id == event_id).limit(500)
    )
    history = hr.scalars().all()

    host_indices = []
    hosts_raw = event.host_ids or []
    for i, u in enumerate(users):
        if u.id in hosts_raw:
            host_indices.append(i)

    groups, stats = solve_matching(users, event, host_indices, history)

    # Save groups to DB
    created_groups = []
    for g in groups:
        group = Group(
            activity_id=event.id,
            host_id=uuid.UUID(g["user_ids"][0]) if g["user_ids"] else None,
            match_score=stats.get("personality_similarity_avg", 0),
            status="matched",
            chat_opens_at=datetime.utcnow(),
            chat_expires_at=event.scheduled_at + timedelta(days=4),
        )
        db.add(group)
        await db.flush()
        for uid in g["user_ids"]:
            gm = GroupMember(
                group_id=group.id,
                user_id=uuid.UUID(uid),
                role="member",
            )
            db.add(gm)
        created_groups.append({
            "group_id": str(group.id),
            "members": len(g["user_ids"]),
        })

    await db.commit()

    return {
        "matched": True,
        "groups_created": len(created_groups),
        "groups": created_groups,
        "stats": stats,
    }


@router.get("/events/{event_id}/attendees")
async def event_attendees(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    r = await db.execute(
        select(User, GroupMember, Group)
        .join(GroupMember, GroupMember.user_id == User.id)
        .join(Group, Group.id == GroupMember.group_id)
        .where(Group.activity_id == event_id)
        .order_by(GroupMember.created_at)
    )
    rows = r.all()

    items = []
    for u, gm, g in rows:
        items.append({
            "id": str(u.id),
            "name": u.name,
            "phone": u.phone[-4:].rjust(10, "*"),  # mask
            "verification_status": u.verification_status,
            "group_id": str(g.id) if g else None,
            "joined_at": gm.created_at,
        })
    return {"items": items, "total": len(items)}


@router.post("/events/bulk-action")
async def bulk_event_action(
    event_ids: list[uuid.UUID],
    action: str,  # publish | cancel | delete
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    if action not in ("publish", "cancel", "delete"):
        raise HTTPException(status_code=400, detail="Invalid action")

    for eid in event_ids:
        r = await db.execute(select(Activity).where(Activity.id == eid))
        event = r.scalar_one_or_none()
        if not event:
            continue
        if action == "publish":
            event.status = "open"
        elif action == "cancel":
            event.status = "cancelled"
        elif action == "delete":
            await db.delete(event)
    await db.commit()
    return {"ok": True, "action": action, "count": len(event_ids)}


# ═══════════════════════════════════════════════════════════════
# 3. USER MANAGEMENT
# ═══════════════════════════════════════════════════════════════
@router.get("/users", response_model=PaginatedResponse)
async def list_users(
    search: str | None = Query(None),
    verification_status: str | None = Query(None),
    role: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    q = select(User).order_by(User.created_at.desc())
    if search:
        q = q.where(
            or_(User.name.ilike(f"%{search}%"), User.phone.ilike(f"%{search}%"))
        )
    if verification_status:
        q = q.where(User.verification_status == verification_status)
    if role:
        q = q.where(User.role == role)

    offset = (page - 1) * limit
    q = q.offset(offset).limit(limit)
    r = await db.execute(q)
    users = r.scalars().all()

    items = []
    for u in users:
        # events attended
        er = await db.execute(
            select(func.count(func.distinct(Activity.id)))
            .join(Group, Group.activity_id == Activity.id)
            .join(GroupMember, GroupMember.group_id == Group.id)
            .where(GroupMember.user_id == u.id)
        )
        events_attended = er.scalar() or 0

        # is host
        hr = await db.execute(select(Host).where(Host.user_id == u.id, Host.active == True))
        is_host = hr.scalar_one_or_none() is not None

        # is flagged
        fr = await db.execute(
            select(FlaggedUser).where(FlaggedUser.user_id == u.id, FlaggedUser.status == "pending")
        )
        flagged = fr.scalar_one_or_none() is not None

        items.append(AdminUserResponse(
            id=u.id, phone=u.phone[-4:].rjust(10, "*"), name=u.name,
            email=u.email, gender=u.gender,
            verification_status=u.verification_status,
            onboarding_completed=u.onboarding_completed,
            role=u.role, events_attended=events_attended,
            is_host=is_host, flagged=flagged,
            banned=False, created_at=u.created_at,
        ))

    total_r = await db.execute(select(func.count(User.id)))
    total = total_r.scalar() or 0

    return PaginatedResponse(items=items)


@router.get("/users/{user_id}", response_model=AdminUserDetailResponse)
async def get_user_detail(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    r = await db.execute(select(User).where(User.id == user_id))
    u = r.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    # Events attended
    er = await db.execute(
        select(Activity.title, Activity.scheduled_at, Group.id)
        .join(Group, Group.activity_id == Activity.id)
        .join(GroupMember, GroupMember.group_id == Group.id)
        .where(GroupMember.user_id == u.id)
    )
    events = [{"title": row[0], "date": str(row[1]), "group_id": str(row[2])} for row in er.fetchall()]

    # Groups
    gr = await db.execute(
        select(Group.id, Group.status, Group.created_at, Activity.title)
        .join(Activity, Activity.id == Group.activity_id)
        .join(GroupMember, GroupMember.group_id == Group.id)
        .where(GroupMember.user_id == u.id)
    )
    groups = [{"id": str(row[0]), "status": row[1], "created": str(row[2]), "event": row[3]} for row in gr.fetchall()]

    # SOS history
    sr = await db.execute(
        select(SOSEvent).where(SOSEvent.user_id == u.id).order_by(SOSEvent.triggered_at.desc()).limit(10)
    )
    sos = [{"id": str(s.id), "resolved": s.resolved, "at": str(s.triggered_at)} for s in sr.scalars().all()]

    return AdminUserDetailResponse(
        id=u.id, phone=u.phone, name=u.name, email=u.email,
        date_of_birth=u.date_of_birth, gender=u.gender,
        verification_status=u.verification_status, role=u.role,
        personality_vector=u.personality_vector.tolist() if hasattr(u.personality_vector, 'tolist') and u.personality_vector is not None else None,
        interests=u.interests or [], vibe=u.vibe, home_area=u.home_area,
        total_experiences=u.total_experiences, total_people_met=u.total_people_met,
        screen_time_before=u.screen_time_before, screen_time_after=u.screen_time_after,
        events_attended=events, groups=groups, sos_history=sos,
        created_at=u.created_at,
    )


@router.put("/users/{user_id}")
async def user_action(
    user_id: uuid.UUID,
    body: UserActionRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    r = await db.execute(select(User).where(User.id == user_id))
    u = r.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if body.action == "promote_host":
        u.role = "host"
        existing = await db.execute(select(Host).where(Host.user_id == u.id))
        if not existing.scalar_one_or_none():
            db.add(Host(user_id=u.id, background_verified=True, active=True))
    elif body.action == "ban":
        # Create flagged entry
        db.add(FlaggedUser(
            user_id=u.id, flagged_by=admin_user.id,
            reason="Banned by admin", flag_type="manual",
            status="resolved",
        ))
    elif body.action == "unban":
        await db.execute(
            select(FlaggedUser).where(FlaggedUser.user_id == u.id).update(
                {"status": "resolved", "resolved_at": datetime.utcnow()}
            )
        )
    elif body.action == "flag":
        db.add(FlaggedUser(
            user_id=u.id, flagged_by=admin_user.id,
            flag_type="manual", status="pending",
        ))
    elif body.action == "trigger_reverify":
        u.verification_status = "pending"

    await db.commit()
    return {"ok": True, "action": body.action}


# ═══════════════════════════════════════════════════════════════
# 4. HOST MANAGEMENT
# ═══════════════════════════════════════════════════════════════
@router.get("/hosts")
async def list_hosts(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    r = await db.execute(
        select(Host, User.name)
        .join(User, User.id == Host.user_id)
        .order_by(Host.created_at.desc())
    )
    rows = r.all()

    items = []
    for host, name in rows:
        # Count events hosted
        er = await db.execute(
            select(func.count(Activity.id)).where(Activity.host_user_id == host.user_id)
        )
        events_hosted = er.scalar() or 0

        items.append(AdminHostResponse(
            id=host.id, user_id=host.user_id, user_name=name,
            total_experiences_hosted=events_hosted,
            rating_avg=host.rating_avg,
            background_verified=host.background_verified,
            active=host.active,
            specialties=host.specialties or [],
            created_at=host.created_at,
        ))

    return {"items": items}


@router.put("/hosts/{host_id}/toggle-active")
async def toggle_host_active(
    host_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    r = await db.execute(select(Host).where(Host.id == host_id))
    host = r.scalar_one_or_none()
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")
    host.active = not host.active
    await db.commit()
    return {"ok": True, "active": host.active}


# ═══════════════════════════════════════════════════════════════
# 5. CONTENT MODERATION
# ═══════════════════════════════════════════════════════════════
@router.get("/moderation/flags")
async def list_flagged_users(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    q = select(FlaggedUser).order_by(FlaggedUser.created_at.desc())
    if status:
        q = q.where(FlaggedUser.status == status)
    r = await db.execute(q.limit(100))
    flags = r.scalars().all()

    items = []
    for f in flags:
        ur = await db.execute(select(User.name, User.phone).where(User.id == f.user_id))
        urow = ur.first()
        items.append(FlaggedUserResponse(
            id=f.id, user_id=f.user_id,
            user_name=urow[0] if urow else None,
            user_phone=urow[1] if urow else None,
            reason=f.reason, flag_type=f.flag_type,
            status=f.status, admin_notes=f.admin_notes,
            created_at=f.created_at,
        ))
    return {"items": items}


@router.put("/moderation/flags/{flag_id}")
async def resolve_flag(
    flag_id: uuid.UUID,
    body: ResolutionRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    r = await db.execute(select(FlaggedUser).where(FlaggedUser.id == flag_id))
    flag = r.scalar_one_or_none()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    flag.status = "resolved"
    flag.admin_notes = body.admin_notes
    flag.resolved_at = datetime.utcnow()

    if body.action == "ban":
        ur = await db.execute(select(User).where(User.id == flag.user_id))
        user = ur.scalar_one_or_none()
        if user:
            user.role = "banned"
    elif body.action == "warn":
        # In production: send push notification to user
        pass

    await db.commit()
    return {"ok": True}


@router.get("/moderation/sos")
async def sos_incident_log(
    resolution_status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    q = select(SOSEvent).order_by(SOSEvent.triggered_at.desc())
    if resolution_status:
        q = q.where(SOSEvent.resolution_status == resolution_status)
    offset = (page - 1) * limit
    r = await db.execute(q.offset(offset).limit(limit))
    events = r.scalars().all()

    items = []
    for e in events:
        ur = await db.execute(select(User.name).where(User.id == e.user_id))
        urow = ur.first()
        items.append(SOSIncidentResponse(
            id=e.id, user_id=e.user_id,
            user_name=urow[0] if urow else None,
            group_id=e.group_id, lat=e.lat, lng=e.lng,
            nearest_police_station=e.nearest_police_station,
            resolved=e.resolved,
            resolution_status=e.resolution_status if hasattr(e, 'resolution_status') and e.resolution_status else 'open',
            admin_notes=e.admin_notes if hasattr(e, 'admin_notes') else None,
            triggered_at=e.triggered_at,
        ))
    return {"items": items, "total": len(items)}


@router.put("/moderation/sos/{sos_id}")
async def resolve_sos(
    sos_id: uuid.UUID,
    body: ResolutionRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    r = await db.execute(select(SOSEvent).where(SOSEvent.id == sos_id))
    event = r.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="SOS event not found")
    event.resolved = True
    event.resolution_status = "resolved"
    event.admin_notes = body.admin_notes
    event.resolved_by = admin_user.id
    event.resolved_at = datetime.utcnow()
    await db.commit()
    return {"ok": True}


@router.get("/moderation/chat/{group_id}")
async def chat_audit_log(
    group_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    # Verify group exists
    gr = await db.execute(select(Group).where(Group.id == group_id))
    if not gr.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Group not found")

    # Get messages
    mr = await db.execute(
        select(ChatMessage, User.name)
        .join(User, User.id == ChatMessage.user_id, isouter=True)
        .where(ChatMessage.group_id == group_id)
        .order_by(ChatMessage.created_at)
    )
    rows = mr.all()

    messages = [{
        "id": str(m.id),
        "user_id": str(m.user_id) if m.user_id else None,
        "user_name": name or "Unknown",
        "content": m.content,
        "type": m.message_type,
        "created_at": str(m.created_at),
    } for m, name in rows]

    # Member count
    count_r = await db.execute(
        select(func.count(GroupMember.id)).where(GroupMember.group_id == group_id)
    )
    member_count = count_r.scalar() or 0

    return ChatAuditResponse(group_id=group_id, messages=messages, member_count=member_count)


# ═══════════════════════════════════════════════════════════════
# 6. PLATFORM CONFIG
# ═══════════════════════════════════════════════════════════════
@router.get("/config")
async def get_platform_config(db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    r = await db.execute(select(PlatformConfig))
    configs = r.scalars().all()
    result = {}
    for c in configs:
        result[c.key] = c.value
    # Defaults
    defaults = {
        "feature_sos": True,
        "feature_ephemeral_chat": True,
        "feature_ai_matching": True,
        "feature_digilocker": True,
        "feature_wander_report": True,
        "matching_weights": {
            "personality_similarity": 0.30,
            "gender_balance": 0.15,
            "distance": 0.20,
            "interest_overlap": 0.20,
            "repeat_pair_penalty": 0.10,
            "no_show_penalty": 0.05,
        },
        "chat_ttl_pre_event_days": 2,
        "chat_ttl_post_event_days": 3,
        "default_group_size_min": 4,
        "default_group_size_max": 6,
        "banned_keywords": [],
    }
    for k, v in defaults.items():
        if k not in result:
            result[k] = v
    return {"config": result}


@router.put("/config")
async def update_platform_config(
    body: dict,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    for key, value in body.items():
        r = await db.execute(select(PlatformConfig).where(PlatformConfig.key == key))
        existing = r.scalar_one_or_none()
        if existing:
            existing.value = value if isinstance(value, dict) else {"value": value}
            existing.updated_by = admin_user.id
            existing.updated_at = datetime.utcnow()
        else:
            db.add(PlatformConfig(
                key=key,
                value=value if isinstance(value, dict) else {"value": value},
                updated_by=admin_user.id,
            ))
    await db.commit()
    return {"ok": True}


# ═══════════════════════════════════════════════════════════════
# 7. NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════
@router.get("/notifications")
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    r = await db.execute(
        select(AdminNotification).order_by(AdminNotification.created_at.desc()).limit(50)
    )
    notifs = r.scalars().all()
    items = [NotificationResponse(
        id=n.id, title=n.title, body=n.body,
        target_type=n.target_type, target_id=n.target_id,
        sent_at=n.sent_at, delivered_count=n.delivered_count,
        opened_count=n.opened_count, created_at=n.created_at,
    ) for n in notifs]
    return {"items": items}


@router.post("/notifications", response_model=NotificationResponse)
async def send_notification(
    body: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    now = datetime.utcnow()
    notif = AdminNotification(
        title=body.title,
        body=body.body,
        target_type=body.target_type,
        target_id=body.target_id,
        scheduled_at=body.scheduled_at,
        sent_at=now if not body.scheduled_at else None,
        created_by=admin_user.id,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)

    return NotificationResponse(
        id=notif.id, title=notif.title, body=notif.body,
        target_type=notif.target_type, target_id=notif.target_id,
        sent_at=notif.sent_at, delivered_count=0, opened_count=0,
        created_at=notif.created_at,
    )


# ═══════════════════════════════════════════════════════════════
# 8. PLATFORM WANDER REPORT
# ═══════════════════════════════════════════════════════════════
@router.get("/report/platform", response_model=PlatformReportResponse)
async def platform_report(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total real-world hours this month (sum of activity durations × participants)
    r = await db.execute(text("""
        SELECT COALESCE(SUM(a.duration_minutes), 0) / 60.0
        FROM activities a
        JOIN groups g ON g.activity_id = a.id
        JOIN group_members gm ON gm.group_id = g.id
        WHERE a.scheduled_at >= :month_start
    """), {"month_start": month_start})
    total_hours = (r.scalar() or 0.0) / 60.0  # already in hours

    # Strangers who became groups
    r = await db.execute(text("""
        SELECT COUNT(DISTINCT uh.user_id)
        FROM user_history uh
        WHERE uh.met_at >= :month_start
    """), {"month_start": month_start})
    strangers = r.scalar() or 0

    # Neighborhoods activated (areas with events)
    r = await db.execute(text("""
        SELECT area, lat, lng, COUNT(*) as event_count
        FROM activities
        WHERE scheduled_at >= :month_start AND area IS NOT NULL AND lat IS NOT NULL
        GROUP BY area, lat, lng
        ORDER BY event_count DESC
        LIMIT 20
    """), {"month_start": month_start})
    neighborhoods = [{"area": row[0], "lat": float(row[1]) if row[1] else None, "lng": float(row[2]) if row[2] else None, "events": row[3]} for row in r.fetchall()]

    # Platform screen time delta
    r = await db.execute(
        select(func.avg(User.screen_time_before - User.screen_time_after))
        .where(User.screen_time_before != None, User.screen_time_after != None)  # noqa: E711
    )
    delta = r.scalar()
    screen_delta = round(float(delta), 1) if delta else None

    # Top activities
    r = await db.execute(text("""
        SELECT a.title, COUNT(gm.id) as participants
        FROM activities a
        LEFT JOIN groups g ON g.activity_id = a.id
        LEFT JOIN group_members gm ON gm.group_id = g.id
        WHERE a.scheduled_at >= :month_start
        GROUP BY a.id, a.title
        ORDER BY participants DESC
        LIMIT 10
    """), {"month_start": month_start})
    top_activities = [{"title": row[0], "participants": row[1]} for row in r.fetchall()]

    impact = f"Wander generated {round(total_hours, 1)} real-world connection hours this month."
    if screen_delta:
        impact += f" Users saved an average of {screen_delta}h from screen time."

    return PlatformReportResponse(
        total_real_hours_this_month=round(total_hours, 1),
        total_strangers_became_groups=strangers,
        neighborhoods_activated=neighborhoods,
        platform_screen_time_delta_hours=screen_delta,
        top_activities=top_activities,
        impact_summary=impact,
    )


# ═══════════════════════════════════════════════════════════════
# 9. IMAGE UPLOAD
# ═══════════════════════════════════════════════════════════════
import os
import uuid as uuid_mod

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-image", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    _admin: User = Depends(require_admin),
):
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, GIF allowed")

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid_mod.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    url = f"/static/uploads/{filename}"
    return ImageUploadResponse(url=url, filename=filename)
