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
)
from app.services.gamification.vibe_service import VibeService
from app.services.gamification.settings_service import SettingsService
from app.services.gamification.readiness_calculator import ReadinessCalculator
from decimal import Decimal
import json

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
