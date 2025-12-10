from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, Text, Numeric, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime
import enum


class ItineraryStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String, ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(String, ForeignKey("templates.id", ondelete="SET NULL"), nullable=True)
    trip_name = Column(String(255), nullable=False, index=True)
    client_name = Column(String(255), nullable=False)
    client_email = Column(String(255), nullable=True)
    client_phone = Column(String(50), nullable=True)
    destination = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False)
    num_adults = Column(Integer, default=1, nullable=False)
    num_children = Column(Integer, default=0, nullable=False)
    status = Column(SQLEnum(ItineraryStatus), default=ItineraryStatus.draft, nullable=False, index=True)
    total_price = Column(Numeric(10, 2), nullable=True)
    special_notes = Column(Text, nullable=True)
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Gamification fields
    personalization_enabled = Column(Integer, default=0, nullable=False)
    personalization_policy = Column(String(50), default="flexible", nullable=True)
    personalization_lock_policy = Column(String(50), default="respect_locks", nullable=True)
    personalization_completed = Column(Integer, default=0, nullable=False)
    personalization_completed_at = Column(DateTime, nullable=True)
    personalization_session_id = Column(String(36), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="itineraries")
    template = relationship("Template", back_populates="itineraries")
    creator = relationship("User", back_populates="created_itineraries", foreign_keys=[created_by])
    days = relationship("ItineraryDay", back_populates="itinerary", cascade="all, delete-orphan", order_by="ItineraryDay.day_number")
    share_links = relationship("ShareLink", back_populates="itinerary", cascade="all, delete-orphan")
    pdf_exports = relationship("PDFExport", back_populates="itinerary", cascade="all, delete-orphan")
    pricing = relationship("ItineraryPricing", back_populates="itinerary", uselist=False, cascade="all, delete-orphan")
    personalization_sessions = relationship("PersonalizationSession", back_populates="itinerary", cascade="all, delete-orphan")

    # Gamification relationships
    personalization_sessions = relationship("PersonalizationSession", back_populates="itinerary", cascade="all, delete-orphan")
    deck_interactions = relationship("UserDeckInteraction", back_populates="itinerary", cascade="all, delete-orphan")
    cart_items = relationship("ItineraryCartItem", back_populates="itinerary", cascade="all, delete-orphan")


class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(String, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    day_number = Column(Integer, nullable=False)
    actual_date = Column(Date, nullable=False)
    title = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    itinerary = relationship("Itinerary", back_populates="days")
    activities = relationship("ItineraryDayActivity", back_populates="itinerary_day", cascade="all, delete-orphan", order_by="ItineraryDayActivity.display_order")

    __table_args__ = (
        UniqueConstraint('itinerary_id', 'day_number', name='_itinerary_day_uc'),
    )


class ItemType(str, enum.Enum):
    """Type of item in the itinerary timeline"""
    library_activity = "LIBRARY_ACTIVITY"  # Linked to activities table
    logistics = "LOGISTICS"  # Ad-hoc item (taxi, transfer, check-in)
    note = "NOTE"  # Free-form note/reminder


class ItineraryDayActivity(Base):
    __tablename__ = "itinerary_day_activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_day_id = Column(String, ForeignKey("itinerary_days.id", ondelete="CASCADE"), nullable=False)

    # Hybrid Row Pattern: activity_id is nullable for ad-hoc items
    activity_id = Column(String, ForeignKey("activities.id", ondelete="RESTRICT"), nullable=True)

    # Item type determines how to render and what data to use
    item_type = Column(String(30), default="LIBRARY_ACTIVITY", nullable=False)

    # Custom fields for ad-hoc items (LOGISTICS, NOTE)
    custom_title = Column(String(255), nullable=True)  # Title for logistics/notes
    custom_payload = Column(Text, nullable=True)  # JSON blob for extra details (hotel name, taxi number, etc.)
    custom_icon = Column(String(50), nullable=True)  # Icon hint for rendering (hotel, taxi, plane, etc.)

    display_order = Column(Integer, default=0, nullable=False)
    time_slot = Column(String(50), nullable=True)  # morning, afternoon, evening
    custom_notes = Column(Text, nullable=True)
    custom_price = Column(Numeric(10, 2), nullable=True)
    # Pricing v2 fields
    price_amount = Column(Numeric(10, 2), nullable=True)
    price_currency = Column(String(10), default="USD", nullable=True)
    pricing_unit = Column(String(20), default="flat", nullable=True)  # flat, per_person, per_group, per_night
    quantity = Column(Integer, default=1, nullable=True)
    item_discount_amount = Column(Numeric(10, 2), nullable=True)

    # Time fields
    start_time = Column(String(10), nullable=True)  # e.g., "09:00"
    end_time = Column(String(10), nullable=True)  # e.g., "12:00"

    # Lock and source tracking
    is_locked_by_agency = Column(Integer, default=0, nullable=False)  # 0=can swap, 1=locked
    source_cart_item_id = Column(String(36), nullable=True)  # Reference to cart item if added via personalization
    added_by_personalization = Column(Integer, default=0, nullable=False)  # 1 if added by gamification

    # Relationships
    itinerary_day = relationship("ItineraryDay", back_populates="activities")
    activity = relationship("Activity", back_populates="itinerary_day_activities")
