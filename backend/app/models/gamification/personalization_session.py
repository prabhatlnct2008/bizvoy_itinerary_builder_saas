"""PersonalizationSession model for tracking gamification sessions."""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import JSON
from datetime import datetime
import uuid
import enum
from app.db.session import Base


class SessionStatus(str, enum.Enum):
    """Status of a personalization session."""
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CONFIRMED = "CONFIRMED"
    ABANDONED = "ABANDONED"


class PersonalizationSession(Base):
    """
    Tracks a user's personalization session through the gamified discovery process.

    A session starts when a user initiates the "Vibe Check" and continues through
    swiping activities, viewing the reveal, and confirming their selections.
    """
    __tablename__ = "personalization_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    share_link_id = Column(String(36), ForeignKey("share_links.id", ondelete="SET NULL"))
    device_id = Column(String(100), index=True)  # Browser fingerprint for session resumption

    # Session configuration
    selected_vibes = Column(JSON)  # Array of vibe keys selected in vibe check
    deck_size = Column(Integer, default=20)  # Total cards shown in deck

    # Session statistics
    cards_viewed = Column(Integer, default=0)
    cards_liked = Column(Integer, default=0)
    cards_passed = Column(Integer, default=0)
    cards_saved = Column(Integer, default=0)
    total_time_seconds = Column(Integer, default=0)

    # Session status and timestamps
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.IN_PROGRESS, nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)  # When fit algorithm was run
    confirmed_at = Column(DateTime)  # When user confirmed and paid

    # Request metadata
    user_agent = Column(Text)
    ip_hash = Column(String(64))  # Hashed for privacy

    # Relationships
    itinerary = relationship("Itinerary", back_populates="personalization_sessions")
    share_link = relationship("ShareLink")
    interactions = relationship(
        "UserDeckInteraction",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="UserDeckInteraction.created_at"
    )
    cart_items = relationship(
        "ItineraryCartItem",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ItineraryCartItem.created_at"
    )

    def __repr__(self):
        return f"<PersonalizationSession(id={self.id}, itinerary_id={self.itinerary_id}, status={self.status})>"
