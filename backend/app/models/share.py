from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime
import secrets


class ShareLink(Base):
    __tablename__ = "share_links"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(String, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(100), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    live_updates_enabled = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    view_count = Column(Integer, default=0, nullable=False)
    last_viewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    itinerary = relationship("Itinerary", back_populates="share_links")

    @staticmethod
    def generate_token() -> str:
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)


class PDFExport(Base):
    __tablename__ = "pdf_exports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(String, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)
    generated_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    itinerary = relationship("Itinerary", back_populates="pdf_exports")
    generator = relationship("User", back_populates="generated_pdfs", foreign_keys=[generated_by])
