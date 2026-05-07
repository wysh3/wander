from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
import json
import base64

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.group import Group, GroupMember
from app.schemas.community import (
    CommunityResponse,
    CommunityMemberResponse,
    CommunityCreateRequest,
    JoinLeaveResponse,
)
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundError, AppError
from app.services.privacy import apply_privacy_filter

router = APIRouter()


@router.get("", response_model=PaginatedResponse[CommunityResponse])
async def list_communities(
    interest: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    query = select(Group).where(
        Group.group_type == "community",
        Group.status != "archived",
    )

    if interest:
        query = query.where(Group.interest_tags.any(interest.lower()))

    if cursor:
        decoded = base64.b64decode(cursor).decode()
        cursor_data = json.loads(decoded)
        query = query.where(Group.created_at < cursor_data["created_at"])

    query = query.order_by(Group.created_at.desc()).limit(limit + 1)
    result = await db.execute(query)
    communities = result.scalars().all()

    has_more = len(communities) > limit
    items = communities[:limit]
    next_cursor = None
    if has_more:
        cursor_data = json.dumps({"created_at": str(items[-1].created_at)})
        next_cursor = base64.b64encode(cursor_data.encode()).decode()

    output = []
    for comm in items:
        output.append(await _build_community_response(db, comm, current_user))

    return PaginatedResponse(items=output, next_cursor=next_cursor)


@router.get("/suggested", response_model=list[CommunityResponse])
async def suggested_communities(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_interests = current_user.interests or []
    if not user_interests:
        result = await db.execute(
            select(Group)
            .where(Group.group_type == "community", Group.status != "archived")
            .order_by(func.random())
            .limit(limit)
        )
    else:
        result = await db.execute(
            select(Group)
            .where(
                Group.group_type == "community",
                Group.status != "archived",
                Group.interest_tags.overlap(user_interests),
            )
            .limit(limit * 3)
        )
        all_communities = result.scalars().all()

        scored = []
        for comm in all_communities:
            tags = set(comm.interest_tags or [])
            user_tags = set(user_interests)
            overlap = len(tags & user_tags)
            member_count = 0
            count_result = await db.execute(
                select(func.count(GroupMember.id)).where(GroupMember.group_id == comm.id)
            )
            member_count = count_result.scalar() or 0
            relevance = (overlap / len(tags) * 0.6 + min(member_count / 50, 1.0) * 0.4) if tags else 0
            scored.append((comm, relevance))

        scored.sort(key=lambda x: x[1], reverse=True)
        all_communities = [s[0] for s in scored[:limit]]
        result = None

    output = []
    for comm in all_communities:
        output.append(await _build_community_response(db, comm, current_user))

    return output


@router.get("/{community_id}", response_model=CommunityResponse)
async def get_community(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    result = await db.execute(
        select(Group).where(
            Group.id == community_id,
            Group.group_type == "community",
        )
    )
    community = result.scalar_one_or_none()
    if not community:
        raise NotFoundError("Community", str(community_id))

    return await _build_community_response(db, community, current_user)


@router.post("", response_model=CommunityResponse, status_code=201)
async def create_community(
    body: CommunityCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.verification_status != "verified":
        raise AppError("UNVERIFIED", "Only verified users can create communities", 403)

    community = Group(
        group_type="community",
        name=body.name,
        interest_tags=body.interest_tags,
        description=body.description,
        cover_image_url=body.cover_image_url,
        rules=body.rules,
        member_limit=body.member_limit,
        status="active",
        host_id=current_user.id,
    )
    db.add(community)
    await db.flush()

    member = GroupMember(
        group_id=community.id,
        user_id=current_user.id,
        role="founder",
    )
    db.add(member)
    await db.commit()

    return await _build_community_response(db, community, current_user)


@router.post("/{community_id}/join", response_model=JoinLeaveResponse)
async def join_community(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Group).where(
            Group.id == community_id,
            Group.group_type == "community",
        )
    )
    community = result.scalar_one_or_none()
    if not community:
        raise NotFoundError("Community", str(community_id))

    existing = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == community_id,
            GroupMember.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise AppError("ALREADY_MEMBER", "You are already a member of this community", 409)

    count_result = await db.execute(
        select(func.count(GroupMember.id)).where(GroupMember.group_id == community_id)
    )
    current_count = count_result.scalar() or 0
    if current_count >= community.member_limit:
        raise AppError("FULL", "This community has reached its member limit", 400)

    member = GroupMember(
        group_id=community_id,
        user_id=current_user.id,
        role="member",
    )
    db.add(member)
    await db.commit()

    count_result = await db.execute(
        select(func.count(GroupMember.id)).where(GroupMember.group_id == community_id)
    )
    new_count = count_result.scalar() or 0

    return JoinLeaveResponse(joined=True, member_count=new_count)


@router.post("/{community_id}/leave", response_model=JoinLeaveResponse)
async def leave_community(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == community_id,
            GroupMember.user_id == current_user.id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise NotFoundError("Membership", str(current_user.id))

    if member.role == "founder":
        raise AppError("FOUNDER_CANNOT_LEAVE", "Transfer ownership or disband the community first", 400)

    await db.delete(member)
    await db.commit()

    count_result = await db.execute(
        select(func.count(GroupMember.id)).where(GroupMember.group_id == community_id)
    )
    new_count = count_result.scalar() or 0

    return JoinLeaveResponse(joined=False, member_count=new_count)


@router.get("/{community_id}/members", response_model=list[CommunityMemberResponse])
async def list_members(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(GroupMember, User)
        .join(User, GroupMember.user_id == User.id)
        .where(GroupMember.group_id == community_id)
        .order_by(GroupMember.created_at)
    )
    rows = result.all()
    members = []
    for gm, u in rows:
        filtered = apply_privacy_filter(current_user.id, u)
        members.append(
            CommunityMemberResponse(
                id=gm.id,
                user_id=gm.user_id,
                name=filtered.get("name"),
                role=gm.role,
                joined_at=gm.created_at,
            )
        )
    return members


async def _build_community_response(
    db: AsyncSession,
    community: Group,
    current_user: User | None = None,
) -> CommunityResponse:
    count_result = await db.execute(
        select(func.count(GroupMember.id)).where(GroupMember.group_id == community.id)
    )
    member_count = count_result.scalar() or 0

    is_member = False
    role = None
    if current_user:
        mem_result = await db.execute(
            select(GroupMember).where(
                GroupMember.group_id == community.id,
                GroupMember.user_id == current_user.id,
            )
        )
        membership = mem_result.scalar_one_or_none()
        if membership:
            is_member = True
            role = membership.role

    founder_name = None
    if community.host_id:
        founder_result = await db.execute(
            select(User.name).where(User.id == community.host_id)
        )
        founder_name = founder_result.scalar_one_or_none()

    return CommunityResponse(
        id=community.id,
        name=community.name or "Community",
        interest_tags=community.interest_tags or [],
        description=community.description,
        member_count=member_count,
        cover_image_url=community.cover_image_url,
        rules=community.rules,
        member_limit=community.member_limit,
        is_member=is_member,
        role=role,
        created_by=founder_name,
        created_at=community.created_at,
    )
