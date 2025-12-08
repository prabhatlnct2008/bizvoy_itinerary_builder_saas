from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime


class AgencyVibe(Base):
    __tablename__ = "agency_vibes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    vibe_key = Column(String(50), nullable=False)  # e.g., "adventure", "luxury", "culture"
    display_name = Column(String(100), nullable=False)  # e.g., "Adventure", "Luxury Experience"
    emoji = Column(String(10), nullable=True)  # e.g., "🏔️", "💎", "🎭"
    color_hex = Column(String(7), nullable=True)  # e.g., "#FF5733"
    is_global = Column(Boolean, default=False, nullable=False)  # Global seed vs custom
    is_enabled = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="vibes")

    __table_args__ = (
        UniqueConstraint('agency_id', 'vibe_key', name='_agency_vibe_uc'),
    )

    def __repr__(self):
        return f"<AgencyVibe(id={self.id}, vibe_key={self.vibe_key}, agency_id={self.agency_id})>"
