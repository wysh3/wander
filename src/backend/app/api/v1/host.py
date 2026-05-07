from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.host import Host

router = APIRouter()


@router.get("/dashboard")
async def host_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    host_result = await db.execute(
        select(Host).where(Host.user_id == current_user.id)
    )
    host = host_result.scalar_one_or_none()

    if not host:
        return {
            "upcoming_groups": [],
            "stats": {"total_experiences_hosted": 0, "rating_avg": 0},
        }

    return {
        "upcoming_groups": [],
        "stats": {
            "total_experiences_hosted": host.total_experiences_hosted,
            "rating_avg": float(host.rating_avg) if host.rating_avg else 0,
        },
    }


@router.get("/groups")
async def host_groups(
    status: str = Query("upcoming"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {"items": []}
