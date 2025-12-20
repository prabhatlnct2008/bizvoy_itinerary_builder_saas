"""Bizvoy Admin API endpoints for Agency Management"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, timedelta

from app.core.deps import get_db, require_bizvoy_admin
from app.core.security import get_password_hash
from app.models.user import User
from app.models.agency import Agency
from app.models.itinerary import Itinerary
from app.models.template import Template
from app.schemas.admin import (
    AgencyCreate,
    AgencyUpdate,
    AgencyResponse,
    AgencyWithStatsResponse,
    AgencyListItem,
    AgencyListResponse,
    AdminDashboardStats,
    TopAgency,
    AdminUserResponse,
    ResendInvitationRequest,
    ResendInvitationResponse,
    AgencyStatusChange,
    ChangePasswordRequest,
    ChangePasswordResponse,
    AIModuleToggle,
    AIModuleResponse
)
from app.services.email_service import (
    generate_temporary_password,
    send_welcome_email,
    send_password_reset_email
)

router = APIRouter()


@router.get("/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bizvoy_admin)
):
    """Get admin dashboard statistics"""
    # Agency counts
    total_agencies = db.query(Agency).count()
    active_agencies = db.query(Agency).filter(Agency.is_active == True).count()
    inactive_agencies = total_agencies - active_agencies

    # Itinerary counts
    total_itineraries = db.query(Itinerary).count()

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    itineraries_last_30_days = db.query(Itinerary).filter(
        Itinerary.created_at >= thirty_days_ago
    ).count()

    # Other counts
    total_templates = db.query(Template).count()
    total_users = db.query(User).filter(User.is_bizvoy_admin == False).count()

    # Top 5 agencies by itinerary count
    top_agencies_query = db.query(
        Agency.id,
        Agency.name,
        func.count(Itinerary.id).label('itinerary_count'),
        func.max(Itinerary.updated_at).label('last_activity')
    ).outerjoin(
        Itinerary, Agency.id == Itinerary.agency_id
    ).filter(
        Agency.is_active == True
    ).group_by(
        Agency.id, Agency.name
    ).order_by(
        desc('itinerary_count')
    ).limit(5).all()

    top_agencies = [
        TopAgency(
            id=agency.id,
            name=agency.name,
            itinerary_count=agency.itinerary_count or 0,
            last_activity=agency.last_activity
        )
        for agency in top_agencies_query
    ]

    return AdminDashboardStats(
        total_agencies=total_agencies,
        active_agencies=active_agencies,
        inactive_agencies=inactive_agencies,
        total_itineraries=total_itineraries,
        itineraries_last_30_days=itineraries_last_30_days,
        total_templates=total_templates,
        total_users=total_users,
        top_agencies=top_agencies
    )


@router.get("/agencies", response_model=AgencyListResponse)
def list_agencies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, regex="^(active|inactive|all)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bizvoy_admin)
):
    """List all agencies with pagination and filters"""
    query = db.query(Agency)

    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Agency.name.ilike(search_term)) |
            (Agency.contact_email.ilike(search_term))
        )

    # Apply status filter
    if status_filter == "active":
        query = query.filter(Agency.is_active == True)
    elif status_filter == "inactive":
        query = query.filter(Agency.is_active == False)

    # Get total count
    total = query.count()

    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size

    # Get paginated results
    agencies = query.order_by(desc(Agency.created_at)).offset(offset).limit(page_size).all()

    # Build response items with stats
    items = []
    for agency in agencies:
        # Get primary admin (first superuser)
        primary_admin = db.query(User).filter(
            User.agency_id == agency.id,
            User.is_superuser == True
        ).first()

        # Get counts
        user_count = db.query(User).filter(User.agency_id == agency.id).count()
        itinerary_count = db.query(Itinerary).filter(Itinerary.agency_id == agency.id).count()

        items.append(AgencyListItem(
            id=agency.id,
            name=agency.name,
            contact_email=agency.contact_email,
            is_active=agency.is_active,
            created_at=agency.created_at,
            user_count=user_count,
            itinerary_count=itinerary_count,
            primary_admin_name=primary_admin.full_name if primary_admin else None,
            primary_admin_email=primary_admin.email if primary_admin else None
        ))

    return AgencyListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/agencies", response_model=AgencyWithStatsResponse, status_code=status.HTTP_201_CREATED)
def create_agency(
    agency_data: AgencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bizvoy_admin)
):
    """Create a new agency with admin user"""
    # Check if agency name already exists
    existing_agency = db.query(Agency).filter(Agency.name == agency_data.name).first()
    if existing_agency:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Agency with name '{agency_data.name}' already exists"
        )

    # Check if admin email already exists
    existing_user = db.query(User).filter(User.email == agency_data.admin_user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{agency_data.admin_user.email}' already exists"
        )

    # Generate temporary password
    temp_password = generate_temporary_password()

    # Create agency
    agency = Agency(
        name=agency_data.name,
        legal_name=agency_data.legal_name,
        country=agency_data.country,
        timezone=agency_data.timezone,
        default_currency=agency_data.default_currency,
        website_url=agency_data.website_url,
        internal_notes=agency_data.internal_notes,
        contact_email=agency_data.contact_email or agency_data.admin_user.email,
        is_active=True
    )
    db.add(agency)
    db.flush()  # Get agency ID

    # Create admin user
    admin_user = User(
        agency_id=agency.id,
        email=agency_data.admin_user.email,
        full_name=agency_data.admin_user.full_name,
        phone=agency_data.admin_user.phone,
        hashed_password=get_password_hash(temp_password),
        is_active=True,
        is_superuser=True,  # Agency admin
        is_bizvoy_admin=False,
        force_password_reset=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(agency)
    db.refresh(admin_user)

    # Send welcome email
    send_welcome_email(
        admin_name=admin_user.full_name,
        admin_email=admin_user.email,
        agency_name=agency.name,
        temporary_password=temp_password
    )

    return AgencyWithStatsResponse(
        id=agency.id,
        name=agency.name,
        legal_name=agency.legal_name,
        country=agency.country,
        timezone=agency.timezone,
        default_currency=agency.default_currency,
        website_url=agency.website_url,
        internal_notes=agency.internal_notes,
        contact_email=agency.contact_email,
        contact_phone=agency.contact_phone,
        logo_url=agency.logo_url,
        is_active=agency.is_active,
        created_at=agency.created_at,
        updated_at=agency.updated_at,
        user_count=1,
        itinerary_count=0,
        template_count=0,
        primary_admin=AdminUserResponse(
            id=admin_user.id,
            full_name=admin_user.full_name,
            email=admin_user.email,
            phone=admin_user.phone,
            is_active=admin_user.is_active,
            created_at=admin_user.created_at
        )
    )


@router.get("/agencies/{agency_id}", response_model=AgencyWithStatsResponse)
def get_agency(
    agency_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bizvoy_admin)
):
    """Get agency details by ID"""
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )

    # Get primary admin
    primary_admin = db.query(User).filter(
        User.agency_id == agency.id,
        User.is_superuser == True
    ).first()

    # Get counts
    user_count = db.query(User).filter(User.agency_id == agency.id).count()
    itinerary_count = db.query(Itinerary).filter(Itinerary.agency_id == agency.id).count()
    template_count = db.query(Template).filter(Template.agency_id == agency.id).count()

    return AgencyWithStatsResponse(
        id=agency.id,
        name=agency.name,
        legal_name=agency.legal_name,
        country=agency.country,
        timezone=agency.timezone,
        default_currency=agency.default_currency,
        website_url=agency.website_url,
        internal_notes=agency.internal_notes,
        contact_email=agency.contact_email,
        contact_phone=agency.contact_phone,
        logo_url=agency.logo_url,
        is_active=agency.is_active,
        created_at=agency.created_at,
        updated_at=agency.updated_at,
        user_count=user_count,
        itinerary_count=itinerary_count,
        template_count=template_count,
        primary_admin=AdminUserResponse(
            id=primary_admin.id,
            full_name=primary_admin.full_name,
            email=primary_admin.email,
            phone=primary_admin.phone,
            is_active=primary_admin.is_active,
            created_at=primary_admin.created_at
        ) if primary_admin else None
    )


@router.put("/agencies/{agency_id}", response_model=AgencyResponse)
def update_agency(
    agency_id: str,
    agency_data: AgencyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bizvoy_admin)
):
    """Update agency details"""
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )

    # Check for name conflict if updating name
    if agency_data.name and agency_data.name != agency.name:
        existing = db.query(Agency).filter(
            Agency.name == agency_data.name,
            Agency.id != agency_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Agency with name '{agency_data.name}' already exists"
            )

    # Update fields
    update_data = agency_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agency, field, value)

    db.commit()
    db.refresh(agency)

    return AgencyResponse.model_validate(agency)


@router.post("/agencies/{agency_id}/deactivate", response_model=AgencyStatusChange)
def deactivate_agency(
    agency_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bizvoy_admin)
):
    """Deactivate an agency (soft delete)"""
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )

    if not agency.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agency is already inactive"
        )

    agency.is_active = False
    db.commit()

    return AgencyStatusChange(
        id=agency.id,
        name=agency.name,
        is_active=False,
        message=f"Agency '{agency.name}' has been deactivated"
    )


@router.post("/agencies/{agency_id}/reactivate", response_model=AgencyStatusChange)
def reactivate_agency(
    agency_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bizvoy_admin)
):
    """Reactivate an inactive agency"""
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )

    if agency.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agency is already active"
        )

    agency.is_active = True
    db.commit()

    return AgencyStatusChange(
        id=agency.id,
        name=agency.name,
        is_active=True,
        message=f"Agency '{agency.name}' has been reactivated"
    )


@router.post("/agencies/{agency_id}/resend-invitation", response_model=ResendInvitationResponse)
def resend_invitation(
    agency_id: str,
    request: ResendInvitationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bizvoy_admin)
):
    """Resend invitation email with new credentials to agency admin"""
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )

    user = db.query(User).filter(
        User.id == request.user_id,
        User.agency_id == agency_id
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in this agency"
        )

    # Generate new password
    new_password = generate_temporary_password()
    user.hashed_password = get_password_hash(new_password)
    user.force_password_reset = True
    db.commit()

    # Send email
    success = send_password_reset_email(
        admin_name=user.full_name,
        admin_email=user.email,
        agency_name=agency.name,
        new_password=new_password
    )

    if success:
        return ResendInvitationResponse(
            success=True,
            message=f"Invitation email sent to {user.email}"
        )
    else:
        return ResendInvitationResponse(
            success=False,
            message="Failed to send email. Please try again."
        )


@router.post("/agencies/{agency_id}/change-password", response_model=ChangePasswordResponse)
def change_user_password(
    agency_id: str,
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bizvoy_admin)
):
    """Change user password with option for auto/manual generation and email notification"""
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )

    user = db.query(User).filter(
        User.id == request.user_id,
        User.agency_id == agency_id
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in this agency"
        )

    # Determine the password to use
    if request.password_mode == "auto":
        new_password = generate_temporary_password()
    else:
        new_password = request.manual_password

    # Update user password
    user.hashed_password = get_password_hash(new_password)
    user.force_password_reset = True
    db.commit()

    # Send email if requested
    email_sent = False
    if request.send_email:
        email_sent = send_password_reset_email(
            admin_name=user.full_name,
            admin_email=user.email,
            agency_name=agency.name,
            new_password=new_password
        )

    # Build response
    if request.send_email:
        if email_sent:
            return ChangePasswordResponse(
                success=True,
                message=f"Password changed and email sent to {user.email}",
                new_password=None
            )
        else:
            return ChangePasswordResponse(
                success=False,
                message="Password changed but failed to send email. Please share the password manually.",
                new_password=new_password
            )
    else:
        return ChangePasswordResponse(
            success=True,
            message="Password changed successfully",
            new_password=new_password
        )


@router.get("/agencies/{agency_id}/users", response_model=list[AdminUserResponse])
def get_agency_users(
    agency_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bizvoy_admin)
):
    """Get all users for an agency"""
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )

    users = db.query(User).filter(User.agency_id == agency_id).all()

    return [
        AdminUserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            is_active=user.is_active,
            created_at=user.created_at
        )
        for user in users
    ]


@router.patch("/agencies/{agency_id}/ai-modules", response_model=AIModuleResponse)
def toggle_ai_modules(
    agency_id: str,
    toggle_data: AIModuleToggle,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bizvoy_admin)
):
    """Toggle AI module permissions for an agency (Bizvoy Admin only)"""
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )

    # Update AI builder permission
    agency.ai_builder_enabled = toggle_data.ai_builder_enabled
    db.commit()
    db.refresh(agency)

    status_text = "enabled" if toggle_data.ai_builder_enabled else "disabled"
    return AIModuleResponse(
        id=agency.id,
        name=agency.name,
        ai_builder_enabled=agency.ai_builder_enabled,
        message=f"AI Itinerary Builder has been {status_text} for {agency.name}"
    )
