from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class SOSTriggerRequest(BaseModel):
    lat: float | None = None
    lng: float | None = None


class SOSTriggerResponse(BaseModel):
    sos_id: uuid.UUID
    notified: bool = False


class SOSCancelRequest(BaseModel):
    sos_id: uuid.UUID


class SOSCancelResponse(BaseModel):
    cancelled: bool = True


class SOSEventResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: str | None = None
    group_id: uuid.UUID | None = None
    activity_id: uuid.UUID | None = None
    lat: float | None = None
    lng: float | None = None
    emergency_contact_notified: bool = False
    nearest_police_station: str | None = None
    resolved: bool = False
    triggered_at: datetime

    class Config:
        from_attributes = True
