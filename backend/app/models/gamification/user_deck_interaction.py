"""UserDeckInteraction model for tracking swipe actions."""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.db.session import Base


class InteractionAction(str, enum.Enum):
    """Type of interaction with a deck card."""
    LIKED = "LIKED"
    PASSED = "PASSED"
    SAVED = "SAVED"


class UserDeckInteraction(Base):
    """
    Records each swipe/interaction during the deck phase.

    Used for analytics and to understand user preferences.
    """
    __tablename__ = "user_deck_interactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("personalization_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_id = Column(String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, index=True)

    # Interaction details
    action = Column(SQLEnum(InteractionAction), nullable=False, index=True)
    seconds_viewed = Column(Integer, default=0)  # How long the card was displayed
    card_position = Column(Integer)  # Position in deck (1-20)
    swipe_velocity = Column(Numeric(5, 2))  # Speed of swipe (px/ms) for engagement analytics

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("PersonalizationSession", back_populates="interactions")
    itinerary = relationship("Itinerary", back_populates="deck_interactions")
    activity = relationship("Activity", back_populates="deck_interactions")

    def __repr__(self):
        return f"<UserDeckInteraction(id={self.id}, action={self.action}, activity_id={self.activity_id})>"
