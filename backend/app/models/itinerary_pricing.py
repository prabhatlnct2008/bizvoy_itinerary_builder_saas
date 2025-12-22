from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Numeric, Integer
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime
from decimal import Decimal


class ItineraryPricing(Base):
    """
    ItineraryPricing stores the price breakdown and payment schedule for an itinerary.
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

    # Discount percentage (alternative to fixed discount_amount)
    discount_percent = Column(Numeric(5, 2), nullable=True)  # e.g., 10.00 for 10%

    # Currency
    currency = Column(String(10), default="USD", nullable=False)

    # Notes (optional)
    pricing_notes = Column(Text, nullable=True)

    # ===== PAYMENT SCHEDULE =====

    # Advance Payment Settings
    advance_enabled = Column(Integer, default=0, nullable=False)  # 0=no, 1=yes
    advance_type = Column(String(20), nullable=True)  # 'fixed' or 'percent'
    advance_amount = Column(Numeric(10, 2), nullable=True)  # Fixed amount if type='fixed'
    advance_percent = Column(Numeric(5, 2), nullable=True)  # Percentage if type='percent'
    advance_deadline = Column(DateTime, nullable=True)  # When advance payment is due

    # Final Payment Deadline
    final_deadline = Column(DateTime, nullable=True)  # When remaining balance is due

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

    def calculate_discount_from_percent(self) -> float:
        """Calculate discount amount from percentage"""
        if not self.discount_percent:
            return 0.0
        subtotal = float(self.base_package or 0) + float(self.taxes_fees or 0)
        return subtotal * (float(self.discount_percent) / 100)

    def get_advance_amount(self) -> float:
        """Get the advance amount based on type (fixed or percent)"""
        if not self.advance_enabled:
            return 0.0
        if self.advance_type == 'fixed':
            return float(self.advance_amount or 0)
        elif self.advance_type == 'percent':
            total = float(self.total or 0)
            return total * (float(self.advance_percent or 0) / 100)
        return 0.0

    def __repr__(self):
        return f"<ItineraryPricing(id={self.id}, itinerary_id={self.itinerary_id}, total={self.total})>"
