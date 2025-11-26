from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.session import Base


class ActivityType(Base):
    __tablename__ = "activity_types"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)  # e.g., "bed", "utensils", "compass", "car"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="activity_types")
    activities = relationship("Activity", back_populates="activity_type", cascade="all, delete-orphan")

    # Unique constraint
    __table_args__ = (
        UniqueConstraint('agency_id', 'name', name='uq_activity_type_agency_name'),
    )

    def __repr__(self):
        return f"<ActivityType(id={self.id}, name={self.name}, agency_id={self.agency_id})>"
