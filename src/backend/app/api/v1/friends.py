from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.friend_connection import FriendConnection
from app.models.user_block import UserBlock
from app.services.friend_matching import get_friend_suggestions
from app.schemas.friend import (
    FriendSuggestionResponse,
    UserBriefResponse,
    FriendRequestResponse,
    FriendResponse,
)
from app.core.exceptions import NotFoundError, AppError

router = APIRouter()


def _user_brief(user: User) -> UserBriefResponse:
    return UserBriefResponse(
        id=user.id,
        name=user.name,
        vibe=user.vibe,
        interests=user.interests or [],
        home_area=user.home_area,
    )


@router.get("/suggestions", response_model=list[FriendSuggestionResponse])
async def get_suggestions(
    limit: int = Query(10, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    suggestions = await get_friend_suggestions(current_user, db, limit)
    return [
        FriendSuggestionResponse(
            user=_user_brief(s["user"]),
            compatibility=s["compatibility"],
            shared_interests=s.get("shared_interests", []),
            distance_km=s.get("distance_km", 0.0),
            ai_reason=s.get("ai_reason"),
        )
        for s in suggestions
    ]


@router.post("/request/{user_id}")
async def send_friend_request(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise AppError("SELF_REQUEST", "You cannot send a friend request to yourself", 400)

    target = await db.get(User, user_id)
    if not target:
        raise NotFoundError("User", str(user_id))

    existing = await db.execute(
        select(FriendConnection).where(
            FriendConnection.user_id == current_user.id,
            FriendConnection.friend_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise AppError("ALREADY_EXISTS", "A connection already exists with this user", 409)

    block_check = await db.execute(
        select(UserBlock).where(
            or_(
                (UserBlock.blocker_id == current_user.id) & (UserBlock.blocked_id == user_id),
                (UserBlock.blocker_id == user_id) & (UserBlock.blocked_id == current_user.id),
            )
        )
    )
    if block_check.scalar_one_or_none():
        raise AppError("BLOCKED", "Cannot send request — user is blocked or has blocked you", 403)

    from app.services.friend_matching import compatibility
    score = compatibility(current_user, target)

    conn = FriendConnection(
        user_id=current_user.id,
        friend_id=user_id,
        status="pending",
        compatibility_score=round(score, 4),
    )
    db.add(conn)
    await db.commit()

    return {"request_id": str(conn.id), "status": "pending"}


@router.get("/requests", response_model=list[FriendRequestResponse])
async def get_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(FriendConnection).where(
            FriendConnection.friend_id == current_user.id,
            FriendConnection.status == "pending",
        ).order_by(FriendConnection.created_at.desc())
    )
    requests = result.scalars().all()

    output = []
    for req in requests:
        from_user = await db.get(User, req.user_id)
        if from_user:
            output.append(FriendRequestResponse(
                id=req.id,
                from_user=_user_brief(from_user),
                compatibility_score=req.compatibility_score,
                created_at=req.created_at,
            ))
    return output


@router.post("/accept/{request_id}")
async def accept_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = await db.get(FriendConnection, request_id)
    if not conn:
        raise NotFoundError("FriendRequest", str(request_id))

    if conn.friend_id != current_user.id:
        raise AppError("NOT_YOUR_REQUEST", "This request is not addressed to you", 403)

    if conn.status != "pending":
        raise AppError("ALREADY_HANDLED", "This request has already been handled", 409)

    conn.status = "accepted"
    await db.commit()

    friend = await db.get(User, conn.user_id)
    return {
        "connection": {
            "friend_id": str(conn.user_id),
            "friend_name": friend.name if friend else None,
            "status": "accepted",
        }
    }


@router.post("/reject/{request_id}")
async def reject_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conn = await db.get(FriendConnection, request_id)
    if not conn:
        raise NotFoundError("FriendRequest", str(request_id))

    if conn.friend_id != current_user.id:
        raise AppError("NOT_YOUR_REQUEST", "This request is not addressed to you", 403)

    conn.status = "rejected"
    await db.commit()
    return {"request_id": str(request_id), "status": "rejected"}


@router.get("", response_model=list[FriendResponse])
async def list_friends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(FriendConnection).where(
            FriendConnection.user_id == current_user.id,
            FriendConnection.status == "accepted",
        ).order_by(FriendConnection.updated_at.desc())
    )
    connections = result.scalars().all()

    output = []
    for conn in connections:
        friend = await db.get(User, conn.friend_id)
        if friend:
            output.append(FriendResponse(
                id=conn.id,
                friend=_user_brief(friend),
                compatibility_score=conn.compatibility_score,
                connected_at=conn.updated_at or conn.created_at,
            ))
    return output


@router.delete("/{friend_id}")
async def remove_friend(
    friend_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(FriendConnection).where(
            FriendConnection.user_id == current_user.id,
            FriendConnection.friend_id == friend_id,
            FriendConnection.status == "accepted",
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise NotFoundError("FriendConnection", str(friend_id))

    await db.delete(conn)
    await db.commit()
    return {"removed": True}


@router.post("/block/{user_id}")
async def block_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise AppError("SELF_BLOCK", "You cannot block yourself", 400)

    existing = await db.execute(
        select(UserBlock).where(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"blocked": True}

    conn_result = await db.execute(
        select(FriendConnection).where(
            or_(
                (FriendConnection.user_id == current_user.id) & (FriendConnection.friend_id == user_id),
                (FriendConnection.user_id == user_id) & (FriendConnection.friend_id == current_user.id),
            )
        )
    )
    for conn in conn_result.scalars().all():
        await db.delete(conn)

    block = UserBlock(blocker_id=current_user.id, blocked_id=user_id)
    db.add(block)
    await db.commit()
    return {"blocked": True}
