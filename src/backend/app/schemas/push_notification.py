from pydantic import BaseModel
from datetime import datetime
import uuid


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh_key: str
    auth_key: str
    user_agent: str | None = None


class PushSubscriptionResponse(BaseModel):
    id: uuid.UUID
    endpoint: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PushSendRequest(BaseModel):
    title: str
    body: str
    url: str | None = None
    target_user_id: uuid.UUID | None = None


class PushSendResponse(BaseModel):
    sent: int
    failed: int
