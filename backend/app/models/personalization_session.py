from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import JSON
from app.db.session import Base
import uuid
from datetime import datetime
import enum


class SessionStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    abandoned = "abandoned"


class PersonalizationSession(Base):
    __tablename__ = "personalization_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    share_link_id = Column(String(36), ForeignKey("share_links.id", ondelete="SET NULL"), nullable=True)
    device_id = Column(String(100), nullable=True)
    selected_vibes = Column(JSON, nullable=True)  # Array of vibe_keys
    deck_size = Column(Integer, default=20, nullable=False)
    cards_viewed = Column(Integer, default=0, nullable=False)
    cards_liked = Column(Integer, default=0, nullable=False)
    cards_passed = Column(Integer, default=0, nullable=False)
    cards_saved = Column(Integer, default=0, nullable=False)
    total_time_seconds = Column(Integer, default=0, nullable=False)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.active, nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    last_interaction_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_agent = Column(String(500), nullable=True)
    ip_hash = Column(String(64), nullable=True)

    # Relationships
    itinerary = relationship("Itinerary", back_populates="personalization_sessions")
    share_link = relationship("ShareLink")
    interactions = relationship("UserDeckInteraction", back_populates="session", cascade="all, delete-orphan")
    cart_items = relationship("ItineraryCartItem", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PersonalizationSession(id={self.id}, itinerary_id={self.itinerary_id}, status={self.status})>"
