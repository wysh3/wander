from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/digilocker/init")
async def digilocker_init(current_user: User = Depends(get_current_user)):
    return {
        "redirect_url": "https://api.digitallocker.gov.in/public/oauth2/1/authorize?"
        "response_type=code&client_id=WANDER_DEMO&state=demo_state&"
        "redirect_uri=https://app.wander.demo/verify/callback",
        "session_id": "demo-session-digilocker-001",
    }


@router.get("/digilocker/status")
async def digilocker_status(current_user: User = Depends(get_current_user)):
    return {"status": "approved"}


@router.get("/digilocker/fetch")
async def digilocker_fetch(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.name = current_user.name or "Priya Sharma"
    current_user.date_of_birth = current_user.date_of_birth
    current_user.gender = current_user.gender or "female"
    current_user.verification_status = "verified"
    current_user.verification_method = "digilocker"
    current_user.digilocker_ref = "DL-DEMO-001"
    from datetime import datetime
    current_user.verified_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)

    return {
        "name": current_user.name,
        "dob": str(current_user.date_of_birth) if current_user.date_of_birth else "1998-03-15",
        "gender": current_user.gender,
        "address": "Indiranagar, Bangalore",
    }


@router.post("/aadhaar/init")
async def aadhaar_init(current_user: User = Depends(get_current_user)):
    return {"otp_sent": True}


@router.post("/aadhaar/confirm")
async def aadhaar_confirm(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.verification_status = "verified"
    current_user.verification_method = "aadhaar"
    from datetime import datetime
    current_user.verified_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)

    return {
        "name": current_user.name or "Priya Sharma",
        "dob": "1998-03-15",
        "gender": current_user.gender or "female",
    }
