"""
Public API endpoints (no authentication required)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.core.deps import get_db
from app.schemas.share import (
    PublicItineraryResponse,
    PublicItineraryDay,
    PublicActivity,
    PublicActivityImage,
    PublicCompanyProfile,
    PublicPricing,
    TripOverview,
    ShareLinkResponse
)
from app.models.share import ShareLink
from app.models.itinerary import Itinerary
from app.models.company_profile import CompanyProfile
from app.utils.file_storage import file_storage

router = APIRouter()


def parse_highlights(highlights) -> list:
    """Parse highlights from JSON string or return as list"""
    if not highlights:
        return []
    if isinstance(highlights, list):
        return highlights
    try:
        return json.loads(highlights)
    except (json.JSONDecodeError, TypeError):
        return []


def count_activities_by_type(days, type_keyword: str) -> int:
    """Count activities by type keyword"""
    count = 0
    for day in days:
        for activity_item in day.activities:
            activity = activity_item.activity
            activity_type = activity.activity_type.name.lower() if activity.activity_type else ""
            category = (activity.category_label or "").lower()
            if type_keyword in activity_type or type_keyword in category:
                count += 1
    return count


@router.get("/itinerary/{token}", response_model=PublicItineraryResponse)
def get_public_itinerary(
    token: str,
    db: Session = Depends(get_db)
):
    """Get public itinerary by share token (no authentication required)"""
    # Find share link
    share_link = db.query(ShareLink).filter(
        ShareLink.token == token,
        ShareLink.is_active == True
    ).first()

    if not share_link:
        raise HTTPException(status_code=404, detail="Itinerary not found or link expired")

    # Check expiry
    if share_link.expires_at and share_link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link has expired")

    # Update view count
    share_link.view_count += 1
    share_link.last_viewed_at = datetime.utcnow()
    db.commit()

    # Get itinerary with all related data
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == share_link.itinerary_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    # Build days with activities
    days_data = []
    total_activities = 0

    for day in itinerary.days:
        activities_data = []

        for activity_item in day.activities:
            activity = activity_item.activity
            total_activities += 1

            # Parse highlights
            highlights = parse_highlights(activity.highlights)

            # Build images list
            images = []
            for img in activity.images:
                file_url = file_storage.get_file_url(img.file_path)
                images.append(PublicActivityImage(
                    url=file_url,
                    file_path=img.file_path,
                    caption=getattr(img, 'caption', None),
                    is_primary=getattr(img, 'is_primary', False) or getattr(img, 'is_hero', False),
                    is_hero=getattr(img, 'is_hero', False)
                ))

            # Format duration
            duration_value = activity.default_duration_value
            duration_unit = activity.default_duration_unit.value if activity.default_duration_unit else None

            activities_data.append(PublicActivity(
                id=activity_item.id,
                itinerary_day_id=activity_item.itinerary_day_id,
                activity_id=activity_item.activity_id,
                display_order=activity_item.display_order,
                time_slot=activity_item.time_slot,
                custom_notes=activity_item.custom_notes,
                custom_price=float(activity_item.custom_price) if activity_item.custom_price else None,
                name=activity.name,
                activity_type_name=activity.activity_type.name if activity.activity_type else None,
                category_label=activity.category_label,
                location_display=activity.location_display,
                short_description=activity.short_description,
                client_description=activity.client_description,
                default_duration_value=duration_value,
                default_duration_unit=duration_unit,
                rating=float(activity.rating) if activity.rating else None,
                group_size_label=activity.group_size_label,
                cost_type=activity.cost_type.value if activity.cost_type else "included",
                cost_display=activity.cost_display,
                highlights=highlights,
                images=images
            ))

        days_data.append(PublicItineraryDay(
            id=day.id,
            itinerary_id=day.itinerary_id,
            day_number=day.day_number,
            actual_date=day.actual_date.isoformat(),
            title=day.title,
            notes=day.notes,
            activities=activities_data
        ))

    # Calculate trip overview
    total_days = len(itinerary.days)
    total_nights = max(0, total_days - 1)

    # Count by activity type
    accommodation_count = count_activities_by_type(itinerary.days, "accommodation") + \
                          count_activities_by_type(itinerary.days, "hotel") + \
                          count_activities_by_type(itinerary.days, "stay")
    meal_count = count_activities_by_type(itinerary.days, "dining") + \
                 count_activities_by_type(itinerary.days, "meal") + \
                 count_activities_by_type(itinerary.days, "breakfast") + \
                 count_activities_by_type(itinerary.days, "lunch") + \
                 count_activities_by_type(itinerary.days, "dinner")
    transfer_count = count_activities_by_type(itinerary.days, "transfer") + \
                     count_activities_by_type(itinerary.days, "transport")
    activity_count = total_activities - accommodation_count - meal_count - transfer_count

    trip_overview = TripOverview(
        total_days=total_days,
        total_nights=total_nights,
        accommodation_count=accommodation_count,
        activity_count=max(0, activity_count),
        meal_count=meal_count,
        transfer_count=transfer_count
    )

    # Get company profile
    company_profile_data = None
    profile = db.query(CompanyProfile).filter(
        CompanyProfile.agency_id == itinerary.agency_id
    ).first()

    if profile:
        company_profile_data = PublicCompanyProfile(
            company_name=profile.company_name or itinerary.agency.name,
            tagline=profile.tagline,
            description=profile.description,
            logo_url=profile.logo_path,
            email=profile.email if profile.show_email else None,
            phone=profile.phone if profile.show_phone else None,
            website_url=profile.website_url if profile.show_website else None,
            payment_qr_url=profile.payment_qr_path,
            payment_note=profile.payment_note
        )
    else:
        # Fallback to agency data
        company_profile_data = PublicCompanyProfile(
            company_name=itinerary.agency.name,
            email=itinerary.agency.contact_email,
            phone=itinerary.agency.contact_phone
        )

    # Get pricing
    pricing_data = None
    if itinerary.pricing:
        pricing = itinerary.pricing
        pricing_data = PublicPricing(
            base_package=float(pricing.base_package) if pricing.base_package else None,
            taxes_fees=float(pricing.taxes_fees) if pricing.taxes_fees else None,
            discount_code=pricing.discount_code,
            discount_amount=float(pricing.discount_amount) if pricing.discount_amount else None,
            total=float(pricing.total) if pricing.total else None,
            currency=pricing.currency or "USD"
        )
    elif itinerary.total_price:
        # Fallback to simple total_price
        pricing_data = PublicPricing(
            total=float(itinerary.total_price),
            currency="USD"
        )

    # Build share link response
    share_link_response = ShareLinkResponse(
        id=share_link.id,
        itinerary_id=share_link.itinerary_id,
        token=share_link.token,
        is_active=share_link.is_active,
        live_updates_enabled=share_link.live_updates_enabled,
        expires_at=share_link.expires_at,
        view_count=share_link.view_count,
        last_viewed_at=share_link.last_viewed_at,
        created_at=share_link.created_at
    )

    return PublicItineraryResponse(
        id=itinerary.id,
        trip_name=itinerary.trip_name,
        client_name=itinerary.client_name,
        destination=itinerary.destination,
        start_date=itinerary.start_date.isoformat(),
        end_date=itinerary.end_date.isoformat(),
        num_adults=itinerary.num_adults,
        num_children=itinerary.num_children,
        status=itinerary.status.value,
        total_price=float(itinerary.total_price) if itinerary.total_price else None,
        special_notes=itinerary.special_notes,
        days=days_data,
        trip_overview=trip_overview,
        company_profile=company_profile_data,
        pricing=pricing_data,
        live_updates_enabled=share_link.live_updates_enabled,
        share_link=share_link_response
    )
