from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CompanyProfileUpdate(BaseModel):
    """Schema for updating company profile"""
    company_name: Optional[str] = Field(None, max_length=200)
    tagline: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    default_currency: Optional[str] = Field(None, max_length=10)
    accepted_currencies: Optional[str] = Field(None, max_length=255)  # CSV

    email: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    website_url: Optional[str] = Field(None, max_length=300)
    whatsapp_number: Optional[str] = Field(None, max_length=50)

    show_phone: Optional[bool] = None
    show_email: Optional[bool] = None
    show_website: Optional[bool] = None

    payment_note: Optional[str] = None
    bank_account_name: Optional[str] = Field(None, max_length=200)
    bank_name: Optional[str] = Field(None, max_length=200)
    bank_account_number: Optional[str] = Field(None, max_length=100)
    bank_ifsc_swift: Optional[str] = Field(None, max_length=50)
    bank_reference_note: Optional[str] = None


class CompanyProfileResponse(BaseModel):
    """Schema for company profile response"""
    id: str
    agency_id: str

    company_name: Optional[str]
    tagline: Optional[str]
    description: Optional[str]
    logo_path: Optional[str]
    logo_url: Optional[str]

    email: Optional[str]
    phone: Optional[str]
    website_url: Optional[str]
    whatsapp_number: Optional[str]

    show_phone: bool
    show_email: bool
    show_website: bool

    payment_qr_path: Optional[str]
    payment_qr_url: Optional[str]
    payment_note: Optional[str]
    bank_account_name: Optional[str]
    bank_name: Optional[str]
    bank_account_number: Optional[str]
    bank_ifsc_swift: Optional[str]
    bank_reference_note: Optional[str]

    created_at: datetime
    updated_at: datetime
    default_currency: Optional[str] = None
    accepted_currencies: Optional[str] = None

    class Config:
        from_attributes = True


class CompanyProfilePublic(BaseModel):
    """Schema for public-facing company profile (used in shared itinerary)"""
    company_name: Optional[str]
    tagline: Optional[str]
    description: Optional[str]
    logo_url: Optional[str]

    email: Optional[str] = None  # Only included if show_email is True
    phone: Optional[str] = None  # Only included if show_phone is True
    website_url: Optional[str] = None  # Only included if show_website is True

    payment_qr_url: Optional[str]
    payment_note: Optional[str]

    class Config:
        from_attributes = True
