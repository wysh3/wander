from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    user_id: uuid.UUID | None = None
    user_name: str | None = None
    content: str
    message_type: str = "text"
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    content: str = Field(..., max_length=2000)
    message_type: str = "text"
