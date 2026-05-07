from pydantic import BaseModel, ConfigDict
import uuid
from typing import Optional
from datetime import datetime

class UserReportCreate(BaseModel):
    reported_user_id: Optional[uuid.UUID] = None
    reported_activity_id: Optional[uuid.UUID] = None
    reported_group_id: Optional[uuid.UUID] = None
    reason: str
    details: Optional[str] = None

class UserReportResponse(UserReportCreate):
    id: uuid.UUID
    reporter_id: uuid.UUID
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
