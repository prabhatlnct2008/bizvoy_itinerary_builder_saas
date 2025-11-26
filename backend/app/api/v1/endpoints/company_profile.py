"""
Company Profile API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import uuid
import os
from datetime import datetime

from app.core.deps import get_db, get_current_user, get_current_agency_id, require_permission
from app.models.user import User
from app.models.company_profile import CompanyProfile
from app.schemas.company_profile import CompanyProfileUpdate, CompanyProfileResponse

router = APIRouter()

# Directory for uploads
UPLOAD_DIR = "uploads"


def get_or_create_profile(db: Session, agency_id: str) -> CompanyProfile:
    """Get existing company profile or create a new one"""
    profile = db.query(CompanyProfile).filter(
        CompanyProfile.agency_id == agency_id
    ).first()

    if not profile:
        profile = CompanyProfile(
            id=str(uuid.uuid4()),
            agency_id=agency_id,
            show_phone=True,
            show_email=True,
            show_website=True,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile


@router.get("", response_model=CompanyProfileResponse)
async def get_company_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: bool = Depends(require_permission("settings.view")),
):
    """
    Get the company profile for the current agency.
    Creates a default profile if one doesn't exist.
    """
    profile = get_or_create_profile(db, agency_id)

    # Convert to response with computed URLs
    response = CompanyProfileResponse(
        id=profile.id,
        agency_id=profile.agency_id,
        company_name=profile.company_name,
        tagline=profile.tagline,
        description=profile.description,
        logo_path=profile.logo_path,
        logo_url=profile.logo_path,  # Same as logo_path for now
        email=profile.email,
        phone=profile.phone,
        website_url=profile.website_url,
        whatsapp_number=profile.whatsapp_number,
        show_phone=profile.show_phone,
        show_email=profile.show_email,
        show_website=profile.show_website,
        payment_qr_path=profile.payment_qr_path,
        payment_qr_url=profile.payment_qr_path,  # Same as path for now
        payment_note=profile.payment_note,
        bank_account_name=profile.bank_account_name,
        bank_name=profile.bank_name,
        bank_account_number=profile.bank_account_number,
        bank_ifsc_swift=profile.bank_ifsc_swift,
        bank_reference_note=profile.bank_reference_note,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )

    return response


@router.put("", response_model=CompanyProfileResponse)
async def update_company_profile(
    profile_data: CompanyProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: bool = Depends(require_permission("settings.edit")),
):
    """
    Update the company profile for the current agency.
    """
    profile = get_or_create_profile(db, agency_id)

    # Update fields if provided
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    # Convert to response
    response = CompanyProfileResponse(
        id=profile.id,
        agency_id=profile.agency_id,
        company_name=profile.company_name,
        tagline=profile.tagline,
        description=profile.description,
        logo_path=profile.logo_path,
        logo_url=profile.logo_path,
        email=profile.email,
        phone=profile.phone,
        website_url=profile.website_url,
        whatsapp_number=profile.whatsapp_number,
        show_phone=profile.show_phone,
        show_email=profile.show_email,
        show_website=profile.show_website,
        payment_qr_path=profile.payment_qr_path,
        payment_qr_url=profile.payment_qr_path,
        payment_note=profile.payment_note,
        bank_account_name=profile.bank_account_name,
        bank_name=profile.bank_name,
        bank_account_number=profile.bank_account_number,
        bank_ifsc_swift=profile.bank_ifsc_swift,
        bank_reference_note=profile.bank_reference_note,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )

    return response


@router.post("/logo", response_model=CompanyProfileResponse)
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: bool = Depends(require_permission("settings.edit")),
):
    """
    Upload company logo image.
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB."
        )

    # Create directory structure
    upload_path = os.path.join(UPLOAD_DIR, agency_id, "company")
    os.makedirs(upload_path, exist_ok=True)

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] if file.filename else ".png"
    filename = f"logo_{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_path, filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)

    # Update profile
    profile = get_or_create_profile(db, agency_id)

    # Delete old logo if exists
    if profile.logo_path:
        old_path = profile.logo_path.lstrip("/")
        if os.path.exists(old_path):
            os.remove(old_path)

    profile.logo_path = f"/{file_path}"
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    # Convert to response
    return CompanyProfileResponse(
        id=profile.id,
        agency_id=profile.agency_id,
        company_name=profile.company_name,
        tagline=profile.tagline,
        description=profile.description,
        logo_path=profile.logo_path,
        logo_url=profile.logo_path,
        email=profile.email,
        phone=profile.phone,
        website_url=profile.website_url,
        whatsapp_number=profile.whatsapp_number,
        show_phone=profile.show_phone,
        show_email=profile.show_email,
        show_website=profile.show_website,
        payment_qr_path=profile.payment_qr_path,
        payment_qr_url=profile.payment_qr_path,
        payment_note=profile.payment_note,
        bank_account_name=profile.bank_account_name,
        bank_name=profile.bank_name,
        bank_account_number=profile.bank_account_number,
        bank_ifsc_swift=profile.bank_ifsc_swift,
        bank_reference_note=profile.bank_reference_note,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.post("/payment-qr", response_model=CompanyProfileResponse)
async def upload_payment_qr(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: bool = Depends(require_permission("settings.edit")),
):
    """
    Upload payment QR code image.
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # Validate file size (max 2MB)
    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 2MB."
        )

    # Create directory structure
    upload_path = os.path.join(UPLOAD_DIR, agency_id, "company")
    os.makedirs(upload_path, exist_ok=True)

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] if file.filename else ".png"
    filename = f"payment_qr_{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_path, filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)

    # Update profile
    profile = get_or_create_profile(db, agency_id)

    # Delete old QR if exists
    if profile.payment_qr_path:
        old_path = profile.payment_qr_path.lstrip("/")
        if os.path.exists(old_path):
            os.remove(old_path)

    profile.payment_qr_path = f"/{file_path}"
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    # Convert to response
    return CompanyProfileResponse(
        id=profile.id,
        agency_id=profile.agency_id,
        company_name=profile.company_name,
        tagline=profile.tagline,
        description=profile.description,
        logo_path=profile.logo_path,
        logo_url=profile.logo_path,
        email=profile.email,
        phone=profile.phone,
        website_url=profile.website_url,
        whatsapp_number=profile.whatsapp_number,
        show_phone=profile.show_phone,
        show_email=profile.show_email,
        show_website=profile.show_website,
        payment_qr_path=profile.payment_qr_path,
        payment_qr_url=profile.payment_qr_path,
        payment_note=profile.payment_note,
        bank_account_name=profile.bank_account_name,
        bank_name=profile.bank_name,
        bank_account_number=profile.bank_account_number,
        bank_ifsc_swift=profile.bank_ifsc_swift,
        bank_reference_note=profile.bank_reference_note,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
