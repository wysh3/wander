"""Admin panel schemas."""
from pydantic import BaseModel, Field
from datetime import datetime
import uuid
from typing import Optional


# ── Dashboard Stats ──
class AdminStatsResponse(BaseModel):
    total_events_this_month: int = 0
    total_events_all_time: int = 0
    total_users: int = 0
    active_groups_now: int = 0
    sos_triggers_30d: int = 0
    avg_group_rating: float = 0.0
    avg_screen_time_delta: float | None = None  # hours saved
    events_per_week: list[dict] = []
    signups_over_time: list[dict] = []
    category_distribution: list[dict] = []
    matching_success_rate: list[dict] = []
    sos_heatmap: list[dict] = []


# ── Events ──
class AdminEventCreate(BaseModel):
    title: str
    description: str | None = None
    category: str | None = None  # outdoor/cultural/food/sports/wellness/networking
    lat: float | None = None
    lng: float | None = None
    area: str | None = None
    city: str = "Bangalore"
    scheduled_at: datetime
    duration_minutes: int = 180
    group_size_min: int = 4
    group_size_max: int = 8
    max_groups: int = 3
    min_capacity: int = 4
    max_capacity: int = 50
    ticket_type: str = "free"
    ticket_price_inr: int = 0
    visibility: str = "public"
    host_user_id: uuid.UUID | None = None
    tags: list[str] | None = []
    phone_free_encouraged: bool = True
    women_only: bool = False
    status: str = "draft"
    cover_photo_url: str | None = None
    is_local_event: bool = True


class AdminEventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    lat: float | None = None
    lng: float | None = None
    area: str | None = None
    scheduled_at: datetime | None = None
    duration_minutes: int | None = None
    group_size_min: int | None = None
    group_size_max: int | None = None
    max_groups: int | None = None
    min_capacity: int | None = None
    max_capacity: int | None = None
    ticket_type: str | None = None
    ticket_price_inr: int | None = None
    visibility: str | None = None
    host_user_id: uuid.UUID | None = None
    tags: list[str] | None = None
    phone_free_encouraged: bool | None = None
    women_only: bool | None = None
    status: str | None = None
    cover_photo_url: str | None = None


class AdminEventResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    category: str | None = None
    lat: float | None = None
    lng: float | None = None
    area: str | None = None
    city: str = "Bangalore"
    scheduled_at: datetime
    duration_minutes: int = 180
    group_size_min: int = 4
    group_size_max: int = 8
    max_groups: int = 3
    host_ids: list[uuid.UUID] = []
    host_user_id: uuid.UUID | None = None
    host_name: str | None = None
    status: str = "draft"
    is_local_event: bool = True
    cover_photo_url: str | None = None
    min_capacity: int = 4
    max_capacity: int = 50
    ticket_type: str = "free"
    ticket_price_inr: int = 0
    visibility: str = "public"
    tags: list[str] = []
    participant_count: int = 0
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class AttendeeResponse(BaseModel):
    id: uuid.UUID
    name: str | None = None
    phone: str
    verification_status: str
    group_id: uuid.UUID | None = None
    joined_at: datetime | None = None


# ── Users ──
class AdminUserResponse(BaseModel):
    id: uuid.UUID
    phone: str
    name: str | None = None
    email: str | None = None
    gender: str | None = None
    verification_status: str
    onboarding_completed: bool
    role: str = "user"
    events_attended: int = 0
    is_host: bool = False
    flagged: bool = False
    banned: bool = False
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class AdminUserDetailResponse(BaseModel):
    id: uuid.UUID
    phone: str
    name: str | None = None
    email: str | None = None
    date_of_birth: datetime | None = None
    gender: str | None = None
    verification_status: str
    role: str = "user"
    personality_vector: list[float] | None = None
    interests: list[str] = []
    vibe: str | None = None
    home_area: str | None = None
    total_experiences: int = 0
    total_people_met: int = 0
    screen_time_before: int | None = None
    screen_time_after: int | None = None
    events_attended: list[dict] = []
    groups: list[dict] = []
    sos_history: list[dict] = []
    created_at: datetime | None = None


class UserActionRequest(BaseModel):
    action: str  # promote_host | ban | unban | flag | trigger_reverify


# ── Hosts ──
class AdminHostResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: str | None = None
    total_experiences_hosted: int = 0
    rating_avg: float | None = None
    background_verified: bool = False
    active: bool = True
    specialties: list[str] = []
    created_at: datetime | None = None


# ── Moderation ──
class FlaggedUserResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: str | None = None
    user_phone: str | None = None
    reason: str | None = None
    flag_type: str = "manual"
    status: str = "pending"
    admin_notes: str | None = None
    created_at: datetime | None = None


class SOSIncidentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: str | None = None
    group_id: uuid.UUID | None = None
    lat: float | None = None
    lng: float | None = None
    nearest_police_station: str | None = None
    resolved: bool = False
    resolution_status: str = "open"
    admin_notes: str | None = None
    triggered_at: datetime | None = None


class ChatAuditResponse(BaseModel):
    group_id: uuid.UUID
    messages: list[dict] = []
    member_count: int = 0


class ResolutionRequest(BaseModel):
    admin_notes: str | None = None
    action: str  # resolve | warn | ban


# ── Config ──
class PlatformConfigResponse(BaseModel):
    key: str
    value: dict


class ConfigUpdateRequest(BaseModel):
    value: dict


# ── Notifications ──
class NotificationCreate(BaseModel):
    title: str
    body: str
    target_type: str  # 'all' | 'event' | 'group'
    target_id: uuid.UUID | None = None
    scheduled_at: datetime | None = None  # None = send immediately


class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    body: str
    target_type: str
    target_id: uuid.UUID | None = None
    sent_at: datetime | None = None
    delivered_count: int = 0
    opened_count: int = 0
    created_at: datetime | None = None


# ── Platform Report ──
class PlatformReportResponse(BaseModel):
    total_real_hours_this_month: float = 0.0
    total_strangers_became_groups: int = 0
    neighborhoods_activated: list[dict] = []
    platform_screen_time_delta_hours: float | None = None
    top_activities: list[dict] = []
    impact_summary: str = ""


# ── Event Generation ──
class GenerateEventsRequest(BaseModel):
    areas: list[str] | None = None
    date_from: str | None = None
    date_to: str | None = None
    limit_per_area: int = 3


class GeneratedEvent(BaseModel):
    title: str
    description: str | None = None
    category: str | None = None
    area: str | None = None
    city: str = "Bangalore"
    lat: float | None = None
    lng: float | None = None
    scheduled_at: str
    duration_minutes: int = 120
    group_size_min: int = 4
    group_size_max: int = 8
    max_groups: int = 3
    min_capacity: int = 4
    max_capacity: int = 50
    ticket_type: str = "free"
    ticket_price_inr: int = 0
    visibility: str = "public"
    status: str = "draft"
    is_local_event: bool = True
    tags: list[str] = []
    women_only: bool = False
    phone_free_encouraged: bool = True
    source_url: str | None = None
    confidence: float = 0.5


class GenerateEventsResponse(BaseModel):
    events: list[GeneratedEvent] = []
    stats: dict = {}


# ── Image Upload ──
class ImageUploadResponse(BaseModel):
    url: str
    filename: str
