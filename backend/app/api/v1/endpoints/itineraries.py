from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from app.core.deps import get_db, get_current_user, get_current_agency_id, require_permission
from app.schemas.itinerary import (
    ItineraryCreate,
    ItineraryUpdate,
    ItineraryResponse,
    ItineraryDetailResponse,
    ItineraryDayDetailResponse,
    ItineraryDayActivityResponse
)
from app.schemas.auth import MessageResponse
from app.models.itinerary import Itinerary, ItineraryDay, ItineraryDayActivity
from app.models.share import ShareLink
from app.models.user import User
from app.services.template_service import template_service
from app.services.websocket_service import websocket_manager

router = APIRouter()


@router.get("", response_model=List[ItineraryResponse])
def get_itineraries(
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.view")),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    destination: Optional[str] = None
):
    """Get all itineraries with optional filters"""
    query = db.query(Itinerary).filter(Itinerary.agency_id == agency_id)

    if status:
        query = query.filter(Itinerary.status == status)
    if destination:
        query = query.filter(Itinerary.destination.ilike(f"%{destination}%"))

    itineraries = query.offset(skip).limit(limit).all()
    return itineraries


@router.post("", response_model=ItineraryDetailResponse)
def create_itinerary(
    data: ItineraryCreate,
    current_user: User = Depends(require_permission("itineraries.create")),
    db: Session = Depends(get_db)
):
    """Create new itinerary from template or from scratch"""
    if data.template_id:
        # Create from template
        try:
            itinerary = template_service.create_itinerary_from_template(
                template_id=data.template_id,
                trip_name=data.trip_name,
                client_name=data.client_name,
                client_email=data.client_email,
                client_phone=data.client_phone,
                start_date=data.start_date,
                num_adults=data.num_adults,
                num_children=data.num_children,
                special_notes=data.special_notes,
                created_by=current_user.id,
                db=db,
                # Personalization settings
                personalization_enabled=data.personalization_enabled or False,
                personalization_policy=data.personalization_policy or "flexible",
                personalization_lock_policy=data.personalization_lock_policy or "respect_locks"
            )
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
    else:
        # Create from scratch
        itinerary = Itinerary(
            agency_id=current_user.agency_id,
            trip_name=data.trip_name,
            client_name=data.client_name,
            client_email=data.client_email,
            client_phone=data.client_phone,
            destination=data.destination,
            start_date=data.start_date,
            end_date=data.end_date,
            num_adults=data.num_adults,
            num_children=data.num_children,
            special_notes=data.special_notes,
            created_by=current_user.id,
            # Personalization settings
            personalization_enabled=1 if data.personalization_enabled else 0,
            personalization_policy=data.personalization_policy or "flexible",
            personalization_lock_policy=data.personalization_lock_policy or "respect_locks"
        )
        db.add(itinerary)
        db.flush()

        # Create days if provided
        for day_data in data.days:
            day = ItineraryDay(
                itinerary_id=itinerary.id,
                day_number=day_data.day_number,
                actual_date=day_data.actual_date,
                title=day_data.title,
                notes=day_data.notes
            )
            db.add(day)
            db.flush()

            # Create activities
            for activity_data in day_data.activities:
                activity = ItineraryDayActivity(
                    itinerary_day_id=day.id,
                    activity_id=activity_data.activity_id,
                    display_order=activity_data.display_order,
                    time_slot=activity_data.time_slot,
                    custom_notes=activity_data.custom_notes,
                    custom_price=activity_data.custom_price
                )
                db.add(activity)

        db.commit()
        db.refresh(itinerary)

    return _build_itinerary_detail_response(itinerary)


@router.get("/{itinerary_id}", response_model=ItineraryDetailResponse)
def get_itinerary(
    itinerary_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.view"))
):
    """Get itinerary by ID with full structure"""
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    return _build_itinerary_detail_response(itinerary)


@router.put("/{itinerary_id}", response_model=ItineraryDetailResponse)
def update_itinerary(
    itinerary_id: str,
    data: ItineraryUpdate,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.edit"))
):
    """Update itinerary"""
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    # Update basic fields
    update_data = data.model_dump(exclude_unset=True, exclude={'days'})
    for field, value in update_data.items():
        # Convert boolean to int for personalization_enabled (DB uses INTEGER)
        if field == 'personalization_enabled' and value is not None:
            value = 1 if value else 0
        setattr(itinerary, field, value)

    # Update days if provided
    if data.days is not None:
        # Delete existing days
        db.query(ItineraryDay).filter(ItineraryDay.itinerary_id == itinerary.id).delete()

        # Create new days
        for day_data in data.days:
            day = ItineraryDay(
                itinerary_id=itinerary.id,
                day_number=day_data.day_number,
                actual_date=day_data.actual_date,
                title=day_data.title,
                notes=day_data.notes
            )
            db.add(day)
            db.flush()

            # Create activities
            for activity_data in day_data.activities:
                activity = ItineraryDayActivity(
                    itinerary_day_id=day.id,
                    activity_id=activity_data.activity_id,
                    display_order=activity_data.display_order,
                    time_slot=activity_data.time_slot,
                    custom_notes=activity_data.custom_notes,
                    custom_price=activity_data.custom_price
                )
                db.add(activity)

    db.commit()
    db.refresh(itinerary)

    # Broadcast update via WebSocket if live updates enabled
    share_link = db.query(ShareLink).filter(
        ShareLink.itinerary_id == itinerary_id,
        ShareLink.is_active == True,
        ShareLink.live_updates_enabled == True
    ).first()

    if share_link:
        # Build update message
        public_payload = _build_public_itinerary_payload(itinerary, share_link)
        update_message = {
            "type": "itinerary_updated",
            "data": {
                "updated_at": datetime.utcnow().isoformat(),
                "itinerary": public_payload
            }
        }
        # Broadcast asynchronously (fire and forget)
        import asyncio
        try:
            asyncio.create_task(websocket_manager.broadcast(share_link.token, update_message))
        except:
            pass  # Don't fail if WebSocket broadcast fails

    return _build_itinerary_detail_response(itinerary)


@router.delete("/{itinerary_id}", response_model=MessageResponse)
def delete_itinerary(
    itinerary_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.delete"))
):
    """Delete itinerary"""
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    db.delete(itinerary)
    db.commit()
    return MessageResponse(message="Itinerary deleted successfully")


def _build_itinerary_detail_response(itinerary: Itinerary) -> ItineraryDetailResponse:
    """Helper to build detailed itinerary response"""
    days = []
    for day in itinerary.days:
        activities = [
            ItineraryDayActivityResponse.model_validate(activity)
            for activity in day.activities
        ]
        # Exclude 'activities' from day.__dict__ to avoid duplicate keyword argument
        day_dict = {k: v for k, v in day.__dict__.items() if k != 'activities' and not k.startswith('_')}
        days.append(ItineraryDayDetailResponse(
            **day_dict,
            activities=activities
        ))

    # Exclude 'days' from itinerary.__dict__ to avoid duplicate keyword argument
    itinerary_dict = {k: v for k, v in itinerary.__dict__.items() if k != 'days' and not k.startswith('_')}
    return ItineraryDetailResponse(
        **itinerary_dict,
        days=days
    )


def _build_public_itinerary_payload(itinerary: Itinerary, share_link: ShareLink):
    """Sanitized payload used for websocket broadcasts to public viewers"""
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
                "name": activity.name,
                "type": activity.activity_type.name if activity.activity_type else None,
                "location": activity.location_display,
                "short_description": activity.short_description,
                "highlights": activity.highlights,
                "images": [{
                    "url": f"/uploads/{img.file_path}",
                    "file_path": f"/uploads/{img.file_path}",
                    "is_hero": img.is_hero
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

    return {
        "id": itinerary.id,
        "trip_name": itinerary.trip_name,
        "client_name": itinerary.client_name,
        "destination": itinerary.destination,
        "start_date": itinerary.start_date.isoformat(),
        "end_date": itinerary.end_date.isoformat(),
        "num_adults": itinerary.num_adults,
        "num_children": itinerary.num_children,
        "status": itinerary.status.value if hasattr(itinerary.status, "value") else itinerary.status,
        "total_price": float(itinerary.total_price) if itinerary.total_price is not None else None,
        "days": days_data,
        "agency_name": itinerary.agency.name,
        "agency_contact_email": itinerary.agency.contact_email,
        "agency_contact_phone": itinerary.agency.contact_phone,
        "live_updates_enabled": share_link.live_updates_enabled,
        "share_link": {
            "id": share_link.id,
            "itinerary_id": share_link.itinerary_id,
            "token": share_link.token,
            "is_active": share_link.is_active,
            "live_updates_enabled": share_link.live_updates_enabled,
            "expires_at": share_link.expires_at.isoformat() if share_link.expires_at else None,
            "view_count": share_link.view_count,
            "last_viewed_at": share_link.last_viewed_at.isoformat() if share_link.last_viewed_at else None,
            "created_at": share_link.created_at.isoformat() if share_link.created_at else None,
        }
    }
