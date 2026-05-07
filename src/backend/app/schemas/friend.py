from pydantic import BaseModel
from datetime import datetime
import uuid


class UserBriefResponse(BaseModel):
    id: uuid.UUID
    name: str | None = None
    vibe: str | None = None
    interests: list[str] = []
    home_area: str | None = None

    class Config:
        from_attributes = True


class FriendSuggestionResponse(BaseModel):
    user: UserBriefResponse
    compatibility: float
    shared_interests: list[str] = []
    distance_km: float = 0.0
    ai_reason: str | None = None


class FriendRequestResponse(BaseModel):
    id: uuid.UUID
    from_user: UserBriefResponse
    compatibility_score: float | None = None
    created_at: datetime | None = None


class FriendResponse(BaseModel):
    id: uuid.UUID
    friend: UserBriefResponse
    compatibility_score: float | None = None
    connected_at: datetime | None = None
