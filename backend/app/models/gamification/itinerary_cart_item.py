"""ItineraryCartItem model for tracking liked activities and their fit status."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.db.session import Base


class CartItemStatus(str, enum.Enum):
    """Status of a cart item."""
    PENDING = "PENDING"        # Liked but not yet confirmed
    CONFIRMED = "CONFIRMED"    # User confirmed and paid
    CANCELLED = "CANCELLED"    # User removed or swapped out


class FitStatus(str, enum.Enum):
    """Whether the activity was fitted into the itinerary."""
    FITTED = "FITTED"      # Successfully placed in itinerary
    MISSED = "MISSED"      # Could not fit (time conflict, full day, etc.)
    SWAPPED = "SWAPPED"    # Was fitted but then swapped with another activity


class ItineraryCartItem(Base):
    """
    Represents a "liked" activity that is either fitted or missed in the itinerary.

    After the user swipes right on activities, the fit engine determines which
    ones can be placed in the schedule. This model tracks both the fitted and
    missed items, along with reasons and swap suggestions.
    """
    __tablename__ = "itinerary_cart_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("personalization_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_id = Column(String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, index=True)
    day_id = Column(String(36), ForeignKey("itinerary_days.id", ondelete="SET NULL"))  # Null if not fitted

    # Pricing
    quoted_price = Column(Numeric(10, 2), nullable=False)  # Price at time of swipe
    currency_code = Column(String(3), default="USD")

    # Fit results
    time_slot = Column(String(20))  # MORNING, AFTERNOON, EVENING - only set if fitted
    fit_status = Column(SQLEnum(FitStatus), default=FitStatus.FITTED, nullable=False, index=True)
    fit_reason = Column(String(200))  # Why it was fitted (e.g., "Fits in Morning slot on Day 2")
    miss_reason = Column(String(200))  # Why it was missed (e.g., "No available slots match duration")
    swap_suggestion_activity_id = Column(String(36))  # Activity that could be swapped to fit this one

    # Cart status
    status = Column(SQLEnum(CartItemStatus), default=CartItemStatus.PENDING, nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("PersonalizationSession", back_populates="cart_items")
    itinerary = relationship("Itinerary", back_populates="cart_items")
    activity = relationship("Activity")
    day = relationship("ItineraryDay")

    def __repr__(self):
        return f"<ItineraryCartItem(id={self.id}, fit_status={self.fit_status}, status={self.status})>"
