import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, Float, Date, Text, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_uid: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(15), unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(255))
    date_of_birth: Mapped[datetime | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(20))

    verification_method: Mapped[str | None] = mapped_column(String(20))
    verification_status: Mapped[str] = mapped_column(String(20), default="unverified")
    verified_at: Mapped[datetime | None] = mapped_column(DateTime)
    digilocker_ref: Mapped[str | None] = mapped_column(String(255))
    aadhaar_hashed: Mapped[str | None] = mapped_column(String(255))

    personality_vector: Mapped[list[float] | None] = mapped_column(Vector(5))
    personality_raw: Mapped[dict | None] = mapped_column(JSONB)
    interests: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=[])
    activity_preferences: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=[])
    vibe: Mapped[str | None] = mapped_column(String(50))
    availability: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=[])

    role: Mapped[str] = mapped_column(String(20), default="user")
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_chat_log: Mapped[dict | None] = mapped_column(JSONB)

    home_lat: Mapped[float | None] = mapped_column(Float(10))
    home_lng: Mapped[float | None] = mapped_column(Float(10))
    home_area: Mapped[str | None] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(50), default="Bangalore")
    travel_radius_km: Mapped[int] = mapped_column(Integer, default=15)

    # Gamification
    current_streak: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    longest_streak: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    last_streak_date: Mapped[datetime | None] = mapped_column(Date)
    badges: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=[], server_default="{}")

    # Live geo-tracking for real-time matchmaking
    live_lat: Mapped[float | None] = mapped_column(Float(10))
    live_lng: Mapped[float | None] = mapped_column(Float(10))
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime)
    preferred_radius_km: Mapped[int] = mapped_column(Integer, default=20)

    emergency_contact_name: Mapped[str | None] = mapped_column(String(100))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(15))
    women_only_preference: Mapped[bool] = mapped_column(Boolean, default=False)

    streak_weeks: Mapped[int] = mapped_column(Integer, default=0)
    total_experiences: Mapped[int] = mapped_column(Integer, default=0)
    total_people_met: Mapped[int] = mapped_column(Integer, default=0)
    total_neighborhoods_explored: Mapped[int] = mapped_column(Integer, default=0)
    screen_time_before: Mapped[int | None] = mapped_column(Integer)
    screen_time_after: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
