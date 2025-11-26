from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


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


class PublicItineraryResponse(BaseModel):
    """Public itinerary response including share link and itinerary details"""
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
    days: List[Dict[str, Any]]
    agency_name: str
    agency_contact_email: str
    agency_contact_phone: Optional[str] = None
    live_updates_enabled: bool
    share_link: ShareLinkResponse
