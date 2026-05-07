from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import OnboardingAnswers, OnboardingCompleteResponse, OnboardingStatusResponse
from app.services.onboarding import complete_onboarding

router = APIRouter()


@router.post("/complete", response_model=OnboardingCompleteResponse)
async def onboarding_complete(
    body: OnboardingAnswers,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await complete_onboarding(
        db=db,
        user=current_user,
        interests=body.interests,
        energy=body.energy,
        availability=body.availability,
    )
    return OnboardingCompleteResponse(done=True, **profile)


@router.get("/status", response_model=OnboardingStatusResponse)
async def onboarding_status(current_user: User = Depends(get_current_user)):
    return OnboardingStatusResponse(
        completed=current_user.onboarding_completed,
        profile={
            "personality_vector": current_user.personality_vector,
            "interests": current_user.interests,
            "vibe": current_user.vibe,
            "availability": current_user.availability,
        } if current_user.onboarding_completed else None,
    )
