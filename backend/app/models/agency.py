from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime


class Agency(Base):
    __tablename__ = "agencies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), unique=True, index=True, nullable=False)
    subdomain = Column(String(100), unique=True, index=True, nullable=True)
    logo_url = Column(String(500), nullable=True)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # New fields for Agency Management
    legal_name = Column(String(255), nullable=True)
    country = Column(String(100), nullable=True)
    timezone = Column(String(100), nullable=True)
    default_currency = Column(String(10), nullable=True)
    website_url = Column(String(500), nullable=True)
    internal_notes = Column(Text, nullable=True)  # Only visible to bizvoy-admin

    # Relationships
    users = relationship("User", back_populates="agency", cascade="all, delete-orphan")
    roles = relationship("Role", back_populates="agency", cascade="all, delete-orphan")
    activity_types = relationship("ActivityType", back_populates="agency", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="agency", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="agency", cascade="all, delete-orphan")
    itineraries = relationship("Itinerary", back_populates="agency", cascade="all, delete-orphan")
    company_profile = relationship("CompanyProfile", back_populates="agency", uselist=False, cascade="all, delete-orphan")
    vibes = relationship("AgencyVibe", back_populates="agency", cascade="all, delete-orphan")
    personalization_settings = relationship("AgencyPersonalizationSettings", back_populates="agency", uselist=False, cascade="all, delete-orphan")
