from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
from datetime import datetime
from decimal import Decimal


# Enums as Literals for validation
AdvanceTypeEnum = Literal["fixed", "percent"]
PaymentTypeEnum = Literal["advance", "partial", "final", "full"]
PaymentMethodEnum = Literal["bank_transfer", "upi", "card", "cash", "cheque", "other"]


class ItineraryPricingCreate(BaseModel):
    """Schema for creating itinerary pricing"""
    base_package: Optional[Decimal] = Field(None, ge=0)
    taxes_fees: Optional[Decimal] = Field(None, ge=0)
    discount_code: Optional[str] = Field(None, max_length=50)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    total: Optional[Decimal] = Field(None, ge=0)
    currency: str = Field(default="USD", max_length=10)
    pricing_notes: Optional[str] = None

    # Payment schedule fields
    discount_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    advance_enabled: bool = False
    advance_type: Optional[AdvanceTypeEnum] = None
    advance_amount: Optional[Decimal] = Field(None, ge=0)
    advance_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    advance_deadline: Optional[datetime] = None
    final_deadline: Optional[datetime] = None


class ItineraryPricingUpdate(BaseModel):
    """Schema for updating itinerary pricing"""
    base_package: Optional[Decimal] = Field(None, ge=0)
    taxes_fees: Optional[Decimal] = Field(None, ge=0)
    discount_code: Optional[str] = Field(None, max_length=50)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    total: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    pricing_notes: Optional[str] = None

    # Payment schedule fields
    discount_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    advance_enabled: Optional[bool] = None
    advance_type: Optional[AdvanceTypeEnum] = None
    advance_amount: Optional[Decimal] = Field(None, ge=0)
    advance_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    advance_deadline: Optional[datetime] = None
    final_deadline: Optional[datetime] = None


class ItineraryPricingResponse(BaseModel):
    """Schema for itinerary pricing response"""
    id: str
    itinerary_id: str
    base_package: Optional[Decimal]
    taxes_fees: Optional[Decimal]
    discount_code: Optional[str]
    discount_amount: Optional[Decimal]
    total: Optional[Decimal]
    currency: str
    pricing_notes: Optional[str]

    # Payment schedule fields
    discount_percent: Optional[Decimal] = None
    advance_enabled: bool = False
    advance_type: Optional[str] = None
    advance_amount: Optional[Decimal] = None
    advance_percent: Optional[Decimal] = None
    advance_deadline: Optional[datetime] = None
    final_deadline: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    @field_validator('advance_enabled', mode='before')
    @classmethod
    def parse_advance_enabled(cls, v):
        """Convert integer to boolean"""
        if isinstance(v, int):
            return v == 1
        return v

    class Config:
        from_attributes = True


class ItineraryPricingPublic(BaseModel):
    """Schema for public-facing pricing (used in shared itinerary)"""
    base_package: Optional[Decimal]
    taxes_fees: Optional[Decimal]
    discount_code: Optional[str]
    discount_amount: Optional[Decimal]
    total: Optional[Decimal]
    currency: str

    # Payment schedule fields (visible to client)
    discount_percent: Optional[Decimal] = None
    advance_enabled: bool = False
    advance_type: Optional[str] = None
    advance_amount: Optional[Decimal] = None
    advance_percent: Optional[Decimal] = None
    advance_deadline: Optional[datetime] = None
    final_deadline: Optional[datetime] = None

    @field_validator('advance_enabled', mode='before')
    @classmethod
    def parse_advance_enabled(cls, v):
        """Convert integer to boolean"""
        if isinstance(v, int):
            return v == 1
        return v

    class Config:
        from_attributes = True


# ==================== PAYMENT RECORD SCHEMAS ====================


class ItineraryPaymentCreate(BaseModel):
    """Schema for recording a payment"""
    payment_type: PaymentTypeEnum
    amount: Decimal = Field(..., ge=0)
    currency: str = Field(default="USD", max_length=10)
    payment_method: Optional[PaymentMethodEnum] = None
    reference_number: Optional[str] = Field(None, max_length=100)
    paid_at: Optional[datetime] = None  # When client made the payment
    notes: Optional[str] = None


class ItineraryPaymentUpdate(BaseModel):
    """Schema for updating a payment record"""
    payment_type: Optional[PaymentTypeEnum] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    payment_method: Optional[PaymentMethodEnum] = None
    reference_number: Optional[str] = Field(None, max_length=100)
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None


class ItineraryPaymentResponse(BaseModel):
    """Schema for payment record response"""
    id: str
    itinerary_id: str
    payment_type: str
    amount: Decimal
    currency: str
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None
    confirmed_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ItineraryPaymentPublic(BaseModel):
    """Schema for public-facing payment record (used in shared itinerary)"""
    id: str
    payment_type: str
    amount: Decimal
    currency: str
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaymentSummary(BaseModel):
    """Summary of all payments for an itinerary"""
    total_amount: Decimal
    total_paid: Decimal
    balance_due: Decimal
    currency: str
    advance_required: Optional[Decimal] = None
    advance_paid: bool = False
    advance_deadline: Optional[datetime] = None
    final_deadline: Optional[datetime] = None
    payments: List[ItineraryPaymentPublic] = []


class ItineraryPricingWithPayments(ItineraryPricingResponse):
    """Pricing response with payment records and summary"""
    payments: List[ItineraryPaymentResponse] = []
    total_paid: Decimal = Decimal("0.00")
    balance_due: Decimal = Decimal("0.00")
    advance_required: Optional[Decimal] = None
    advance_paid: bool = False
