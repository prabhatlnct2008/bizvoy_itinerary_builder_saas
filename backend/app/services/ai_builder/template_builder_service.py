"""
Template Builder Service

Creates templates from reviewed draft activities.
"""
import logging
from typing import List, Optional
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.ai_builder import (
    AIBuilderSession,
    AIBuilderDraftActivity,
    DraftDecision as DraftDecisionEnum
)
from app.models.activity import Activity, DurationUnit, CostType
from app.models.template import Template, TemplateDay, TemplateDayActivity, TemplateStatus
from app.models.activity_image import ActivityImage
from app.schemas.ai_builder import TemplateCreationResponse, NextStepItem
from app.services.search_service import search_service

logger = logging.getLogger(__name__)


class AITemplateBuilderService:
    """Creates template from reviewed draft activities"""

    def create_template_from_session(
        self,
        session: AIBuilderSession,
        template_name: Optional[str],
        user_id: str,
        db: Session
    ) -> TemplateCreationResponse:
        """
        Create template from reviewed draft activities.

        Args:
            session: The AI builder session
            template_name: Optional override for template name
            user_id: ID of the user creating the template
            db: Database session

        Returns:
            TemplateCreationResponse with template details and next steps
        """
        # Get all draft activities
        drafts = db.query(AIBuilderDraftActivity).filter(
            AIBuilderDraftActivity.session_id == session.id
        ).order_by(
            AIBuilderDraftActivity.day_number,
            AIBuilderDraftActivity.order_index
        ).all()

        # Determine template name
        final_name = template_name or session.trip_title or f"AI Generated - {session.destination or 'Trip'}"

        # Calculate duration
        max_day = max(d.day_number for d in drafts) if drafts else 1
        duration_days = max_day
        duration_nights = max(0, duration_days - 1)

        # Create template
        template = Template(
            agency_id=session.agency_id,
            name=final_name,
            destination=session.destination or "Various",
            duration_days=duration_days,
            duration_nights=duration_nights,
            description=f"Generated from AI Itinerary Builder",
            status=TemplateStatus.draft,
            created_by=user_id
        )
        db.add(template)
        db.flush()  # Get template ID

        # Track created activities
        created_activities: List[Activity] = []
        activities_created = 0
        activities_reused = 0

        # Group drafts by day
        days_map = {}
        for draft in drafts:
            if draft.day_number not in days_map:
                days_map[draft.day_number] = {
                    "title": draft.day_title,
                    "drafts": []
                }
            days_map[draft.day_number]["drafts"].append(draft)

        # Create template days and activities
        for day_number in sorted(days_map.keys()):
            day_data = days_map[day_number]

            # Create template day
            template_day = TemplateDay(
                template_id=template.id,
                day_number=day_number,
                title=day_data["title"]
            )
            db.add(template_day)
            db.flush()

            # Process drafts for this day
            for display_order, draft in enumerate(day_data["drafts"]):
                activity_id = None

                if draft.decision == DraftDecisionEnum.reuse_existing:
                    # Use existing activity
                    activity_id = draft.matched_activity_id
                    activities_reused += 1
                else:
                    # Create new activity
                    activity = self._create_activity_from_draft(
                        draft=draft,
                        agency_id=session.agency_id,
                        session_id=session.id,
                        db=db
                    )
                    activity_id = activity.id
                    created_activities.append(activity)
                    activities_created += 1

                    # Update draft with created activity ID
                    draft.created_activity_id = activity_id

                # Create template day activity
                template_activity = TemplateDayActivity(
                    template_day_id=template_day.id,
                    activity_id=activity_id,
                    item_type="LIBRARY_ACTIVITY",
                    display_order=display_order,
                    is_locked_by_agency=1
                )
                db.add(template_activity)

        # Update session
        session.template_id = template.id
        session.activities_created = activities_created
        session.activities_reused = activities_reused
        session.completed_at = datetime.utcnow()

        db.commit()

        # Index new activities in search
        for activity in created_activities:
            try:
                search_service.index_activity(activity)
            except Exception as e:
                logger.warning(f"Failed to index activity {activity.id}: {e}")

        # Calculate next steps
        next_steps = self._calculate_next_steps(
            template=template,
            created_activities=created_activities,
            db=db
        )

        return TemplateCreationResponse(
            template_id=template.id,
            template_name=template.name,
            destination=template.destination,
            num_days=template.duration_days,
            activities_created=activities_created,
            activities_reused=activities_reused,
            next_steps=next_steps
        )

    def _create_activity_from_draft(
        self,
        draft: AIBuilderDraftActivity,
        agency_id: str,
        session_id: str,
        db: Session
    ) -> Activity:
        """Create a new Activity from a draft"""
        # Determine duration unit
        duration_unit = None
        if draft.default_duration_unit:
            unit_str = draft.default_duration_unit.lower()
            if unit_str in ["minutes", "hours", "days", "nights"]:
                duration_unit = DurationUnit(unit_str)
            else:
                duration_unit = DurationUnit.minutes

        activity = Activity(
            agency_id=agency_id,
            activity_type_id=draft.activity_type_id,
            name=draft.name,
            location_display=draft.location_display,
            short_description=draft.short_description,
            default_duration_value=draft.default_duration_value,
            default_duration_unit=duration_unit,
            cost_type=CostType.extra if draft.estimated_price else CostType.included,
            price_numeric=draft.estimated_price,
            currency_code=draft.currency_code or "INR",
            is_active=True,
            # AI Builder tracking
            created_via_ai_builder=True,
            ai_builder_session_id=session_id
        )
        db.add(activity)
        db.flush()

        return activity

    def _calculate_next_steps(
        self,
        template: Template,
        created_activities: List[Activity],
        db: Session
    ) -> List[NextStepItem]:
        """Calculate next steps checklist for the user"""
        next_steps = []

        # Check for activities missing images
        activities_without_images = 0
        for activity in created_activities:
            image_count = db.query(ActivityImage).filter(
                ActivityImage.activity_id == activity.id
            ).count()
            if image_count == 0:
                activities_without_images += 1

        if activities_without_images > 0:
            next_steps.append(NextStepItem(
                type="missing_images",
                title="Add images to activities",
                detail=f"{activities_without_images} {'activity doesn' if activities_without_images == 1 else 'activities don'}'t have any images yet.",
                count=activities_without_images,
                action_url=f"/activities?filter=ai_session_{template.id}"
            ))

        # Check for activities with estimated prices
        activities_with_estimates = sum(
            1 for a in created_activities if a.price_numeric
        )
        if activities_with_estimates > 0:
            next_steps.append(NextStepItem(
                type="estimated_prices",
                title="Confirm prices",
                detail=f"{activities_with_estimates} {'activity has' if activities_with_estimates == 1 else 'activities have'} estimated prices.",
                count=activities_with_estimates,
                action_url=f"/activities?filter=ai_session_{template.id}"
            ))

        # Always suggest fine-tuning the template
        next_steps.append(NextStepItem(
            type="fine_tune",
            title="Fine-tune the day flow",
            detail="Open the template to adjust timings and notes for each day.",
            count=None,
            action_url=f"/templates/{template.id}/edit"
        ))

        return next_steps


# Singleton instance
_builder_service = None


def get_builder_service() -> AITemplateBuilderService:
    """Get or create builder service singleton"""
    global _builder_service
    if _builder_service is None:
        _builder_service = AITemplateBuilderService()
    return _builder_service
