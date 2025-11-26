from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime


class ItineraryPricing(Base):
    """
    ItineraryPricing stores the price breakdown for an itinerary.
    Each itinerary has exactly one pricing record.
    """
    __tablename__ = "itinerary_pricing"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # Price breakdown
    base_package = Column(Numeric(10, 2), nullable=True)
    taxes_fees = Column(Numeric(10, 2), nullable=True)
    discount_code = Column(String(50), nullable=True)
    discount_amount = Column(Numeric(10, 2), nullable=True)
    total = Column(Numeric(10, 2), nullable=True)  # Computed: base_package + taxes_fees - discount_amount

    # Currency
    currency = Column(String(10), default="USD", nullable=False)

    # Notes (optional)
    pricing_notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    itinerary = relationship("Itinerary", back_populates="pricing")

    def calculate_total(self) -> float:
        """Calculate total from components"""
        base = float(self.base_package or 0)
        taxes = float(self.taxes_fees or 0)
        discount = float(self.discount_amount or 0)
        return base + taxes - discount

    def __repr__(self):
        return f"<ItineraryPricing(id={self.id}, itinerary_id={self.itinerary_id}, total={self.total})>"
