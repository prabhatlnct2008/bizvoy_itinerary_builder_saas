from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime
import enum


class CartItemStatus(str, enum.Enum):
    PENDING = "PENDING"
    FITTED = "FITTED"
    MISSED = "MISSED"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"


class FitStatus(str, enum.Enum):
    PENDING = "PENDING"
    FITTED = "FITTED"
    MISSED = "MISSED"


class TimeSlot(str, enum.Enum):
    early_morning = "early_morning"  # 5am-8am
    morning = "morning"  # 8am-12pm
    afternoon = "afternoon"  # 12pm-5pm
    evening = "evening"  # 5pm-9pm
    night = "night"  # 9pm+


class ItineraryCartItem(Base):
    __tablename__ = "itinerary_cart_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("personalization_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_id = Column(String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    day_id = Column(String(36), ForeignKey("itinerary_days.id", ondelete="SET NULL"), nullable=True)
    quoted_price = Column(Numeric(10, 2), nullable=True)
    currency_code = Column(String(10), default="USD", nullable=False)
    time_slot = Column(SQLEnum(TimeSlot), nullable=True)
    fit_status = Column(SQLEnum(FitStatus), default=FitStatus.PENDING, nullable=False)
    fit_reason = Column(Text, nullable=True)  # Why it fits
    miss_reason = Column(Text, nullable=True)  # Why it doesn't fit
    swap_suggestion_activity_id = Column(String(36), ForeignKey("activities.id", ondelete="SET NULL"), nullable=True)
    status = Column(SQLEnum(CartItemStatus), default=CartItemStatus.PENDING, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("PersonalizationSession", back_populates="cart_items")
    itinerary = relationship("Itinerary")
    activity = relationship("Activity", foreign_keys=[activity_id])
    day = relationship("ItineraryDay")
    swap_suggestion = relationship("Activity", foreign_keys=[swap_suggestion_activity_id])

    def __repr__(self):
        return f"<ItineraryCartItem(id={self.id}, status={self.status}, fit_status={self.fit_status})>"
