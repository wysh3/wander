from pydantic import BaseModel
from datetime import datetime
import uuid


class GroupMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str | None = None
    role: str = "member"
    checked_in: bool = False
    rating: int | None = None

    class Config:
        from_attributes = True


class GroupResponse(BaseModel):
    id: uuid.UUID
    activity_id: uuid.UUID
    host_id: uuid.UUID | None = None
    host_name: str | None = None
    match_score: float | None = None
    no_show_risk: float | None = None
    status: str
    chat_opens_at: datetime | None = None
    chat_expires_at: datetime | None = None
    members: list[GroupMemberResponse] = []
    activity_title: str | None = None
    activity_scheduled_at: datetime | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class RateGroupRequest(BaseModel):
    rating: int
