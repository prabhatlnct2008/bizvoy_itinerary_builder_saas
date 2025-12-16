"""Schemas for Bizvoy Admin - Agency Management"""

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


# Agency Schemas
class AgencyAdminUserCreate(BaseModel):
    """Admin user details for agency creation"""
    full_name: str
    email: EmailStr
    phone: Optional[str] = None


class AgencyCreate(BaseModel):
    """Create a new agency with admin user"""
    # Agency details
    name: str
    legal_name: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    default_currency: Optional[str] = None
    website_url: Optional[str] = None
    internal_notes: Optional[str] = None
    contact_email: Optional[str] = None  # Will default to admin email if not provided

    # Admin user details
    admin_user: AgencyAdminUserCreate

    @field_validator('name')
    @classmethod
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Agency name cannot be empty')
        return v.strip()


class AgencyUpdate(BaseModel):
    """Update agency details"""
    name: Optional[str] = None
    legal_name: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    default_currency: Optional[str] = None
    website_url: Optional[str] = None
    internal_notes: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    logo_url: Optional[str] = None


class AdminUserResponse(BaseModel):
    """Admin user response (for agency detail)"""
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AgencyResponse(BaseModel):
    """Agency response with details"""
    id: str
    name: str
    legal_name: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    default_currency: Optional[str] = None
    website_url: Optional[str] = None
    internal_notes: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # AI Module permissions
    ai_builder_enabled: bool = False

    class Config:
        from_attributes = True


class AgencyWithStatsResponse(AgencyResponse):
    """Agency response with usage statistics"""
    user_count: int = 0
    itinerary_count: int = 0
    template_count: int = 0
    primary_admin: Optional[AdminUserResponse] = None


class AgencyListItem(BaseModel):
    """Agency item for list view"""
    id: str
    name: str
    contact_email: str
    is_active: bool
    created_at: datetime
    user_count: int = 0
    itinerary_count: int = 0
    primary_admin_name: Optional[str] = None
    primary_admin_email: Optional[str] = None

    class Config:
        from_attributes = True


class AgencyListResponse(BaseModel):
    """Paginated agency list response"""
    items: List[AgencyListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# Dashboard Statistics Schemas
class TopAgency(BaseModel):
    """Top agency by usage"""
    id: str
    name: str
    itinerary_count: int
    last_activity: Optional[datetime] = None


class AdminDashboardStats(BaseModel):
    """Admin dashboard statistics"""
    total_agencies: int
    active_agencies: int
    inactive_agencies: int
    total_itineraries: int
    itineraries_last_30_days: int
    total_templates: int
    total_users: int
    top_agencies: List[TopAgency]


# Action Schemas
class ResendInvitationRequest(BaseModel):
    """Request to resend invitation email"""
    user_id: str


class ResendInvitationResponse(BaseModel):
    """Response after resending invitation"""
    success: bool
    message: str


class AgencyStatusChange(BaseModel):
    """Response for agency status change"""
    id: str
    name: str
    is_active: bool
    message: str


class ChangePasswordRequest(BaseModel):
    """Request to change user password"""
    user_id: str
    password_mode: str  # "auto" or "manual"
    manual_password: Optional[str] = None
    send_email: bool = True

    @field_validator('password_mode')
    @classmethod
    def validate_mode(cls, v):
        if v not in ['auto', 'manual']:
            raise ValueError('password_mode must be "auto" or "manual"')
        return v

    @field_validator('manual_password')
    @classmethod
    def validate_manual_password(cls, v, info):
        if info.data.get('password_mode') == 'manual':
            if not v or len(v) < 8:
                raise ValueError('Manual password must be at least 8 characters')
        return v


class ChangePasswordResponse(BaseModel):
    """Response after changing password"""
    success: bool
    message: str
    new_password: Optional[str] = None  # Only returned if email not sent


# AI Module Schemas
class AIModuleToggle(BaseModel):
    """Toggle AI module for an agency"""
    ai_builder_enabled: bool


class AIModuleResponse(BaseModel):
    """Response after toggling AI module"""
    id: str
    name: str
    ai_builder_enabled: bool
    message: str
