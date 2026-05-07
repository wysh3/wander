from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.user_report import UserReport
from app.schemas.user_report import UserReportCreate, UserReportResponse

router = APIRouter()

@router.post("/", response_model=UserReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_report(
    report_in: UserReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not (report_in.reported_user_id or report_in.reported_activity_id or report_in.reported_group_id):
        raise HTTPException(
            status_code=400,
            detail="Must report a user, activity, or group."
        )
        
    new_report = UserReport(
        reporter_id=current_user.id,
        reported_user_id=report_in.reported_user_id,
        reported_activity_id=report_in.reported_activity_id,
        reported_group_id=report_in.reported_group_id,
        reason=report_in.reason,
        details=report_in.details,
        status="pending"
    )
    
    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)
    
    return new_report
