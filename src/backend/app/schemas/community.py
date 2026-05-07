from pydantic import BaseModel
from datetime import datetime
import uuid


class CommunityCreateRequest(BaseModel):
    name: str
    interest_tags: list[str]
    description: str | None = None
    rules: str | None = None
    cover_image_url: str | None = None
    member_limit: int = 100


class CommunityMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str | None = None
    role: str = "member"
    joined_at: datetime | None = None

    class Config:
        from_attributes = True


class CommunityResponse(BaseModel):
    id: uuid.UUID
    name: str
    interest_tags: list[str] = []
    description: str | None = None
    member_count: int = 0
    cover_image_url: str | None = None
    rules: str | None = None
    member_limit: int = 100
    is_member: bool = False
    role: str | None = None
    created_by: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class JoinLeaveResponse(BaseModel):
    joined: bool = True
    member_count: int


class CommunityListParams(BaseModel):
    interest: str | None = None
    cursor: str | None = None
    limit: int = 10
