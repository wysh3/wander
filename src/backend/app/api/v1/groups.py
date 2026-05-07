from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.group import Group, GroupMember
from app.schemas.group import GroupResponse, GroupMemberResponse, RateGroupRequest
from app.core.exceptions import NotFoundError
from app.services.privacy import apply_privacy_filter

router = APIRouter()


@router.get("", response_model=list[GroupResponse])
async def list_my_groups(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Group).join(GroupMember, GroupMember.group_id == Group.id)
        .where(
            GroupMember.user_id == current_user.id,
            Group.group_type == "matching",
        )
        .order_by(Group.created_at.desc())
    )
    groups = result.scalars().all()

    is_admin = getattr(current_user, "role", "user") == "admin"
    output = []
    for group in groups:
        members_result = await db.execute(
            select(GroupMember, User).join(User, GroupMember.user_id == User.id)
            .where(GroupMember.group_id == group.id)
        )
        rows = members_result.all()
        members = []
        for gm, u in rows:
            filtered = apply_privacy_filter(current_user.id, u, is_admin=is_admin)
            members.append(
                GroupMemberResponse(
                    id=gm.id,
                    user_id=gm.user_id,
                    name=filtered.get("name"),
                    role=gm.role,
                    checked_in=gm.checked_in,
                    rating=gm.rating,
                )
            )

        host_name = None
        if group.host_id:
            host_result = await db.execute(select(User).where(User.id == group.host_id))
            host_user = host_result.scalar_one_or_none()
            if host_user:
                filtered_host = apply_privacy_filter(current_user.id, host_user, is_admin=is_admin)
                host_name = filtered_host.get("name")

        from app.models.activity import Activity
        activity_result = await db.execute(select(Activity).where(Activity.id == group.activity_id))
        activity = activity_result.scalar_one_or_none()

        output.append(GroupResponse(
            id=group.id, activity_id=group.activity_id,
            host_id=group.host_id, host_name=host_name,
            match_score=group.match_score, no_show_risk=group.no_show_risk,
            status=group.status, chat_opens_at=group.chat_opens_at,
            chat_expires_at=group.chat_expires_at, members=members,
            activity_title=activity.title if activity else None,
            activity_scheduled_at=activity.scheduled_at if activity else None,
            created_at=group.created_at,
        ))

    return output


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise NotFoundError("Group", str(group_id))

    is_admin = getattr(current_user, "role", "user") == "admin"

    members_result = await db.execute(
        select(GroupMember, User).join(User, GroupMember.user_id == User.id)
        .where(GroupMember.group_id == group_id)
    )
    rows = members_result.all()
    members = []
    for gm, u in rows:
        filtered = apply_privacy_filter(current_user.id, u, is_admin=is_admin)
        members.append(
            GroupMemberResponse(
                id=gm.id,
                user_id=gm.user_id,
                name=filtered.get("name"),
                role=gm.role,
                checked_in=gm.checked_in,
                rating=gm.rating,
            )
        )

    host_name = None
    if group.host_id:
        host_result = await db.execute(select(User).where(User.id == group.host_id))
        host_user = host_result.scalar_one_or_none()
        if host_user:
            filtered_host = apply_privacy_filter(current_user.id, host_user, is_admin=is_admin)
            host_name = filtered_host.get("name")

    from app.models.activity import Activity
    activity_result = await db.execute(select(Activity).where(Activity.id == group.activity_id))
    activity = activity_result.scalar_one_or_none()

    return GroupResponse(
        id=group.id,
        activity_id=group.activity_id,
        host_id=group.host_id,
        host_name=host_name,
        match_score=group.match_score,
        no_show_risk=group.no_show_risk,
        status=group.status,
        chat_opens_at=group.chat_opens_at,
        chat_expires_at=group.chat_expires_at,
        members=members,
        activity_title=activity.title if activity else None,
        activity_scheduled_at=activity.scheduled_at if activity else None,
        created_at=group.created_at,
    )


@router.post("/{group_id}/rate")
async def rate_group(
    group_id: uuid.UUID,
    body: RateGroupRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise NotFoundError("GroupMember", str(current_user.id))

    member.rating = body.rating
    await db.commit()
    return {"rated": True}
