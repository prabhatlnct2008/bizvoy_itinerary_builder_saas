"""
ItineraryPayment model for tracking payment records.

This table stores actual payments received for an itinerary.
Agency manually records payments as they are received.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid
from datetime import datetime
import enum


class PaymentType(str, enum.Enum):
    """Type of payment"""
    advance = "advance"
    partial = "partial"
    final = "final"
    full = "full"


class PaymentMethod(str, enum.Enum):
    """Method of payment"""
    bank_transfer = "bank_transfer"
    upi = "upi"
    card = "card"
    cash = "cash"
    cheque = "cheque"
    other = "other"


class ItineraryPayment(Base):
    """
    ItineraryPayment tracks individual payments received for an itinerary.

    An itinerary can have multiple payments (advance, partial payments, final).
    Agency records payments as they are received from the client.
    """
    __tablename__ = "itinerary_payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)

    # Payment details
    payment_type = Column(String(20), nullable=False)  # advance, partial, final, full
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)

    # Payment info
    payment_method = Column(String(30), nullable=True)  # bank_transfer, upi, card, cash, etc.
    reference_number = Column(String(100), nullable=True)  # UTR, transaction ID, cheque number
    paid_at = Column(DateTime, nullable=True)  # When client made the payment
    notes = Column(Text, nullable=True)

    # Audit trail
    confirmed_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    itinerary = relationship("Itinerary", back_populates="payments")
    confirmed_by_user = relationship("User", foreign_keys=[confirmed_by])

    def __repr__(self):
        return f"<ItineraryPayment(id={self.id}, itinerary_id={self.itinerary_id}, amount={self.amount}, type={self.payment_type})>"
