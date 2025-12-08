from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Integer, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import JSON
from datetime import datetime
import uuid
import enum
from app.db.session import Base


class DurationUnit(str, enum.Enum):
    minutes = "minutes"
    hours = "hours"
    days = "days"


class CostType(str, enum.Enum):
    included = "included"
    extra = "extra"


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type_id = Column(String(36), ForeignKey("activity_types.id", ondelete="RESTRICT"), nullable=False)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Basic Information
    name = Column(String(200), nullable=False, index=True)
    category_label = Column(String(50), nullable=True)  # "transfer", "relaxation", "dining"
    location_display = Column(String(200), nullable=True, index=True)

    # Descriptions
    short_description = Column(Text, nullable=True)  # 1-3 lines for lists
    client_description = Column(Text, nullable=True)  # Full paragraph for shared view

    # Duration
    default_duration_value = Column(Integer, nullable=True)  # e.g., 45
    default_duration_unit = Column(SQLEnum(DurationUnit), nullable=True)  # minutes, hours, days

    # Meta
    rating = Column(Numeric(2, 1), nullable=True)  # 0.0 to 5.0
    group_size_label = Column(String(50), nullable=True)  # "Private", "Shared", "Max 10 people"

    # Cost
    cost_type = Column(SQLEnum(CostType), default=CostType.included, nullable=False)
    cost_display = Column(String(100), nullable=True)  # e.g., "From $120 per person"

    # JSON fields
    highlights = Column(JSON, nullable=True)  # Array of strings: ["Meet & Greet", "Welcome Drink"]
    tags = Column(JSON, nullable=True)  # Array of strings: ["Family-friendly", "Luxury"]

    # Gamification fields
    price_numeric = Column(Numeric(10, 2), nullable=True)  # Parsed price for filtering
    currency_code = Column(String(10), default="USD", nullable=True)
    marketing_badge = Column(String(50), nullable=True)  # e.g., "Popular", "New", "Limited"
    review_count = Column(Integer, default=0, nullable=False)
    review_rating = Column(Numeric(3, 2), nullable=True)  # 0.00 to 5.00
    optimal_time_of_day = Column(String(50), nullable=True)  # e.g., "morning", "evening"
    blocked_days_of_week = Column(JSON, nullable=True)  # Array of day numbers [0=Sunday, 6=Saturday]
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    vibe_tags = Column(JSON, nullable=True)  # Array of vibe_keys: ["adventure", "luxury"]
    gamification_readiness_score = Column(Numeric(3, 2), default=0, nullable=False)  # 0.00 to 1.00
    gamification_readiness_issues = Column(JSON, nullable=True)  # Array of issue strings

    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Internal
    internal_notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="activities")
    activity_type = relationship("ActivityType", back_populates="activities")
    created_by = relationship("User", foreign_keys=[created_by_id])
    images = relationship("ActivityImage", back_populates="activity", cascade="all, delete-orphan", order_by="ActivityImage.display_order")
    template_day_activities = relationship("TemplateDayActivity", back_populates="activity")
    itinerary_day_activities = relationship("ItineraryDayActivity", back_populates="activity")

    # Gamification relationships
    deck_interactions = relationship("UserDeckInteraction", back_populates="activity", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Activity(id={self.id}, name={self.name}, agency_id={self.agency_id})>"
