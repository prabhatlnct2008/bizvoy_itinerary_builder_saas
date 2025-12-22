"""AI Itinerary Builder API endpoints"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime

from app.core.deps import get_db, get_current_user
from app.services.rbac_service import has_permission
from app.models.user import User
from app.models.agency import Agency
from app.models.activity_type import ActivityType
from app.models.activity import Activity
from app.models.ai_builder import (
    AIBuilderSession,
    AIBuilderDraftActivity,
    AISessionStatus,
    DraftDecision as DraftDecisionEnum
)
from app.schemas.ai_builder import (
    AIBuilderStatusResponse,
    AIBuilderSessionCreate,
    AIBuilderSessionResponse,
    DraftActivityResponse,
    DraftActivityUpdate,
    DraftDecision,
    BulkDecision,
    BulkDecisionResponse,
    TemplateCreateRequest,
    TemplateCreationResponse,
    DraftActivitiesWithDays,
    DayGroup
)

router = APIRouter()
logger = logging.getLogger(__name__)


def require_ai_builder_access(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Require agency user with permission and AI builder enabled (Bizvoy admin bypasses flag)."""
    # Bizvoy platform admins can bypass agency flag
    if current_user.is_bizvoy_admin:
        return current_user

    # Require templates.create (agency-admin level) permission
    if not has_permission(current_user, "templates.create", db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Itinerary Builder requires template creation permission"
        )

    # Check agency toggle
    agency = db.query(Agency).filter(Agency.id == current_user.agency_id).first()
    if not agency or not agency.ai_builder_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Itinerary Builder is not enabled for your agency"
        )

    return current_user


@router.get("/status", response_model=AIBuilderStatusResponse)
def get_ai_builder_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if AI builder is enabled for the current user's agency"""
    agency = db.query(Agency).filter(Agency.id == current_user.agency_id).first()

    return AIBuilderStatusResponse(
        enabled=agency.ai_builder_enabled if agency else False,
        agency_id=current_user.agency_id,
        agency_name=agency.name if agency else ""
    )


@router.post("/sessions", response_model=AIBuilderSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    session_data: AIBuilderSessionCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_ai_builder_access),
    db: Session = Depends(get_db)
):
    """Create a new AI builder session and start processing"""
    # Create session
    session = AIBuilderSession(
        agency_id=current_user.agency_id,
        user_id=current_user.id,
        destination=session_data.destination,
        trip_title=session_data.trip_title,
        num_days=session_data.num_days,
        raw_content=session_data.raw_content,
        status=AISessionStatus.pending,
        current_step=1
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Start background processing (will be implemented in Phase 3)
    background_tasks.add_task(process_ai_session, session.id)

    return _session_to_response(session)


@router.get("/sessions/{session_id}", response_model=AIBuilderSessionResponse)
def get_session(
    session_id: str,
    current_user: User = Depends(require_ai_builder_access),
    db: Session = Depends(get_db)
):
    """Get AI builder session status and details"""
    session = db.query(AIBuilderSession).filter(
        AIBuilderSession.id == session_id,
        AIBuilderSession.agency_id == current_user.agency_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    return _session_to_response(session)


@router.get("/sessions/{session_id}/draft-activities", response_model=DraftActivitiesWithDays)
def get_draft_activities(
    session_id: str,
    day_filter: Optional[int] = None,
    current_user: User = Depends(require_ai_builder_access),
    db: Session = Depends(get_db)
):
    """Get draft activities for review"""
    session = db.query(AIBuilderSession).filter(
        AIBuilderSession.id == session_id,
        AIBuilderSession.agency_id == current_user.agency_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    # Get all draft activities
    query = db.query(AIBuilderDraftActivity).filter(
        AIBuilderDraftActivity.session_id == session_id
    )

    if day_filter is not None:
        query = query.filter(AIBuilderDraftActivity.day_number == day_filter)

    drafts = query.order_by(
        AIBuilderDraftActivity.day_number,
        AIBuilderDraftActivity.order_index
    ).all()

    # Get day groups
    day_groups = db.query(
        AIBuilderDraftActivity.day_number,
        AIBuilderDraftActivity.day_title,
        func.count(AIBuilderDraftActivity.id).label('activity_count')
    ).filter(
        AIBuilderDraftActivity.session_id == session_id
    ).group_by(
        AIBuilderDraftActivity.day_number,
        AIBuilderDraftActivity.day_title
    ).order_by(
        AIBuilderDraftActivity.day_number
    ).all()

    # Count by decision status
    total_new = sum(1 for d in drafts if d.decision == DraftDecisionEnum.create_new)
    total_reuse = sum(1 for d in drafts if d.decision == DraftDecisionEnum.reuse_existing)
    total_pending = sum(1 for d in drafts if d.decision == DraftDecisionEnum.pending)

    return DraftActivitiesWithDays(
        days=[
            DayGroup(
                day_number=dg.day_number,
                day_title=dg.day_title,
                activity_count=dg.activity_count
            )
            for dg in day_groups
        ],
        activities=[_draft_to_response(d, db) for d in drafts],
        total_activities=len(drafts),
        total_new=total_new,
        total_reuse=total_reuse,
        total_pending=total_pending
    )


@router.patch("/sessions/{session_id}/draft-activities/{activity_id}", response_model=DraftActivityResponse)
def update_draft_activity(
    session_id: str,
    activity_id: str,
    update_data: DraftActivityUpdate,
    current_user: User = Depends(require_ai_builder_access),
    db: Session = Depends(get_db)
):
    """Update a draft activity's details"""
    draft = _get_draft_activity(session_id, activity_id, current_user.agency_id, db)

    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(draft, field, value)

    db.commit()
    db.refresh(draft)

    return _draft_to_response(draft, db)


@router.post("/sessions/{session_id}/draft-activities/{activity_id}/decision", response_model=DraftActivityResponse)
def set_draft_decision(
    session_id: str,
    activity_id: str,
    decision_data: DraftDecision,
    current_user: User = Depends(require_ai_builder_access),
    db: Session = Depends(get_db)
):
    """Set decision for a draft activity (create new or reuse existing)"""
    draft = _get_draft_activity(session_id, activity_id, current_user.agency_id, db)

    # Validate reuse_existing decision
    if decision_data.decision == "reuse_existing":
        if not decision_data.reuse_activity_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="reuse_activity_id is required when decision is 'reuse_existing'"
            )

        # Verify the activity exists and belongs to this agency
        existing_activity = db.query(Activity).filter(
            Activity.id == decision_data.reuse_activity_id,
            Activity.agency_id == current_user.agency_id
        ).first()

        if not existing_activity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Activity to reuse not found"
            )

        draft.matched_activity_id = decision_data.reuse_activity_id
        draft.decision = DraftDecisionEnum.reuse_existing
    else:
        draft.decision = DraftDecisionEnum.create_new

    db.commit()
    db.refresh(draft)

    return _draft_to_response(draft, db)


@router.post("/sessions/{session_id}/bulk-decision", response_model=BulkDecisionResponse)
def apply_bulk_decision(
    session_id: str,
    bulk_data: BulkDecision,
    current_user: User = Depends(require_ai_builder_access),
    db: Session = Depends(get_db)
):
    """Apply bulk decision to draft activities"""
    session = db.query(AIBuilderSession).filter(
        AIBuilderSession.id == session_id,
        AIBuilderSession.agency_id == current_user.agency_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    drafts = db.query(AIBuilderDraftActivity).filter(
        AIBuilderDraftActivity.session_id == session_id
    ).all()

    updated_count = 0

    if bulk_data.action == "accept_all_new":
        # Mark all as create_new
        for draft in drafts:
            draft.decision = DraftDecisionEnum.create_new
            updated_count += 1

    elif bulk_data.action == "auto_reuse_best":
        # Auto-reuse activities with match score >= threshold
        for draft in drafts:
            if draft.match_score and draft.match_score >= bulk_data.match_threshold:
                if draft.matched_activity_id:
                    draft.decision = DraftDecisionEnum.reuse_existing
                    updated_count += 1
            else:
                draft.decision = DraftDecisionEnum.create_new
                updated_count += 1

    elif bulk_data.action == "clear_all":
        # Reset all decisions to pending
        for draft in drafts:
            draft.decision = DraftDecisionEnum.pending
            updated_count += 1

    db.commit()

    # Count final totals
    new_count = sum(1 for d in drafts if d.decision == DraftDecisionEnum.create_new)
    reuse_count = sum(1 for d in drafts if d.decision == DraftDecisionEnum.reuse_existing)

    return BulkDecisionResponse(
        updated_count=updated_count,
        new_count=new_count,
        reuse_count=reuse_count
    )


@router.post("/sessions/{session_id}/create-template", response_model=TemplateCreationResponse)
def create_template_from_session(
    session_id: str,
    request: TemplateCreateRequest,
    current_user: User = Depends(require_ai_builder_access),
    db: Session = Depends(get_db)
):
    """Create template from reviewed draft activities"""
    session = db.query(AIBuilderSession).filter(
        AIBuilderSession.id == session_id,
        AIBuilderSession.agency_id == current_user.agency_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    if session.template_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template has already been created for this session"
        )

    # Check all drafts have decisions
    pending_count = db.query(AIBuilderDraftActivity).filter(
        AIBuilderDraftActivity.session_id == session_id,
        AIBuilderDraftActivity.decision == DraftDecisionEnum.pending
    ).count()

    if pending_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{pending_count} activities still need decisions. Please review all activities."
        )

    # Delegate to template builder service (Phase 5)
    from app.services.ai_builder.template_builder_service import AITemplateBuilderService
    builder_service = AITemplateBuilderService()

    result = builder_service.create_template_from_session(
        session=session,
        template_name=request.template_name,
        user_id=current_user.id,
        db=db
    )

    return result


# Helper functions

def _session_to_response(session: AIBuilderSession) -> AIBuilderSessionResponse:
    """Convert session model to response"""
    return AIBuilderSessionResponse(
        id=session.id,
        status=session.status.value,
        current_step=session.current_step,
        error_message=session.error_message,
        destination=session.destination,
        trip_title=session.trip_title,
        num_days=session.num_days,
        detected_days=session.detected_days,
        parsed_summary=session.parsed_summary,
        activities_created=session.activities_created,
        activities_reused=session.activities_reused,
        template_id=session.template_id,
        created_at=session.created_at,
        completed_at=session.completed_at
    )


def _draft_to_response(draft: AIBuilderDraftActivity, db: Session) -> DraftActivityResponse:
    """Convert draft activity model to response with all enriched fields"""
    # Get activity type label
    activity_type_label = None
    if draft.activity_type_id:
        activity_type = db.query(ActivityType).filter(
            ActivityType.id == draft.activity_type_id
        ).first()
        if activity_type:
            activity_type_label = activity_type.name

    # Get matched activity name
    matched_activity_name = None
    if draft.matched_activity_id:
        matched = db.query(Activity).filter(
            Activity.id == draft.matched_activity_id
        ).first()
        if matched:
            matched_activity_name = matched.name

    return DraftActivityResponse(
        id=draft.id,
        day_number=draft.day_number,
        order_index=draft.order_index,
        day_title=draft.day_title,
        # Core fields
        name=draft.name,
        activity_type_id=draft.activity_type_id,
        activity_type_label=activity_type_label,
        category_label=draft.category_label,
        location_display=draft.location_display,
        # Descriptions
        short_description=draft.short_description,
        client_description=draft.client_description,
        # Duration
        default_duration_value=draft.default_duration_value,
        default_duration_unit=draft.default_duration_unit,
        optimal_time_of_day=draft.optimal_time_of_day,
        # Cost
        cost_type=draft.cost_type,
        cost_display=draft.cost_display,
        price_numeric=draft.price_numeric,
        currency_code=draft.currency_code or "INR",
        # Tags & Highlights
        highlights=draft.highlights,
        tags=draft.tags,
        vibe_tags=draft.vibe_tags,
        # Meta
        group_size_label=draft.group_size_label,
        marketing_badge=draft.marketing_badge,
        rating=draft.rating,
        # Match info
        matched_activity_id=draft.matched_activity_id,
        matched_activity_name=matched_activity_name,
        match_score=draft.match_score,
        match_reasoning=draft.match_reasoning,
        # Decision
        decision=draft.decision.value,
        # Timestamps
        created_at=draft.created_at,
        updated_at=draft.updated_at
    )


def _get_draft_activity(
    session_id: str,
    activity_id: str,
    agency_id: str,
    db: Session
) -> AIBuilderDraftActivity:
    """Get draft activity with validation"""
    # First verify session belongs to agency
    session = db.query(AIBuilderSession).filter(
        AIBuilderSession.id == session_id,
        AIBuilderSession.agency_id == agency_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    # Then get the draft activity
    draft = db.query(AIBuilderDraftActivity).filter(
        AIBuilderDraftActivity.id == activity_id,
        AIBuilderDraftActivity.session_id == session_id
    ).first()

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft activity not found"
        )

    return draft


async def process_ai_session(session_id: str):
    """
    Background task to process AI session.

    Flow:
    1. Parse trip content → Generate enriched activity data (parser_service)
    2. Search existing activities for each draft (comparison_service)
    3. LLM comparison → Determine highly similar matches (comparison_service)
    4. Mark session as completed
    """
    from app.db.session import SessionLocal
    from app.services.ai_builder.parser_service import get_parser_service
    from app.services.ai_builder.comparison_service import get_comparison_service

    db = SessionLocal()
    try:
        session = db.query(AIBuilderSession).filter(
            AIBuilderSession.id == session_id
        ).first()

        if not session:
            return

        logger.info(f"[AI Builder] Starting processing for session {session_id}")

        # Update status to processing
        session.status = AISessionStatus.processing
        db.commit()

        # Step 1-5: Parse trip content and generate enriched activity data
        parser_service = get_parser_service()
        success = parser_service.parse_trip_content(session, db)

        if not success:
            # Parser already updated session with error
            return

        # Refresh session to get draft activities
        db.refresh(session)

        # Step 6: Compare drafts with existing library using LLM
        comparison_service = get_comparison_service()
        comparison_stats = comparison_service.compare_all_drafts(session, db)

        # Update session with stats
        session.activities_reused = comparison_stats.get("matched", 0)

        # Mark as completed
        session.status = AISessionStatus.completed
        session.completed_at = datetime.utcnow()
        db.commit()
        logger.info(f"[AI Builder] Completed processing for session {session_id}")

    except Exception as e:
        if session:
            session.status = AISessionStatus.failed
            session.error_message = f"Processing error: {str(e)}"
            db.commit()
        logger.exception(f"[AI Builder] Processing error for session {session_id}: {e}")
    finally:
        db.close()
