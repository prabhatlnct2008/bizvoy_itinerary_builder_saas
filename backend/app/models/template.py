from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Numeric, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime
import enum


class TemplateStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Template(Base):
    __tablename__ = "templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String, ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    destination = Column(String(255), nullable=False)
    duration_days = Column(Integer, nullable=False)
    duration_nights = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    approximate_price = Column(Numeric(10, 2), nullable=True)
    status = Column(SQLEnum(TemplateStatus), default=TemplateStatus.draft, nullable=False, index=True)
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="templates")
    creator = relationship("User", back_populates="created_templates", foreign_keys=[created_by])
    days = relationship("TemplateDay", back_populates="template", cascade="all, delete-orphan", order_by="TemplateDay.day_number")
    itineraries = relationship("Itinerary", back_populates="template")


class TemplateDay(Base):
    __tablename__ = "template_days"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String, ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    day_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    template = relationship("Template", back_populates="days")
    activities = relationship("TemplateDayActivity", back_populates="template_day", cascade="all, delete-orphan", order_by="TemplateDayActivity.display_order")

    __table_args__ = (
        UniqueConstraint('template_id', 'day_number', name='_template_day_uc'),
    )


class TemplateDayActivity(Base):
    __tablename__ = "template_day_activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_day_id = Column(String, ForeignKey("template_days.id", ondelete="CASCADE"), nullable=False)
    # activity_id is nullable to support ad-hoc items (LOGISTICS, NOTE)
    activity_id = Column(String, ForeignKey("activities.id", ondelete="RESTRICT"), nullable=True)

    # Hybrid row pattern fields for ad-hoc items
    item_type = Column(String(20), default="LIBRARY_ACTIVITY", nullable=False)  # LIBRARY_ACTIVITY, LOGISTICS, NOTE
    custom_title = Column(String(255), nullable=True)  # Title for ad-hoc items
    custom_payload = Column(Text, nullable=True)  # JSON blob for extra details
    custom_icon = Column(String(50), nullable=True)  # Icon hint (hotel, taxi, plane, etc.)

    display_order = Column(Integer, default=0, nullable=False)
    time_slot = Column(String(50), nullable=True)
    custom_notes = Column(Text, nullable=True)

    # Gamification fields
    start_time = Column(String(10), nullable=True)  # e.g., "09:00"
    end_time = Column(String(10), nullable=True)  # e.g., "12:00"
    is_locked_by_agency = Column(Integer, default=1, nullable=False)  # 1=locked, 0=can be swapped

    # Relationships
    template_day = relationship("TemplateDay", back_populates="activities")
    activity = relationship("Activity", back_populates="template_day_activities")
