from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime
import enum


class InteractionAction(str, enum.Enum):
    like = "like"
    pass_ = "pass"
    save = "save"


class UserDeckInteraction(Base):
    __tablename__ = "user_deck_interactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("personalization_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(SQLEnum(InteractionAction), nullable=False)
    seconds_viewed = Column(Numeric(10, 2), default=0, nullable=False)
    card_position = Column(Integer, nullable=True)  # Position in deck (0-based)
    swipe_velocity = Column(Numeric(10, 2), nullable=True)  # Pixels per second
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("PersonalizationSession", back_populates="interactions")
    itinerary = relationship("Itinerary")
    activity = relationship("Activity")

    def __repr__(self):
        return f"<UserDeckInteraction(id={self.id}, action={self.action}, activity_id={self.activity_id})>"
