from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.session import Base

class UserReport(Base):
    __tablename__ = "user_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Target (One of these should be populated)
    reported_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reported_activity_id = Column(UUID(as_uuid=True), ForeignKey("activities.id"), nullable=True)
    reported_group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=True)
    
    reason = Column(String, nullable=False) # e.g. "Spam", "Harassment", "Suspicious"
    details = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending, reviewed, resolved
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())