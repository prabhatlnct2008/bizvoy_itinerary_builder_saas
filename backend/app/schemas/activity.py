from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# Enums
class DurationUnit(str):
    minutes = "minutes"
    hours = "hours"
    days = "days"


class CostType(str):
    included = "included"
    extra = "extra"


# Activity Image Schemas
class ActivityImageResponse(BaseModel):
    id: str
    activity_id: str
    file_path: str
    file_url: Optional[str]
    display_order: int
    is_hero: bool
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ImageUpdateRequest(BaseModel):
    display_order: Optional[int] = None
    is_hero: Optional[bool] = None


# Activity Schemas
class ActivityCreate(BaseModel):
    activity_type_id: str
    name: str = Field(..., min_length=1, max_length=200)
    category_label: Optional[str] = Field(None, max_length=50)
    location_display: Optional[str] = Field(None, max_length=200)

    short_description: Optional[str] = None
    client_description: Optional[str] = None

    default_duration_value: Optional[int] = Field(None, ge=0)
    default_duration_unit: Optional[str] = None

    rating: Optional[Decimal] = Field(None, ge=0, le=5)
    group_size_label: Optional[str] = Field(None, max_length=50)

    cost_type: str = Field(default="included")
    cost_display: Optional[str] = Field(None, max_length=100)

    highlights: Optional[List[str]] = Field(default_factory=list)
    tags: Optional[List[str]] = Field(default_factory=list)

    is_active: bool = True
    internal_notes: Optional[str] = None


class ActivityUpdate(BaseModel):
    activity_type_id: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category_label: Optional[str] = Field(None, max_length=50)
    location_display: Optional[str] = Field(None, max_length=200)

    short_description: Optional[str] = None
    client_description: Optional[str] = None

    default_duration_value: Optional[int] = Field(None, ge=0)
    default_duration_unit: Optional[str] = None

    rating: Optional[Decimal] = Field(None, ge=0, le=5)
    group_size_label: Optional[str] = Field(None, max_length=50)

    cost_type: Optional[str] = None
    cost_display: Optional[str] = Field(None, max_length=100)

    highlights: Optional[List[str]] = None
    tags: Optional[List[str]] = None

    is_active: Optional[bool] = None
    internal_notes: Optional[str] = None


class ActivityListItem(BaseModel):
    id: str
    name: str
    activity_type_name: Optional[str] = None
    category_label: Optional[str]
    location_display: Optional[str]
    short_description: Optional[str]
    hero_image_url: Optional[str] = None
    is_active: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class ActivityDetailResponse(BaseModel):
    id: str
    agency_id: str
    activity_type_id: str
    activity_type_name: Optional[str] = None
    created_by_id: Optional[str]

    name: str
    category_label: Optional[str]
    location_display: Optional[str]

    short_description: Optional[str]
    client_description: Optional[str]

    default_duration_value: Optional[int]
    default_duration_unit: Optional[str]

    rating: Optional[Decimal]
    group_size_label: Optional[str]

    cost_type: str
    cost_display: Optional[str]

    highlights: Optional[List[str]]
    tags: Optional[List[str]]

    is_active: bool
    internal_notes: Optional[str]

    created_at: datetime
    updated_at: datetime

    images: List[ActivityImageResponse] = []

    class Config:
        from_attributes = True


class ActivityResponse(BaseModel):
    id: str
    agency_id: str
    activity_type_id: str
    name: str
    category_label: Optional[str]
    location_display: Optional[str]
    short_description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
