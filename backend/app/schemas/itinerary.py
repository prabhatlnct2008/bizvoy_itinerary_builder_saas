from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any, Literal
from datetime import datetime, date
from decimal import Decimal
import json


# Item types for hybrid row pattern
ItemTypeEnum = Literal["LIBRARY_ACTIVITY", "LOGISTICS", "NOTE"]


class ItineraryDayActivityCreate(BaseModel):
    """Create an activity in an itinerary day - supports both library items and ad-hoc items"""
    # For library items, activity_id is required; for ad-hoc items, it's null
    activity_id: Optional[str] = None

    # Item type determines rendering and validation
    item_type: ItemTypeEnum = "LIBRARY_ACTIVITY"

    # For ad-hoc items (LOGISTICS, NOTE)
    custom_title: Optional[str] = None
    custom_payload: Optional[dict] = None  # JSON blob for extra details
    custom_icon: Optional[str] = None  # Icon hint (hotel, taxi, plane, etc.)

    display_order: int = 0
    time_slot: Optional[str] = None  # morning, afternoon, evening
    custom_notes: Optional[str] = None
    custom_price: Optional[Decimal] = None
    price_amount: Optional[Decimal] = None
    price_currency: Optional[str] = None
    pricing_unit: Optional[str] = "flat"
    quantity: Optional[int] = 1
    item_discount_amount: Optional[Decimal] = None

    # Time fields
    start_time: Optional[str] = None  # e.g., "09:00"
    end_time: Optional[str] = None  # e.g., "12:00"
    is_locked_by_agency: bool = False


class ItineraryDayActivityResponse(BaseModel):
    """Response for an activity in an itinerary day"""
    id: str
    itinerary_day_id: str
    activity_id: Optional[str] = None

    # Item type and custom fields
    item_type: str = "LIBRARY_ACTIVITY"
    custom_title: Optional[str] = None
    custom_payload: Optional[Any] = None
    custom_icon: Optional[str] = None

    display_order: int
    time_slot: Optional[str] = None
    custom_notes: Optional[str] = None
    custom_price: Optional[Decimal] = None
    price_amount: Optional[Decimal] = None
    price_currency: Optional[str] = None
    pricing_unit: Optional[str] = None
    quantity: Optional[int] = None
    item_discount_amount: Optional[Decimal] = None

    # Time fields
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_locked_by_agency: bool = False
    source_cart_item_id: Optional[str] = None
    added_by_personalization: bool = False

    @field_validator('custom_payload', mode='before')
    @classmethod
    def parse_custom_payload(cls, v):
        """Parse custom_payload from JSON string if needed"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    @field_validator('is_locked_by_agency', mode='before')
    @classmethod
    def parse_is_locked(cls, v):
        """Convert integer to boolean"""
        if isinstance(v, int):
            return v == 1
        return v

    @field_validator('added_by_personalization', mode='before')
    @classmethod
    def parse_added_by(cls, v):
        """Convert integer to boolean"""
        if isinstance(v, int):
            return v == 1
        return v

    class Config:
        from_attributes = True


class ItineraryDayCreate(BaseModel):
    day_number: int
    actual_date: date
    title: Optional[str] = None
    notes: Optional[str] = None
    activities: List[ItineraryDayActivityCreate] = []


class ItineraryDayResponse(BaseModel):
    id: str
    itinerary_id: str
    day_number: int
    actual_date: date
    title: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ItineraryDayDetailResponse(ItineraryDayResponse):
    activities: List[ItineraryDayActivityResponse] = []

    class Config:
        from_attributes = True


class ItineraryBase(BaseModel):
    trip_name: str
    client_name: str
    client_email: Optional[EmailStr] = None
    client_phone: Optional[str] = None
    destination: str
    start_date: date
    end_date: date
    num_adults: int = 1
    num_children: int = 0
    special_notes: Optional[str] = None


class ItineraryCreate(ItineraryBase):
    template_id: Optional[str] = None
    days: List[ItineraryDayCreate] = []
    # Personalization settings
    # Default to None so the backend can auto-enable based on agency settings
    personalization_enabled: Optional[bool] = None
    personalization_policy: Optional[str] = "flexible"
    personalization_lock_policy: Optional[str] = "respect_locks"


class ItineraryUpdate(BaseModel):
    trip_name: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[EmailStr] = None
    client_phone: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    num_adults: Optional[int] = None
    num_children: Optional[int] = None
    status: Optional[str] = None
    total_price: Optional[Decimal] = None
    currency: Optional[str] = None
    special_notes: Optional[str] = None
    days: Optional[List[ItineraryDayCreate]] = None
    # Personalization settings
    personalization_enabled: Optional[bool] = None
    personalization_policy: Optional[str] = None
    personalization_lock_policy: Optional[str] = None


class ItineraryResponse(ItineraryBase):
    id: str
    agency_id: str
    template_id: Optional[str] = None
    status: str
    total_price: Optional[Decimal] = None
    currency: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Personalization settings
    personalization_enabled: bool = False
    personalization_policy: Optional[str] = "flexible"
    personalization_lock_policy: Optional[str] = "respect_locks"
    personalization_completed: bool = False

    class Config:
        from_attributes = True


class ItineraryDetailResponse(ItineraryResponse):
    days: List[ItineraryDayDetailResponse] = []

    class Config:
        from_attributes = True
