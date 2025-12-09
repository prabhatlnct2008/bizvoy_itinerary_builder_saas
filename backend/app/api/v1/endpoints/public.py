"""
Public API endpoints (no authentication required)
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
import json
import uuid

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
from app.schemas.gamification import (
    StartSessionRequest,
    SessionResponse,
    PersonalizationStatusResponse,
    DeckResponse,
    DeckCard,
    SwipeRequest,
    SwipeResponse,
    RevealResponse,
    FittedItem,
    MissedItem,
    ConfirmRequest,
    ConfirmResponse,
    SwapRequest,
    SwapResponse,
    AgencyVibeResponse,
)
from app.models.share import ShareLink
from app.models.itinerary import Itinerary, ItineraryDay, ItineraryDayActivity
from app.models.company_profile import CompanyProfile
from app.models.personalization_session import PersonalizationSession, SessionStatus
from app.models.itinerary_cart_item import ItineraryCartItem, FitStatus, CartItemStatus
from app.models.activity import Activity
from app.services.gamification.vibe_service import VibeService
from app.services.gamification.settings_service import SettingsService
from app.services.gamification.deck_builder import DeckBuilder
from app.services.gamification.interaction_recorder import InteractionRecorder
from app.utils.file_storage import file_storage
from decimal import Decimal

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
            # For library activities, check activity type and category
            if activity_item.activity:
                activity = activity_item.activity
                activity_type = activity.activity_type.name.lower() if activity.activity_type else ""
                category = (activity.category_label or "").lower()
                if type_keyword in activity_type or type_keyword in category:
                    count += 1
            # For ad-hoc items (LOGISTICS, NOTE), check item_type and custom_title
            elif activity_item.item_type:
                item_type = activity_item.item_type.lower()
                custom_title = (activity_item.custom_title or "").lower()
                if type_keyword in item_type or type_keyword in custom_title:
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
            total_activities += 1

            # Handle both library activities and ad-hoc items (LOGISTICS, NOTE)
            activity = activity_item.activity  # May be None for ad-hoc items
            item_type = getattr(activity_item, 'item_type', 'LIBRARY_ACTIVITY') or 'LIBRARY_ACTIVITY'

            if activity:
                # LIBRARY_ACTIVITY - has linked Activity record
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
                    item_type=item_type,
                    custom_title=activity_item.custom_title,
                    custom_payload=json.loads(activity_item.custom_payload) if activity_item.custom_payload and isinstance(activity_item.custom_payload, str) else activity_item.custom_payload,
                    custom_icon=activity_item.custom_icon,
                    display_order=activity_item.display_order,
                    time_slot=activity_item.time_slot,
                    custom_notes=activity_item.custom_notes,
                    custom_price=float(activity_item.custom_price) if activity_item.custom_price else None,
                    start_time=activity_item.start_time,
                    end_time=activity_item.end_time,
                    is_locked_by_agency=bool(activity_item.is_locked_by_agency),
                    source_cart_item_id=activity_item.source_cart_item_id,
                    added_by_personalization=bool(activity_item.added_by_personalization),
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
            else:
                # Ad-hoc item (LOGISTICS, NOTE) - no linked Activity record
                activities_data.append(PublicActivity(
                    id=activity_item.id,
                    itinerary_day_id=activity_item.itinerary_day_id,
                    activity_id=None,
                    item_type=item_type,
                    custom_title=activity_item.custom_title,
                    custom_payload=json.loads(activity_item.custom_payload) if activity_item.custom_payload and isinstance(activity_item.custom_payload, str) else activity_item.custom_payload,
                    custom_icon=activity_item.custom_icon,
                    display_order=activity_item.display_order,
                    time_slot=activity_item.time_slot,
                    custom_notes=activity_item.custom_notes,
                    custom_price=float(activity_item.custom_price) if activity_item.custom_price else None,
                    start_time=activity_item.start_time,
                    end_time=activity_item.end_time,
                    is_locked_by_agency=bool(activity_item.is_locked_by_agency),
                    source_cart_item_id=activity_item.source_cart_item_id,
                    added_by_personalization=bool(activity_item.added_by_personalization),
                    # Use custom_title as name for ad-hoc items
                    name=activity_item.custom_title or f"{item_type.title()} Item",
                    activity_type_name=item_type,
                    category_label=item_type.lower(),
                    location_display=None,
                    short_description=activity_item.custom_notes,
                    client_description=None,
                    default_duration_value=None,
                    default_duration_unit=None,
                    rating=None,
                    group_size_label=None,
                    cost_type="included",
                    cost_display=None,
                    highlights=[],
                    images=[]
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

    # Check if personalization is enabled for this itinerary
    settings = SettingsService.get_settings(db, itinerary.agency_id)
    personalization_enabled = bool(
        settings and settings.is_enabled and itinerary.personalization_enabled
    )
    personalization_completed = bool(itinerary.personalization_completed)

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
        share_link=share_link_response,
        personalization_enabled=personalization_enabled,
        personalization_completed=personalization_completed
    )


# ============================================================
# PUBLIC PERSONALIZATION ENDPOINTS
# ============================================================

def get_share_link_or_404(token: str, db: Session) -> tuple:
    """Helper to get share link and itinerary"""
    share_link = db.query(ShareLink).filter(
        ShareLink.token == token,
        ShareLink.is_active == True
    ).first()

    if not share_link:
        raise HTTPException(status_code=404, detail="Itinerary not found or link expired")

    if share_link.expires_at and share_link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link has expired")

    itinerary = db.query(Itinerary).filter(Itinerary.id == share_link.itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    return share_link, itinerary


@router.get("/itinerary/{token}/personalization/status", response_model=PersonalizationStatusResponse)
def get_personalization_status(
    token: str,
    db: Session = Depends(get_db)
):
    """Check if personalization is available for this itinerary"""
    share_link, itinerary = get_share_link_or_404(token, db)

    # Check if personalization is enabled for the agency
    settings = SettingsService.get_settings(db, itinerary.agency_id)
    is_enabled = settings and settings.is_enabled and itinerary.personalization_enabled

    # Check for active session
    active_session = None
    if is_enabled:
        active_session = db.query(PersonalizationSession).filter(
            PersonalizationSession.itinerary_id == itinerary.id,
            PersonalizationSession.status == SessionStatus.active
        ).first()

    # Get available vibes
    vibes = []
    if is_enabled:
        vibes = VibeService.get_enabled_vibes(db, itinerary.agency_id)
        # Auto-seed global vibes if an agency has none configured yet
        if not vibes:
            VibeService.seed_global_vibes(db, itinerary.agency_id)
            vibes = VibeService.get_enabled_vibes(db, itinerary.agency_id)

    # Normalize selected_vibes for active session if stored as JSON string
    if active_session and isinstance(active_session.selected_vibes, str):
        try:
            active_session.selected_vibes = json.loads(active_session.selected_vibes)
        except json.JSONDecodeError:
            active_session.selected_vibes = None

    return PersonalizationStatusResponse(
        enabled=is_enabled,
        has_active_session=active_session is not None,
        session=SessionResponse.model_validate(active_session) if active_session else None,
        available_vibes=[AgencyVibeResponse.model_validate(v) for v in vibes],
        policy=settings.personalization_policy.value if settings else "flexible"
    )


@router.post("/itinerary/{token}/personalization/start", response_model=SessionResponse)
def start_personalization_session(
    token: str,
    request: StartSessionRequest,
    db: Session = Depends(get_db),
    user_agent: Optional[str] = Header(None)
):
    """Start a new personalization session"""
    share_link, itinerary = get_share_link_or_404(token, db)

    # Check if personalization is enabled
    settings = SettingsService.get_settings(db, itinerary.agency_id)
    if not settings or not settings.is_enabled or not itinerary.personalization_enabled:
        raise HTTPException(status_code=403, detail="Personalization not enabled for this itinerary")

    # Check for existing active session
    existing = db.query(PersonalizationSession).filter(
        PersonalizationSession.itinerary_id == itinerary.id,
        PersonalizationSession.status == SessionStatus.active
    ).first()

    if existing:
        # Normalize selected_vibes if stored as JSON string
        if isinstance(existing.selected_vibes, str):
            try:
                existing.selected_vibes = json.loads(existing.selected_vibes)
            except json.JSONDecodeError:
                existing.selected_vibes = None
        return SessionResponse.model_validate(existing)

    # Create new session
    session = PersonalizationSession(
        id=str(uuid.uuid4()),
        itinerary_id=itinerary.id,
        share_link_id=share_link.id,
        device_id=request.device_id,
        selected_vibes=request.selected_vibes or None,
        deck_size=settings.default_deck_size,
        user_agent=user_agent,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return SessionResponse.model_validate(session)


@router.get("/itinerary/{token}/personalization/deck", response_model=DeckResponse)
def get_personalization_deck(
    token: str,
    db: Session = Depends(get_db)
):
    """Get the personalized deck of activities"""
    share_link, itinerary = get_share_link_or_404(token, db)

    # Get active session
    session = db.query(PersonalizationSession).filter(
        PersonalizationSession.itinerary_id == itinerary.id,
        PersonalizationSession.status == SessionStatus.active
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="No active personalization session")

    # Get settings
    settings = SettingsService.get_settings(db, itinerary.agency_id)
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")

    # Build deck
    deck_builder = DeckBuilder(db)
    activities = deck_builder.build_deck(session, settings)

    # Convert to cards
    cards = []
    for idx, activity in enumerate(activities):
        hero_image_url = None
        if activity.images:
            hero_img = next((img for img in activity.images if img.is_hero), activity.images[0])
            hero_image_url = file_storage.get_file_url(hero_img.file_path)

        highlights = parse_highlights(activity.highlights)
        vibe_tags = parse_highlights(activity.vibe_tags)

        cards.append(DeckCard(
            activity_id=activity.id,
            name=activity.name,
            category_label=activity.category_label,
            location_display=activity.location_display,
            short_description=activity.short_description,
            client_description=activity.client_description,
            price_display=activity.cost_display,
            price_numeric=activity.price_numeric,
            currency_code=activity.currency_code,
            rating=activity.review_rating or activity.rating,
            review_count=activity.review_count or 0,
            marketing_badge=activity.marketing_badge,
            vibe_tags=vibe_tags,
            optimal_time_of_day=activity.optimal_time_of_day,
            hero_image_url=hero_image_url,
            highlights=highlights,
            gamification_readiness_score=activity.gamification_readiness_score or Decimal("0"),
            card_position=idx
        ))

    cards_remaining = len(cards) - session.cards_viewed

    return DeckResponse(
        session_id=session.id,
        cards=cards,
        total_cards=len(cards),
        cards_remaining=max(0, cards_remaining)
    )


@router.post("/itinerary/{token}/personalization/swipe", response_model=SwipeResponse)
def swipe_activity(
    token: str,
    swipe_request: SwipeRequest,
    db: Session = Depends(get_db)
):
    """Record a swipe action"""
    share_link, itinerary = get_share_link_or_404(token, db)

    # Get active session
    session = db.query(PersonalizationSession).filter(
        PersonalizationSession.itinerary_id == itinerary.id,
        PersonalizationSession.status == SessionStatus.active
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="No active personalization session")

    # Record the interaction
    recorder = InteractionRecorder(db)
    recorder.record_swipe(session, swipe_request)

    # Get updated stats
    cards_remaining = session.deck_size - session.cards_viewed

    return SwipeResponse(
        success=True,
        message=f"Swipe recorded: {swipe_request.action}",
        cards_remaining=max(0, cards_remaining),
        cards_liked=session.cards_liked
    )


@router.post("/itinerary/{token}/personalization/complete", response_model=RevealResponse)
def complete_personalization(
    token: str,
    db: Session = Depends(get_db)
):
    """Complete personalization and reveal fitted/missed activities"""
    share_link, itinerary = get_share_link_or_404(token, db)

    # Get active session
    session = db.query(PersonalizationSession).filter(
        PersonalizationSession.itinerary_id == itinerary.id,
        PersonalizationSession.status == SessionStatus.active
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="No active personalization session")

    # Get cart items
    cart_items = db.query(ItineraryCartItem).filter(
        ItineraryCartItem.session_id == session.id
    ).all()

    # Simple fitting logic: try to fit activities into available days
    days = db.query(ItineraryDay).filter(
        ItineraryDay.itinerary_id == itinerary.id
    ).order_by(ItineraryDay.day_number).all()

    fitted = []
    missed = []

    for cart_item in cart_items:
        # Simple logic: fit into first available day
        # In a real implementation, this would use more sophisticated scheduling
        if days:
            target_day = days[0]  # Simple: just use first day
            cart_item.day_id = target_day.id
            cart_item.fit_status = FitStatus.fit
            cart_item.fit_reason = "Fits into available schedule"
            cart_item.status = CartItemStatus.fitted

            activity = db.query(Activity).filter(Activity.id == cart_item.activity_id).first()
            fitted.append(FittedItem(
                cart_item_id=cart_item.id,
                activity_id=cart_item.activity_id,
                activity_name=activity.name if activity else "Unknown",
                day_number=target_day.day_number,
                day_date=target_day.actual_date.isoformat(),
                time_slot=cart_item.time_slot.value if cart_item.time_slot else None,
                fit_reason=cart_item.fit_reason,
                quoted_price=cart_item.quoted_price,
                currency_code=cart_item.currency_code
            ))
        else:
            cart_item.fit_status = FitStatus.miss
            cart_item.miss_reason = "No available days in itinerary"
            cart_item.status = CartItemStatus.missed

            activity = db.query(Activity).filter(Activity.id == cart_item.activity_id).first()
            missed.append(MissedItem(
                cart_item_id=cart_item.id,
                activity_id=cart_item.activity_id,
                activity_name=activity.name if activity else "Unknown",
                miss_reason=cart_item.miss_reason,
                swap_suggestion_activity_id=None,
                swap_suggestion_name=None
            ))

    # Mark session as completed
    recorder = InteractionRecorder(db)
    recorder.complete_session(session)

    db.commit()

    return RevealResponse(
        session_id=session.id,
        fitted_items=fitted,
        missed_items=missed,
        total_liked=session.cards_liked,
        total_fitted=len(fitted),
        total_missed=len(missed),
        message=f"Personalization complete! {len(fitted)} activities fitted."
    )


@router.post("/itinerary/{token}/personalization/confirm", response_model=ConfirmResponse)
def confirm_personalization(
    token: str,
    confirm_request: ConfirmRequest,
    db: Session = Depends(get_db)
):
    """Confirm selected activities and add them to the itinerary"""
    share_link, itinerary = get_share_link_or_404(token, db)

    # Get cart items
    cart_items = db.query(ItineraryCartItem).filter(
        ItineraryCartItem.id.in_(confirm_request.cart_item_ids),
        ItineraryCartItem.itinerary_id == itinerary.id
    ).all()

    if not cart_items:
        raise HTTPException(status_code=404, detail="No cart items found")

    added_count = 0
    for cart_item in cart_items:
        if cart_item.day_id and cart_item.fit_status == FitStatus.fit:
            # Get next display order
            existing_activities = db.query(ItineraryDayActivity).filter(
                ItineraryDayActivity.itinerary_day_id == cart_item.day_id
            ).count()

            # Add to itinerary
            itinerary_activity = ItineraryDayActivity(
                id=str(uuid.uuid4()),
                itinerary_day_id=cart_item.day_id,
                activity_id=cart_item.activity_id,
                display_order=existing_activities,
                source_cart_item_id=cart_item.id,
                added_by_personalization=1
            )
            db.add(itinerary_activity)

            # Update cart item status
            cart_item.status = CartItemStatus.confirmed
            added_count += 1

    db.commit()

    return ConfirmResponse(
        success=True,
        message=f"Successfully added {added_count} activities to itinerary",
        added_count=added_count,
        itinerary_id=itinerary.id
    )


@router.post("/itinerary/{token}/personalization/swap", response_model=SwapResponse)
def swap_activity(
    token: str,
    swap_request: SwapRequest,
    db: Session = Depends(get_db)
):
    """Swap a cart item with a different activity"""
    share_link, itinerary = get_share_link_or_404(token, db)

    # Get cart item
    cart_item = db.query(ItineraryCartItem).filter(
        ItineraryCartItem.id == swap_request.cart_item_id,
        ItineraryCartItem.itinerary_id == itinerary.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    # Update cart item
    old_activity_id = cart_item.activity_id
    cart_item.activity_id = swap_request.new_activity_id
    cart_item.fit_status = FitStatus.pending
    cart_item.fit_reason = "Swapped by user"

    db.commit()
    db.refresh(cart_item)

    return SwapResponse(
        success=True,
        message=f"Activity swapped successfully",
        new_cart_item_id=cart_item.id,
        fit_status=cart_item.fit_status.value,
        fit_reason=cart_item.fit_reason
    )


@router.get("/itinerary/{token}/personalization/resume", response_model=SessionResponse)
def resume_personalization(
    token: str,
    db: Session = Depends(get_db)
):
    """Resume an existing personalization session"""
    share_link, itinerary = get_share_link_or_404(token, db)

    # Get most recent session (active or completed)
    session = db.query(PersonalizationSession).filter(
        PersonalizationSession.itinerary_id == itinerary.id
    ).order_by(PersonalizationSession.started_at.desc()).first()

    if not session:
        raise HTTPException(status_code=404, detail="No personalization session found")

    return SessionResponse.model_validate(session)
