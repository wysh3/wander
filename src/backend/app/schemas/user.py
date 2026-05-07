from pydantic import BaseModel
from datetime import datetime
import uuid


class UserResponse(BaseModel):
    id: uuid.UUID
    phone: str
    name: str | None = None
    email: str | None = None
    date_of_birth: datetime | None = None
    gender: str | None = None
    verification_status: str
    onboarding_completed: bool
    personality_vector: list[float] | None = None
    personality_raw: dict | None = None
    interests: list[str] = []
    activity_preferences: list[str] = []
    vibe: str | None = None
    availability: list[str] = []
    home_lat: float | None = None
    home_lng: float | None = None
    home_area: str | None = None
    city: str = "Bangalore"
    travel_radius_km: int = 15
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    women_only_preference: bool = False
    streak_weeks: int = 0
    total_experiences: int = 0
    total_people_met: int = 0
    total_neighborhoods_explored: int = 0
    screen_time_before: int | None = None
    screen_time_after: int | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class OnboardingAnswers(BaseModel):
    interests: list[str]
    energy: str
    availability: list[str]


class OnboardingCompleteResponse(BaseModel):
    done: bool = True
    personality_vector: list[float]
    interests: list[str]
    vibe: str
    availability: list[str]


class OnboardingRequest(BaseModel):
    message: str


class OnboardingResponse(BaseModel):
    reply: str
    done: bool = False
    profile: dict | None = None


class OnboardingStatusResponse(BaseModel):
    completed: bool
    profile: dict | None = None


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    home_lat: float | None = None
    home_lng: float | None = None
    home_area: str | None = None
    travel_radius_km: int | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    women_only_preference: bool | None = None
    screen_time_before: int | None = None
    screen_time_after: int | None = None
