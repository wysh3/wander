import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, Float, Text, DateTime, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(50))
    activity_type: Mapped[str | None] = mapped_column(String(100))
    venue_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("venues.id"), nullable=True)
    lat: Mapped[float | None] = mapped_column(Float(10))
    lng: Mapped[float | None] = mapped_column(Float(10))
    area: Mapped[str | None] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(50), default="Bangalore")
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=180)
    group_size_min: Mapped[int] = mapped_column(Integer, default=4)
    group_size_max: Mapped[int] = mapped_column(Integer, default=8)
    women_only: Mapped[bool] = mapped_column(Boolean, default=False)
    max_groups: Mapped[int] = mapped_column(Integer, default=3)
    host_ids: Mapped[list[uuid.UUID] | None] = mapped_column(ARRAY(UUID(as_uuid=True)), default=[])
    phone_free_encouraged: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(20), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
