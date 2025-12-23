from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from decimal import Decimal
from app.core.deps import get_db, get_current_user, get_current_agency_id, require_permission
from app.schemas.itinerary import (
    ItineraryCreate,
    ItineraryUpdate,
    ItineraryResponse,
    ItineraryDetailResponse,
    ItineraryDayDetailResponse,
    ItineraryDayActivityResponse
)
from app.schemas.itinerary_pricing import (
    ItineraryPricingUpdate,
    ItineraryPricingWithPayments,
    ItineraryPaymentCreate,
    ItineraryPaymentUpdate,
    ItineraryPaymentResponse,
    PaymentSummary,
)
from app.schemas.auth import MessageResponse
from app.models.itinerary import Itinerary, ItineraryDay, ItineraryDayActivity
from app.models.itinerary_payment import ItineraryPayment
from app.models.share import ShareLink
from app.models.user import User
from app.services.template_service import template_service
from app.services.websocket_service import websocket_manager
from app.services.gamification.settings_service import SettingsService

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
    # Determine personalization_enabled:
    # - If explicitly set (True/False), use that value
    # - If None (not provided), auto-enable if agency has personalization enabled
    personalization_enabled = data.personalization_enabled
    if personalization_enabled is None:
        # Check agency settings to determine default
        settings = SettingsService.get_settings(db, current_user.agency_id)
        personalization_enabled = bool(settings and settings.is_enabled)

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
                personalization_enabled=personalization_enabled,
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
            # Personalization settings (use auto-detected value)
            personalization_enabled=1 if personalization_enabled else 0,
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

            # Create activities (supports LIBRARY_ACTIVITY, LOGISTICS, NOTE)
            for activity_data in day_data.activities:
                activity = ItineraryDayActivity(
                    itinerary_day_id=day.id,
                    activity_id=activity_data.activity_id,  # Can be None for LOGISTICS/NOTE
                    item_type=activity_data.item_type or "LIBRARY_ACTIVITY",
                    custom_title=activity_data.custom_title,
                    custom_payload=activity_data.custom_payload,
                    custom_icon=activity_data.custom_icon,
                    display_order=activity_data.display_order,
                    time_slot=activity_data.time_slot,
                    custom_notes=activity_data.custom_notes,
                    custom_price=activity_data.custom_price,
                    price_amount=activity_data.price_amount,
                    price_currency=activity_data.price_currency,
                    pricing_unit=activity_data.pricing_unit,
                    quantity=activity_data.quantity,
                    item_discount_amount=activity_data.item_discount_amount,
                    start_time=activity_data.start_time,
                    end_time=activity_data.end_time,
                    is_locked_by_agency=1 if activity_data.is_locked_by_agency else 0
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
        if field == 'currency':
            continue  # handled via pricing block below
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

            # Create activities (supports LIBRARY_ACTIVITY, LOGISTICS, NOTE)
            for activity_data in day_data.activities:
                activity = ItineraryDayActivity(
                    itinerary_day_id=day.id,
                    activity_id=activity_data.activity_id,  # Can be None for LOGISTICS/NOTE
                    item_type=activity_data.item_type or "LIBRARY_ACTIVITY",
                    custom_title=activity_data.custom_title,
                    custom_payload=activity_data.custom_payload,
                    custom_icon=activity_data.custom_icon,
                    display_order=activity_data.display_order,
                    time_slot=activity_data.time_slot,
                    custom_notes=activity_data.custom_notes,
                    custom_price=activity_data.custom_price,
                    price_amount=activity_data.price_amount,
                    price_currency=activity_data.price_currency,
                    pricing_unit=activity_data.pricing_unit,
                    quantity=activity_data.quantity,
                    item_discount_amount=activity_data.item_discount_amount,
                    start_time=activity_data.start_time,
                    end_time=activity_data.end_time,
                    is_locked_by_agency=1 if activity_data.is_locked_by_agency else 0
                )
                db.add(activity)

    db.commit()
    db.refresh(itinerary)

    # Handle itinerary-level currency on pricing
    if data.currency:
        if not itinerary.pricing:
            from app.models.itinerary_pricing import ItineraryPricing
            itinerary.pricing = ItineraryPricing(
                itinerary_id=itinerary.id,
                currency=data.currency,
            )
        else:
            itinerary.pricing.currency = data.currency
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
    # Attach currency from pricing or agency default
    if itinerary.pricing and itinerary.pricing.currency:
        itinerary_dict['currency'] = itinerary.pricing.currency
    elif getattr(itinerary.agency, "default_currency", None):
        itinerary_dict['currency'] = itinerary.agency.default_currency
    else:
        itinerary_dict['currency'] = "USD"
    return ItineraryDetailResponse(
        **itinerary_dict,
        days=days
    )


def _compute_pricing_snapshot(itinerary) -> dict:
    """
    Build a simple pricing snapshot from itinerary items for public payloads.
    """
    subtotal = 0.0
    currency = None
    for day in itinerary.days:
        for item in day.activities:
            amount = None
            if item.price_amount is not None:
                amount = float(item.price_amount)
            elif item.custom_price is not None:
                amount = float(item.custom_price)
            elif getattr(item, "activity", None) and getattr(item.activity, "price_numeric", None) is not None:
                amount = float(item.activity.price_numeric)

            qty = item.quantity if item.quantity is not None else 1
            discount = float(item.item_discount_amount or 0)

            if amount is not None:
                subtotal += max(amount * qty - discount, 0)
                if not currency:
                    currency = item.price_currency or getattr(item.activity, "currency_code", None)

    currency = (
        (getattr(itinerary, "pricing", None).currency if getattr(itinerary, "pricing", None) and getattr(itinerary.pricing, "currency", None) else None)
        or currency
        or getattr(itinerary, "price_currency", None)
        or getattr(itinerary.agency, "default_currency", None)
        or "USD"
    )
    taxes = float(itinerary.pricing.taxes_fees) if getattr(itinerary, "pricing", None) and itinerary.pricing.taxes_fees else 0.0
    discount_total = float(itinerary.pricing.discount_amount) if getattr(itinerary, "pricing", None) and itinerary.pricing.discount_amount else 0.0
    base_package = float(itinerary.pricing.base_package) if getattr(itinerary, "pricing", None) and itinerary.pricing.base_package is not None else subtotal
    # If discount amount is missing but percent exists, derive a discount value
    if discount_total == 0.0 and getattr(itinerary, "pricing", None) and getattr(itinerary.pricing, "discount_percent", None):
        discount_total = (base_package + taxes) * (float(itinerary.pricing.discount_percent) / 100.0)

    total = (base_package if base_package is not None else 0) + taxes - discount_total

    return {
        "base_package": base_package,
        "taxes_fees": taxes if taxes else None,
        "discount_code": itinerary.pricing.discount_code if getattr(itinerary, "pricing", None) else None,
        "discount_amount": discount_total if discount_total else None,
        "total": total,
        "currency": currency,
    }


def _compute_pricing_totals(itinerary) -> dict:
    """
    Determine effective pricing values using stored pricing fields with sensible fallbacks
    from itinerary items. Returns numeric values for total, base_package, taxes, discount_amount,
    and currency.
    """
    snapshot = _compute_pricing_snapshot(itinerary)
    pricing = getattr(itinerary, "pricing", None)

    base_from_pricing = float(pricing.base_package) if pricing and pricing.base_package is not None else None
    taxes_from_pricing = float(pricing.taxes_fees) if pricing and pricing.taxes_fees is not None else None
    discount_amount_pricing = float(pricing.discount_amount) if pricing and pricing.discount_amount is not None else None
    discount_percent_pricing = float(pricing.discount_percent) if pricing and pricing.discount_percent is not None else None

    base_package = base_from_pricing if base_from_pricing is not None else (snapshot.get("base_package") or 0.0)
    taxes = taxes_from_pricing if taxes_from_pricing is not None else (snapshot.get("taxes_fees") or 0.0)

    if discount_amount_pricing is not None:
        discount_amount = discount_amount_pricing
    elif discount_percent_pricing is not None:
        discount_amount = (base_package + taxes) * (discount_percent_pricing / 100.0)
    else:
        discount_amount = snapshot.get("discount_amount") or 0.0

    total = max(base_package + taxes - discount_amount, 0.0)
    currency = snapshot.get("currency") or (pricing.currency if pricing else "USD")

    return {
        "base_package": base_package,
        "taxes_fees": taxes,
        "discount_amount": discount_amount if discount_amount else None,
        "total": total,
        "currency": currency,
    }


def _build_public_itinerary_payload(itinerary: Itinerary, share_link: ShareLink):
    """Sanitized payload used for websocket broadcasts to public viewers"""
    days_data = []
    for day in itinerary.days:
        activities_data = []
        for activity_item in day.activities:
            activity = activity_item.activity  # May be None for LOGISTICS/NOTE
            item_type = getattr(activity_item, 'item_type', 'LIBRARY_ACTIVITY') or 'LIBRARY_ACTIVITY'

            if activity:
                # LIBRARY_ACTIVITY - has linked Activity record
                activities_data.append({
                    "id": activity_item.id,
                    "itinerary_day_id": activity_item.itinerary_day_id,
                    "activity_id": activity_item.activity_id,
                    "item_type": item_type,
                    "custom_title": activity_item.custom_title,
                    "custom_icon": activity_item.custom_icon,
                    "display_order": activity_item.display_order,
                    "time_slot": activity_item.time_slot,
                    "start_time": activity_item.start_time,
                    "end_time": activity_item.end_time,
                    "custom_notes": activity_item.custom_notes,
                    "custom_price": float(activity_item.custom_price) if activity_item.custom_price is not None else None,
                    "price_amount": float(activity_item.price_amount) if activity_item.price_amount is not None else None,
                    "price_currency": activity_item.price_currency,
                    "pricing_unit": activity_item.pricing_unit,
                    "quantity": activity_item.quantity,
                    "item_discount_amount": float(activity_item.item_discount_amount) if activity_item.item_discount_amount is not None else None,
                    "is_locked_by_agency": bool(activity_item.is_locked_by_agency),
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
            else:
                # LOGISTICS/NOTE - ad-hoc item without Activity record
                activities_data.append({
                    "id": activity_item.id,
                    "itinerary_day_id": activity_item.itinerary_day_id,
                    "activity_id": None,
                    "item_type": item_type,
                    "custom_title": activity_item.custom_title,
                    "custom_icon": activity_item.custom_icon,
                    "display_order": activity_item.display_order,
                    "time_slot": activity_item.time_slot,
                    "start_time": activity_item.start_time,
                    "end_time": activity_item.end_time,
                    "custom_notes": activity_item.custom_notes,
                    "custom_price": float(activity_item.custom_price) if activity_item.custom_price is not None else None,
                    "price_amount": float(activity_item.price_amount) if activity_item.price_amount is not None else None,
                    "price_currency": activity_item.price_currency,
                    "pricing_unit": activity_item.pricing_unit,
                    "quantity": activity_item.quantity,
                    "item_discount_amount": float(activity_item.item_discount_amount) if activity_item.item_discount_amount is not None else None,
                    "is_locked_by_agency": bool(activity_item.is_locked_by_agency),
                    "name": activity_item.custom_title or f"{item_type.title()} Item",
                    "type": item_type,
                    "location": None,
                    "short_description": activity_item.custom_notes,
                    "highlights": None,
                    "images": []
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

    pricing_snapshot = _compute_pricing_snapshot(itinerary)
    itinerary.total_price = pricing_snapshot.get("total")

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
        "pricing": pricing_snapshot,
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


# ============================================================
# PAYMENT SCHEDULE AND PAYMENT TRACKING ENDPOINTS
# ============================================================


def _compute_payment_summary(itinerary: Itinerary) -> dict:
    """Compute payment summary including total paid, balance due, advance status"""
    pricing = itinerary.pricing
    payments = itinerary.payments or []

    totals = _compute_pricing_totals(itinerary)
    total_amount = Decimal(str(totals.get("total") or 0))

    total_paid = sum(Decimal(str(p.amount)) for p in payments)
    balance_due = max(Decimal("0.00"), total_amount - total_paid)

    # Check advance payment status
    advance_required = None
    advance_paid = False

    if pricing and pricing.advance_enabled:
        if pricing.advance_type == "fixed" and pricing.advance_amount:
            advance_required = Decimal(str(pricing.advance_amount))
        elif pricing.advance_type == "percent" and pricing.advance_percent:
            advance_required = total_amount * (Decimal(str(pricing.advance_percent)) / Decimal("100"))

        if advance_required:
            # Check if advance payments cover the required amount
            advance_payments = sum(
                Decimal(str(p.amount)) for p in payments if p.payment_type == "advance"
            )
            advance_paid = advance_payments >= advance_required

    return {
        "total_amount": total_amount,
        "total_paid": total_paid,
        "balance_due": balance_due,
        "currency": totals.get("currency") or (pricing.currency if pricing else "USD"),
        "advance_required": advance_required,
        "advance_paid": advance_paid,
        "advance_deadline": pricing.advance_deadline if pricing else None,
        "final_deadline": pricing.final_deadline if pricing else None,
    }


@router.get("/{itinerary_id}/pricing", response_model=ItineraryPricingWithPayments)
def get_itinerary_pricing_with_payments(
    itinerary_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.view"))
):
    """Get itinerary pricing with all payments and summary"""
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    if not itinerary.pricing:
        # Create empty pricing record
        from app.models.itinerary_pricing import ItineraryPricing
        itinerary.pricing = ItineraryPricing(itinerary_id=itinerary.id)
        db.add(itinerary.pricing)
        db.commit()
        db.refresh(itinerary)

    totals = _compute_pricing_totals(itinerary)
    summary = _compute_payment_summary(itinerary)

    # Build response
    response_data = {
        **itinerary.pricing.__dict__,
        "total": itinerary.pricing.total if itinerary.pricing.total is not None else totals.get("total"),
        "base_package": itinerary.pricing.base_package if itinerary.pricing.base_package is not None else totals.get("base_package"),
        "taxes_fees": itinerary.pricing.taxes_fees if itinerary.pricing.taxes_fees is not None else totals.get("taxes_fees"),
        "discount_amount": itinerary.pricing.discount_amount if itinerary.pricing.discount_amount is not None else totals.get("discount_amount"),
        "currency": itinerary.pricing.currency or totals.get("currency"),
        "payments": itinerary.payments or [],
        "total_paid": summary["total_paid"],
        "balance_due": summary["balance_due"],
        "advance_required": summary["advance_required"],
        "advance_paid": summary["advance_paid"],
    }
    # Remove SQLAlchemy internal state
    response_data = {k: v for k, v in response_data.items() if not k.startswith("_")}

    return ItineraryPricingWithPayments(**response_data)


@router.put("/{itinerary_id}/pricing", response_model=ItineraryPricingWithPayments)
def update_itinerary_pricing(
    itinerary_id: str,
    data: ItineraryPricingUpdate,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.edit"))
):
    """Update itinerary pricing and payment schedule"""
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    if not itinerary.pricing:
        from app.models.itinerary_pricing import ItineraryPricing
        itinerary.pricing = ItineraryPricing(itinerary_id=itinerary.id)
        db.add(itinerary.pricing)
        db.flush()

    # Update pricing fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "advance_enabled" and value is not None:
            value = 1 if value else 0
        setattr(itinerary.pricing, field, value)

    totals = _compute_pricing_totals(itinerary)
    if itinerary.pricing.base_package is None and totals.get("base_package") is not None:
        itinerary.pricing.base_package = Decimal(str(totals["base_package"]))
    if itinerary.pricing.taxes_fees is None and totals.get("taxes_fees") is not None:
        itinerary.pricing.taxes_fees = Decimal(str(totals["taxes_fees"]))
    if itinerary.pricing.discount_amount is None and totals.get("discount_amount") is not None:
        itinerary.pricing.discount_amount = Decimal(str(totals["discount_amount"]))
    if totals.get("total") is not None:
        itinerary.pricing.total = Decimal(str(totals["total"]))

    db.commit()
    db.refresh(itinerary)

    # Recompute summary after persisting totals
    totals = _compute_pricing_totals(itinerary)
    summary = _compute_payment_summary(itinerary)

    response_data = {
        **itinerary.pricing.__dict__,
        "total": itinerary.pricing.total if itinerary.pricing.total is not None else totals.get("total"),
        "base_package": itinerary.pricing.base_package if itinerary.pricing.base_package is not None else totals.get("base_package"),
        "taxes_fees": itinerary.pricing.taxes_fees if itinerary.pricing.taxes_fees is not None else totals.get("taxes_fees"),
        "discount_amount": itinerary.pricing.discount_amount if itinerary.pricing.discount_amount is not None else totals.get("discount_amount"),
        "currency": itinerary.pricing.currency or totals.get("currency"),
        "payments": itinerary.payments or [],
        "total_paid": summary["total_paid"],
        "balance_due": summary["balance_due"],
        "advance_required": summary["advance_required"],
        "advance_paid": summary["advance_paid"],
    }
    response_data = {k: v for k, v in response_data.items() if not k.startswith("_")}

    return ItineraryPricingWithPayments(**response_data)


@router.get("/{itinerary_id}/payments", response_model=List[ItineraryPaymentResponse])
def get_itinerary_payments(
    itinerary_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.view"))
):
    """Get all payment records for an itinerary"""
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    return itinerary.payments or []


@router.post("/{itinerary_id}/payments", response_model=ItineraryPaymentResponse)
def create_payment(
    itinerary_id: str,
    data: ItineraryPaymentCreate,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.edit"))
):
    """Record a new payment for an itinerary"""
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    payment = ItineraryPayment(
        itinerary_id=itinerary.id,
        payment_type=data.payment_type,
        amount=data.amount,
        currency=data.currency,
        payment_method=data.payment_method,
        reference_number=data.reference_number,
        paid_at=data.paid_at,
        notes=data.notes,
        confirmed_by=current_user.id,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment


@router.put("/{itinerary_id}/payments/{payment_id}", response_model=ItineraryPaymentResponse)
def update_payment(
    itinerary_id: str,
    payment_id: str,
    data: ItineraryPaymentUpdate,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.edit"))
):
    """Update a payment record"""
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    payment = db.query(ItineraryPayment).filter(
        ItineraryPayment.id == payment_id,
        ItineraryPayment.itinerary_id == itinerary_id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(payment, field, value)

    db.commit()
    db.refresh(payment)

    return payment


@router.delete("/{itinerary_id}/payments/{payment_id}", response_model=MessageResponse)
def delete_payment(
    itinerary_id: str,
    payment_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.edit"))
):
    """Delete a payment record"""
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    payment = db.query(ItineraryPayment).filter(
        ItineraryPayment.id == payment_id,
        ItineraryPayment.itinerary_id == itinerary_id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    db.delete(payment)
    db.commit()

    return MessageResponse(message="Payment deleted successfully")


@router.get("/{itinerary_id}/payment-summary", response_model=PaymentSummary)
def get_payment_summary(
    itinerary_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.view"))
):
    """Get payment summary for an itinerary"""
    from app.schemas.itinerary_pricing import ItineraryPaymentPublic

    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    summary = _compute_payment_summary(itinerary)
    payments = [
        ItineraryPaymentPublic(
            id=p.id,
            payment_type=p.payment_type,
            amount=p.amount,
            currency=p.currency,
            paid_at=p.paid_at,
        )
        for p in (itinerary.payments or [])
    ]

    return PaymentSummary(
        **summary,
        payments=payments,
    )
