from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String, ForeignKey("agencies.id", ondelete="CASCADE"), nullable=True, index=True)  # Nullable for bizvoy-admin users
    email = Column(String(255), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)  # Agency admin
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # New fields for Agency Management
    phone = Column(String(50), nullable=True)
    is_bizvoy_admin = Column(Boolean, default=False, nullable=False)  # Bizvoy platform admin
    force_password_reset = Column(Boolean, default=False, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="users")
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    created_templates = relationship("Template", back_populates="creator", foreign_keys="Template.created_by")
    created_itineraries = relationship("Itinerary", back_populates="creator", foreign_keys="Itinerary.created_by")
    generated_pdfs = relationship("PDFExport", back_populates="generator", foreign_keys="PDFExport.generated_by")

    __table_args__ = (
        UniqueConstraint('agency_id', 'email', name='_agency_email_uc'),
    )
