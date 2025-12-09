from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# Activity List Item (nested in Template responses)
class ActivityListItem(BaseModel):
    id: str
    name: str
    activity_type_name: Optional[str] = None
    category_label: Optional[str] = None
    location_display: Optional[str] = None
    short_description: Optional[str] = None
    hero_image_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


# Template Day Activity Schemas
class TemplateDayActivityCreate(BaseModel):
    # activity_id is optional to support ad-hoc items (LOGISTICS, NOTE)
    activity_id: Optional[str] = None
    # Hybrid row pattern fields
    item_type: Optional[str] = "LIBRARY_ACTIVITY"  # LIBRARY_ACTIVITY, LOGISTICS, NOTE
    custom_title: Optional[str] = None  # Title for ad-hoc items
    custom_payload: Optional[str] = None  # JSON string for extra details
    custom_icon: Optional[str] = None  # Icon hint (hotel, taxi, plane, etc.)
    display_order: int = 0
    time_slot: Optional[str] = None
    custom_notes: Optional[str] = None
    # Time fields
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_locked_by_agency: Optional[bool] = True


class TemplateDayActivityResponse(BaseModel):
    id: str
    template_day_id: str
    activity_id: Optional[str] = None  # Nullable for ad-hoc items
    activity: Optional[ActivityListItem] = None
    # Hybrid row pattern fields
    item_type: str = "LIBRARY_ACTIVITY"
    custom_title: Optional[str] = None
    custom_payload: Optional[str] = None
    custom_icon: Optional[str] = None
    display_order: int
    time_slot: Optional[str] = None
    custom_notes: Optional[str] = None
    # Time fields
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_locked_by_agency: bool = True

    class Config:
        from_attributes = True


class AttachActivityRequest(BaseModel):
    activity_id: str
    display_order: int = Field(default=0, ge=0)
    template_notes: Optional[str] = Field(None, alias="custom_notes")

    class Config:
        populate_by_name = True


class ReorderRequest(BaseModel):
    activity_ids: List[str] = Field(..., min_length=1)


class DayReorderRequest(BaseModel):
    day_ids: List[str] = Field(..., min_length=1, description="List of day IDs in desired order")


class TemplateDayCreate(BaseModel):
    day_number: Optional[int] = None  # Auto-assigned if not provided
    title: Optional[str] = None
    notes: Optional[str] = None
    activities: List[TemplateDayActivityCreate] = []


class TemplateDayUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None


class TemplateDayResponse(BaseModel):
    id: str
    template_id: str
    day_number: int
    title: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class TemplateDayDetailResponse(TemplateDayResponse):
    activities: List[TemplateDayActivityResponse] = []

    class Config:
        from_attributes = True


class TemplateBase(BaseModel):
    name: str
    destination: str
    duration_days: int
    duration_nights: int
    description: Optional[str] = None
    approximate_price: Optional[Decimal] = None


class TemplateCreate(TemplateBase):
    days: List[TemplateDayCreate] = []


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    destination: Optional[str] = None
    duration_days: Optional[int] = None
    duration_nights: Optional[int] = None
    description: Optional[str] = None
    approximate_price: Optional[Decimal] = None
    days: Optional[List[TemplateDayCreate]] = None


class TemplateResponse(TemplateBase):
    id: str
    agency_id: str
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TemplateDetailResponse(TemplateResponse):
    days: List[TemplateDayDetailResponse] = []

    class Config:
        from_attributes = True


class TemplateListItem(BaseModel):
    id: str
    name: str
    destination: str
    duration_nights: int
    duration_days: int
    status: str
    updated_at: datetime
    usage_count: Optional[int] = 0

    class Config:
        from_attributes = True
