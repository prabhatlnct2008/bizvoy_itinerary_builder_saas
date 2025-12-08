from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class ItineraryDayActivityCreate(BaseModel):
    activity_id: str
    display_order: int = 0
    time_slot: Optional[str] = None
    custom_notes: Optional[str] = None
    custom_price: Optional[Decimal] = None


class ItineraryDayActivityResponse(BaseModel):
    id: str
    itinerary_day_id: str
    activity_id: str
    display_order: int
    time_slot: Optional[str] = None
    custom_notes: Optional[str] = None
    custom_price: Optional[Decimal] = None

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
    personalization_enabled: Optional[bool] = False
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
