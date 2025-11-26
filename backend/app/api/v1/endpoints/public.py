from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.deps import get_db
from app.schemas.share import PublicItineraryResponse
from app.models.share import ShareLink
from app.models.itinerary import Itinerary

router = APIRouter()


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

    # Get itinerary
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == share_link.itinerary_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    # Build public-friendly response
    days_data = []
    for day in itinerary.days:
        activities_data = []
        for activity_item in day.activities:
            activity = activity_item.activity
            activities_data.append({
                "id": activity_item.id,
                "itinerary_day_id": activity_item.itinerary_day_id,
                "activity_id": activity_item.activity_id,
                "display_order": activity_item.display_order,
                "time_slot": activity_item.time_slot,
                "custom_notes": activity_item.custom_notes,
                "custom_price": float(activity_item.custom_price) if activity_item.custom_price is not None else None,
                # Activity details needed by the public page
                "name": activity.name,
                "type": activity.activity_type.name if activity.activity_type else None,
                "location": activity.location,
                "short_description": activity.short_description,
                "highlights": activity.highlights,
                "images": [{
                    "url": f"/uploads/{img.file_path}",
                    "file_path": f"/uploads/{img.file_path}",
                    "caption": img.caption,
                    "is_primary": img.is_primary
                } for img in activity.images]
            })

        days_data.append({
            "id": day.id,
            "itinerary_id": day.itinerary_id,
            "day_number": day.day_number,
            "actual_date": day.actual_date.isoformat(),
            "title": day.title,
            "notes": day.notes,
            "activities": activities_data
        })

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
        total_price=float(itinerary.total_price) if itinerary.total_price is not None else None,
        days=days_data,
        agency_name=itinerary.agency.name,
        agency_contact_email=itinerary.agency.contact_email,
        agency_contact_phone=itinerary.agency.contact_phone,
        live_updates_enabled=share_link.live_updates_enabled,
        share_link=share_link
    )
