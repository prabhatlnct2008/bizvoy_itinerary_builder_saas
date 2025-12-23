"""
Gamification API endpoints for agencies
Phase 1: Personalized Discovery Engine
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.activity import Activity
from app.schemas.gamification import (
    AgencyVibeCreate,
    AgencyVibeUpdate,
    AgencyVibeResponse,
    AgencyPersonalizationSettingsUpdate,
    AgencyPersonalizationSettingsResponse,
    ActivityGamificationUpdate,
    GamificationValidationResponse,
    GamificationStatusOverview,
    AgencyPersonalizationAnalytics,
)
from app.services.gamification.vibe_service import VibeService
from app.services.gamification.settings_service import SettingsService
from app.services.gamification.readiness_calculator import ReadinessCalculator
from decimal import Decimal
import json
from sqlalchemy import func, case
from app.models.personalization_session import PersonalizationSession, SessionStatus
from app.models.user_deck_interaction import UserDeckInteraction, InteractionAction
from app.models.itinerary_cart_item import ItineraryCartItem, CartItemStatus
from app.models.itinerary import Itinerary

router = APIRouter()


# ============================================================
# PERSONALIZATION SETTINGS ENDPOINTS
# ============================================================

@router.get("/agency/personalization/settings", response_model=AgencyPersonalizationSettingsResponse)
def get_agency_personalization_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get agency personalization settings"""
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an agency"
        )

    settings = SettingsService.get_settings(db, current_user.agency_id)

    if not settings:
        # Create default settings
        settings = SettingsService.create_default_settings(db, current_user.agency_id)

    return settings


@router.put("/agency/personalization/settings", response_model=AgencyPersonalizationSettingsResponse)
def update_agency_personalization_settings(
    settings_data: AgencyPersonalizationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update agency personalization settings"""
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an agency"
        )

    settings = SettingsService.update_settings(db, current_user.agency_id, settings_data)
    return settings


# ============================================================
# VIBE MANAGEMENT ENDPOINTS
# ============================================================

@router.get("/agency/personalization/vibes", response_model=List[AgencyVibeResponse])
def get_agency_vibes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all vibes for the agency"""
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an agency"
        )

    vibes = VibeService.get_agency_vibes(db, current_user.agency_id)

    # If no vibes, seed them
    if not vibes:
        VibeService.seed_global_vibes(db, current_user.agency_id)
        vibes = VibeService.get_agency_vibes(db, current_user.agency_id)

    return vibes


@router.post("/agency/personalization/vibes", response_model=AgencyVibeResponse)
def create_agency_vibe(
    vibe_data: AgencyVibeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new custom vibe"""
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an agency"
        )

    try:
        vibe = VibeService.create_vibe(db, current_user.agency_id, vibe_data)
        return vibe
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating vibe: {str(e)}"
        )


@router.put("/agency/personalization/vibes/{vibe_id}", response_model=AgencyVibeResponse)
def update_agency_vibe(
    vibe_id: str,
    vibe_data: AgencyVibeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing vibe"""
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an agency"
        )

    vibe = VibeService.update_vibe(db, vibe_id, vibe_data)

    if not vibe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vibe not found"
        )

    # Verify ownership
    if vibe.agency_id != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this vibe"
        )

    return vibe


@router.delete("/agency/personalization/vibes/{vibe_id}")
def delete_agency_vibe(
    vibe_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a custom vibe (cannot delete global vibes)"""
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an agency"
        )

    success = VibeService.delete_vibe(db, vibe_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vibe not found or cannot delete global vibes"
        )

    return {"message": "Vibe deleted successfully"}


@router.post("/agency/personalization/vibes/reorder")
def reorder_vibes(
    vibe_order: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reorder vibes by providing ordered list of vibe IDs"""
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an agency"
        )

    VibeService.reorder_vibes(db, current_user.agency_id, vibe_order)
    return {"message": "Vibes reordered successfully"}


# ============================================================
# ACTIVITY GAMIFICATION ENDPOINTS
# ============================================================


@router.get("/agency/analytics", response_model=AgencyPersonalizationAnalytics)
def get_agency_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return personalization analytics scoped to the current agency.
    This powers the /analytics/personalization page on the frontend.
    """
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an agency"
        )

    # Base session query scoped to agency's itineraries
    session_q = (
        db.query(PersonalizationSession)
        .join(Itinerary, Itinerary.id == PersonalizationSession.itinerary_id)
        .filter(Itinerary.agency_id == current_user.agency_id)
    )

    total_sessions = session_q.count()
    completed_sessions = session_q.filter(PersonalizationSession.status == SessionStatus.completed).count()
    completion_rate = Decimal(0)
    if total_sessions > 0:
        completion_rate = (Decimal(completed_sessions) / Decimal(total_sessions)) * Decimal(100)

    # Confirmation = confirmed cart items out of total cart items for agency itineraries
    cart_q = (
        db.query(ItineraryCartItem)
        .join(Itinerary, Itinerary.id == ItineraryCartItem.itinerary_id)
        .filter(Itinerary.agency_id == current_user.agency_id)
    )
    total_cart_items = cart_q.count()
    confirmed_cart_items = cart_q.filter(ItineraryCartItem.status == CartItemStatus.CONFIRMED).count()
    confirmation_rate = Decimal(0)
    if total_cart_items > 0:
        confirmation_rate = (Decimal(confirmed_cart_items) / Decimal(total_cart_items)) * Decimal(100)

    # Revenue added = sum of confirmed cart item quoted_price (fallback 0)
    revenue_sum = (
        db.query(func.coalesce(func.sum(ItineraryCartItem.quoted_price), 0))
        .select_from(ItineraryCartItem)
        .join(Itinerary, Itinerary.id == ItineraryCartItem.itinerary_id)
        .filter(
            Itinerary.agency_id == current_user.agency_id,
            ItineraryCartItem.status == CartItemStatus.CONFIRMED,
        )
        .scalar()
    ) or 0
    total_revenue_added = Decimal(str(revenue_sum or 0))

    # Sessions over time (last 30 days by start date)
    sessions_over_time = []
    rows = (
        db.query(
            func.date(PersonalizationSession.started_at).label("day"),
            func.count(PersonalizationSession.id),
        )
        .join(Itinerary, Itinerary.id == PersonalizationSession.itinerary_id)
        .filter(Itinerary.agency_id == current_user.agency_id)
        .group_by("day")
        .order_by("day")
        .limit(60)
        .all()
    )
    for day, count in rows:
        sessions_over_time.append({"date": str(day), "count": count})

    # Top performing activities (likes/pass counts)
    activity_stats = (
        db.query(
            UserDeckInteraction.activity_id,
            func.sum(case((UserDeckInteraction.action == InteractionAction.like, 1), else_=0)).label("like_count"),
            func.sum(case((UserDeckInteraction.action == InteractionAction.pass_, 1), else_=0)).label("pass_count"),
        )
        .join(Itinerary, Itinerary.id == UserDeckInteraction.itinerary_id)
        .filter(Itinerary.agency_id == current_user.agency_id)
        .group_by(UserDeckInteraction.activity_id)
        .order_by(func.sum(case((UserDeckInteraction.action == InteractionAction.like, 1), else_=0)).desc())
        .limit(10)
        .all()
    )

    top_performing_activities = []
    if activity_stats:
        activity_ids = [row.activity_id for row in activity_stats]
        activities = {
            a.id: a.name
            for a in db.query(Activity.id, Activity.name)
            .filter(Activity.id.in_(activity_ids))
            .all()
        }
        for row in activity_stats:
            top_performing_activities.append({
                "id": row.activity_id,
                "name": activities.get(row.activity_id, "Unknown activity"),
                "like_count": int(row.like_count or 0),
                "pass_count": int(row.pass_count or 0),
            })

    # Vibe distribution from sessions.selected_vibes
    vibe_distribution = {}
    sessions_with_vibes = session_q.with_entities(PersonalizationSession.selected_vibes).all()
    for (vibes,) in sessions_with_vibes:
        if isinstance(vibes, list):
            for v in vibes:
                vibe_distribution[v] = vibe_distribution.get(v, 0) + 1

    return AgencyPersonalizationAnalytics(
        total_sessions=total_sessions,
        completion_rate=completion_rate.quantize(Decimal("0.01")) if total_sessions else Decimal(0),
        confirmation_rate=confirmation_rate.quantize(Decimal("0.01")) if total_cart_items else Decimal(0),
        total_revenue_added=total_revenue_added,
        sessions_over_time=sessions_over_time,
        top_performing_activities=top_performing_activities,
        vibe_distribution=vibe_distribution,
    )

@router.put("/activities/{activity_id}/gamification")
def update_activity_gamification(
    activity_id: str,
    gamification_data: ActivityGamificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update gamification-specific fields for an activity"""
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an agency"
        )

    # Get activity
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.agency_id == current_user.agency_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    # Update fields
    update_data = gamification_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ["vibe_tags", "blocked_days_of_week"]:
            # JSON fields
            setattr(activity, field, json.dumps(value) if value else None)
        else:
            setattr(activity, field, value)

    # Recalculate readiness score
    score, issues = ReadinessCalculator.calculate_score(activity)
    activity.gamification_readiness_score = score
    activity.gamification_readiness_issues = json.dumps(issues) if issues else None

    db.commit()
    db.refresh(activity)

    return {
        "message": "Activity gamification data updated",
        "readiness_score": float(score),
        "issues": issues
    }


@router.post("/activities/{activity_id}/gamification/validate", response_model=GamificationValidationResponse)
def validate_activity_gamification(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validate an activity's readiness for gamification"""
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an agency"
        )

    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.agency_id == current_user.agency_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    score, issues = ReadinessCalculator.calculate_score(activity)

    return GamificationValidationResponse(
        activity_id=activity.id,
        activity_name=activity.name,
        readiness_score=score,
        is_ready=score >= Decimal("0.70"),
        issues=issues
    )


@router.get("/agency/activities/gamification-status", response_model=GamificationStatusOverview)
def get_gamification_status_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overview of gamification readiness for all activities"""
    if not current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with an agency"
        )

    # Recalculate all scores
    stats = ReadinessCalculator.batch_calculate(db, current_user.agency_id)

    # Get activities
    activities = db.query(Activity).filter(
        Activity.agency_id == current_user.agency_id,
        Activity.is_active == True
    ).all()

    # Calculate average score
    total_score = sum(float(a.gamification_readiness_score or 0) for a in activities)
    avg_score = Decimal(str(total_score / len(activities))) if activities else Decimal("0")

    # Count common issues
    issue_counts = {}
    for activity in activities:
        if activity.gamification_readiness_issues:
            try:
                issues = json.loads(activity.gamification_readiness_issues)
                for issue in issues:
                    issue_counts[issue] = issue_counts.get(issue, 0) + 1
            except (json.JSONDecodeError, TypeError):
                pass

    return GamificationStatusOverview(
        total_activities=stats["total"],
        ready_activities=stats["ready"],
        not_ready_activities=stats["not_ready"],
        average_readiness_score=avg_score.quantize(Decimal("0.01")),
        common_issues=issue_counts
    )
