from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime


class CompanyProfile(Base):
    """
    CompanyProfile stores agency branding, contact info, and payment configuration.
    Each agency has exactly one profile.
    """
    __tablename__ = "company_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # Branding
    company_name = Column(String(200), nullable=True)
    tagline = Column(String(200), nullable=True)  # e.g., "Your Travel Partner"
    description = Column(Text, nullable=True)  # 2-4 lines for shared page
    logo_path = Column(String(500), nullable=True)  # File path to logo

    # Contact Details
    email = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    website_url = Column(String(300), nullable=True)
    whatsapp_number = Column(String(50), nullable=True)

    # Shared Page Visibility Options
    show_phone = Column(Boolean, default=True, nullable=False)
    show_email = Column(Boolean, default=True, nullable=False)
    show_website = Column(Boolean, default=True, nullable=False)

    # Payment Info
    payment_qr_path = Column(String(500), nullable=True)  # Path to QR code image
    payment_note = Column(Text, nullable=True)  # e.g., "Secure payment powered by Stripe"
    bank_account_name = Column(String(200), nullable=True)
    bank_name = Column(String(200), nullable=True)
    bank_account_number = Column(String(100), nullable=True)
    bank_ifsc_swift = Column(String(50), nullable=True)
    bank_reference_note = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="company_profile")

    @property
    def logo_url(self) -> str | None:
        """Generate URL for logo"""
        if self.logo_path:
            return self.logo_path
        return None

    @property
    def payment_qr_url(self) -> str | None:
        """Generate URL for payment QR code"""
        if self.payment_qr_path:
            return self.payment_qr_path
        return None

    def __repr__(self):
        return f"<CompanyProfile(id={self.id}, agency_id={self.agency_id}, company_name={self.company_name})>"
