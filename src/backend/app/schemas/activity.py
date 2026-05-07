from pydantic import BaseModel
from datetime import datetime
import uuid


class ActivityResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    category: str | None = None
    activity_type: str | None = None
    venue_id: uuid.UUID | None = None
    lat: float | None = None
    lng: float | None = None
    area: str | None = None
    city: str = "Bangalore"
    scheduled_at: datetime
    confirmed_at: datetime | None = None
    duration_minutes: int = 180
    group_size_min: int = 4
    group_size_max: int = 8
    women_only: bool = False
    max_groups: int = 3
    host_ids: list[uuid.UUID] = []
    phone_free_encouraged: bool = True
    status: str = "open"
    participant_count: int = 0
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class ActivityListParams(BaseModel):
    category: str | None = None
    area: str | None = None
    date: str | None = None
    cursor: str | None = None
    limit: int = 10


class JoinActivityResponse(BaseModel):
    joined: bool = True
    participant_count: int
