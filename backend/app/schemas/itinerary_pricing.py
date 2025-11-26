from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ItineraryPricingCreate(BaseModel):
    """Schema for creating itinerary pricing"""
    base_package: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    taxes_fees: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    discount_code: Optional[str] = Field(None, max_length=50)
    discount_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    total: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    currency: str = Field(default="USD", max_length=10)
    pricing_notes: Optional[str] = None


class ItineraryPricingUpdate(BaseModel):
    """Schema for updating itinerary pricing"""
    base_package: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    taxes_fees: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    discount_code: Optional[str] = Field(None, max_length=50)
    discount_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    total: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    currency: Optional[str] = Field(None, max_length=10)
    pricing_notes: Optional[str] = None


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
    created_at: datetime
    updated_at: datetime

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

    class Config:
        from_attributes = True
