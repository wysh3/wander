import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, Float, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    address: Mapped[str | None] = mapped_column(Text)
    lat: Mapped[float | None] = mapped_column(Float(10))
    lng: Mapped[float | None] = mapped_column(Float(10))
    area: Mapped[str | None] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(50), default="Bangalore")
    venue_type: Mapped[str | None] = mapped_column(String(50))
    wander_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    capacity: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
