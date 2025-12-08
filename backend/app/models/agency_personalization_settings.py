from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import JSON
from app.db.session import Base
import uuid
from datetime import datetime
import enum


class PersonalizationPolicy(str, enum.Enum):
    flexible = "flexible"  # Can add/swap activities freely
    additive = "additive"  # Can only add, not swap
    strict = "strict"  # Cannot modify template activities


class AgencyPersonalizationSettings(Base):
    __tablename__ = "agency_personalization_settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, unique=True)
    is_enabled = Column(Boolean, default=False, nullable=False)
    default_deck_size = Column(Integer, default=20, nullable=False)
    personalization_policy = Column(SQLEnum(PersonalizationPolicy), default=PersonalizationPolicy.flexible, nullable=False)
    max_price_per_traveler = Column(Numeric(10, 2), nullable=True)
    max_price_per_day = Column(Numeric(10, 2), nullable=True)
    default_currency = Column(String(10), default="USD", nullable=False)
    allowed_activity_type_ids = Column(JSON, nullable=True)  # List of activity type IDs
    show_readiness_warnings = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="personalization_settings")

    def __repr__(self):
        return f"<AgencyPersonalizationSettings(id={self.id}, agency_id={self.agency_id})>"
