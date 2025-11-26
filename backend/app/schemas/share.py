from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class ShareLinkCreate(BaseModel):
    live_updates_enabled: bool = False
    expires_at: Optional[datetime] = None


class ShareLinkUpdate(BaseModel):
    is_active: Optional[bool] = None
    live_updates_enabled: Optional[bool] = None
    expires_at: Optional[datetime] = None


class ShareLinkResponse(BaseModel):
    id: str
    itinerary_id: str
    token: str
    is_active: bool
    live_updates_enabled: bool
    expires_at: Optional[datetime] = None
    view_count: int
    last_viewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PDFExportResponse(BaseModel):
    id: str
    itinerary_id: str
    file_path: str
    generated_by: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True


# --- Public Activity Image ---
class PublicActivityImage(BaseModel):
    url: str
    file_path: str
    caption: Optional[str] = None
    is_primary: bool = False
    is_hero: bool = False


# --- Public Activity ---
class PublicActivity(BaseModel):
    id: str
    itinerary_day_id: str
    activity_id: str
    display_order: int
    time_slot: Optional[str] = None
    custom_notes: Optional[str] = None
    custom_price: Optional[float] = None

    # Activity details
    name: str
    activity_type_name: Optional[str] = None
    category_label: Optional[str] = None
    location_display: Optional[str] = None
    short_description: Optional[str] = None
    client_description: Optional[str] = None

    # Meta
    default_duration_value: Optional[int] = None
    default_duration_unit: Optional[str] = None
    rating: Optional[float] = None
    group_size_label: Optional[str] = None
    cost_type: str = "included"
    cost_display: Optional[str] = None

    # Highlights
    highlights: Optional[List[str]] = None

    # Images
    images: List[PublicActivityImage] = []


# --- Public Day ---
class PublicItineraryDay(BaseModel):
    id: str
    itinerary_id: str
    day_number: int
    actual_date: str
    title: Optional[str] = None
    notes: Optional[str] = None
    activities: List[PublicActivity] = []


# --- Company Profile for Public ---
class PublicCompanyProfile(BaseModel):
    company_name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None

    email: Optional[str] = None
    phone: Optional[str] = None
    website_url: Optional[str] = None

    payment_qr_url: Optional[str] = None
    payment_note: Optional[str] = None


# --- Pricing for Public ---
class PublicPricing(BaseModel):
    base_package: Optional[float] = None
    taxes_fees: Optional[float] = None
    discount_code: Optional[str] = None
    discount_amount: Optional[float] = None
    total: Optional[float] = None
    currency: str = "USD"


# --- Trip Overview Stats ---
class TripOverview(BaseModel):
    total_days: int
    total_nights: int
    accommodation_count: int
    activity_count: int
    meal_count: int
    transfer_count: int


# --- Main Public Response ---
class PublicItineraryResponse(BaseModel):
    """Public itinerary response including all details for shared view"""
    id: str
    trip_name: str
    client_name: str
    destination: str
    start_date: str
    end_date: str
    num_adults: int
    num_children: int
    status: str
    total_price: Optional[float] = None
    special_notes: Optional[str] = None

    # Days with activities
    days: List[PublicItineraryDay]

    # Trip overview stats
    trip_overview: TripOverview

    # Company/Agency info
    company_profile: Optional[PublicCompanyProfile] = None

    # Pricing breakdown
    pricing: Optional[PublicPricing] = None

    # Share link metadata
    live_updates_enabled: bool
    share_link: ShareLinkResponse
