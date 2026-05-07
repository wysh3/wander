from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UpdateProfileRequest, PrivacySettingsUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in body.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.patch("/me/privacy", response_model=UserResponse)
async def update_privacy(
    body: PrivacySettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.profile_visibility = body.profile_visibility
    current_user.show_full_name = body.show_full_name
    current_user.show_interests = body.show_interests
    current_user.show_location = body.show_location
    await db.commit()
    await db.refresh(current_user)
    return current_user
# touch
