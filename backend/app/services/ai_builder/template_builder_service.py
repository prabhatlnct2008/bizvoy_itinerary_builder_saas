"""
Template Builder Service

Creates templates from reviewed draft activities using LLM for optimal structuring.
"""
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
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
    """Creates template from reviewed draft activities using LLM"""

    def __init__(self):
        self.client = self._safe_openai_client()

    def _safe_openai_client(self) -> Optional[OpenAI]:
        """Instantiate OpenAI client if key is present."""
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            logger.warning("OpenAI API key not configured")
            return None
        try:
            return OpenAI(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            return None

    def _build_template_structure_prompt(
        self,
        session: AIBuilderSession,
        activities_by_day: Dict[int, List[Dict[str, Any]]]
    ) -> str:
        """Build prompt for LLM to structure the template"""

        # Format activities for the prompt
        activities_text = ""
        for day_num in sorted(activities_by_day.keys()):
            day_activities = activities_by_day[day_num]
            activities_text += f"\n### Day {day_num}:\n"
            for idx, act in enumerate(day_activities, 1):
                activities_text += f"""
{idx}. **{act['name']}**
   - Type: {act.get('activity_type', 'Experience')}
   - Location: {act.get('location', 'N/A')}
   - Duration: {act.get('duration_value', '?')} {act.get('duration_unit', 'minutes')}
   - Optimal time: {act.get('optimal_time', 'flexible')}
   - Description: {act.get('short_description', 'N/A')}
"""

        prompt = f"""You are a professional travel itinerary planner. Structure the following activities into an optimal template.

## Trip Details:
- Destination: {session.destination or 'Multi-destination'}
- Title: {session.trip_title or 'Untitled Trip'}
- Number of Days: {session.detected_days or len(activities_by_day)}

## Activities by Day:
{activities_text}

## Your Task:
Create a well-structured template with:

1. **Template Metadata**:
   - Professional description (2-3 sentences about the trip)
   - Approximate total price (estimate based on activities, in the local currency)

2. **For Each Day**:
   - Engaging day title (e.g., "Ancient Wonders of Rome" not just "Day 1")
   - Day notes (brief overview, travel tips, what to expect)

3. **For Each Activity**:
   - Optimal start_time (HH:MM format, e.g., "09:00")
   - end_time (calculated from start + duration)
   - time_slot ("Morning", "Afternoon", "Evening", "Night")
   - custom_notes (specific tips for this activity in the context of this trip)

4. **Logistics Items** (suggest where needed):
   - Inter-city transfers (train, flight between cities)
   - Airport transfers on arrival/departure days
   - Important travel notes

## Response Format (JSON only, no markdown):
{{
  "template": {{
    "description": "Professional 2-3 sentence description",
    "approximate_price": 1500,
    "currency": "EUR"
  }},
  "days": [
    {{
      "day_number": 1,
      "title": "Engaging Day Title",
      "notes": "Brief day overview and tips",
      "activities": [
        {{
          "activity_index": 0,
          "start_time": "14:00",
          "end_time": "15:00",
          "time_slot": "Afternoon",
          "custom_notes": "Specific tip for this activity"
        }}
      ],
      "logistics": [
        {{
          "type": "LOGISTICS",
          "title": "Airport Transfer",
          "notes": "Private car from FCO to hotel (45 mins)",
          "icon": "car",
          "insert_before_activity": 0,
          "start_time": "12:00"
        }}
      ]
    }}
  ]
}}

IMPORTANT:
- Use realistic times based on activity type (breakfast at 8-9am, dinner at 7-9pm, etc.)
- Account for travel time between activities
- Add logistics items for significant transfers (airports, train stations, city changes)
- Day titles should be thematic and engaging
- Notes should be practical and helpful"""

        return prompt

    def create_template_from_session(
        self,
        session: AIBuilderSession,
        template_name: Optional[str],
        user_id: str,
        db: Session
    ) -> TemplateCreationResponse:
        """
        Create template from reviewed draft activities using LLM for optimal structuring.

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

        # First, create all activities and get their IDs
        created_activities: List[Activity] = []
        activity_map: Dict[str, str] = {}  # draft_id -> activity_id
        activities_created = 0
        activities_reused = 0

        for draft in drafts:
            if draft.decision == DraftDecisionEnum.reuse_existing:
                activity_id = draft.matched_activity_id
                activities_reused += 1
            else:
                activity = self._create_activity_from_draft(
                    draft=draft,
                    agency_id=session.agency_id,
                    session_id=session.id,
                    db=db
                )
                activity_id = activity.id
                created_activities.append(activity)
                activities_created += 1
                draft.created_activity_id = activity_id

            activity_map[draft.id] = activity_id

        db.flush()

        # Prepare activities by day for LLM prompt
        activities_by_day: Dict[int, List[Dict[str, Any]]] = {}
        draft_by_day: Dict[int, List[AIBuilderDraftActivity]] = {}

        for draft in drafts:
            if draft.day_number not in activities_by_day:
                activities_by_day[draft.day_number] = []
                draft_by_day[draft.day_number] = []

            activities_by_day[draft.day_number].append({
                "name": draft.name,
                "activity_type": draft.category_label or "Experience",
                "location": draft.location_display,
                "duration_value": draft.default_duration_value or 60,
                "duration_unit": draft.default_duration_unit or "minutes",
                "optimal_time": draft.optimal_time_of_day or "flexible",
                "short_description": draft.short_description,
            })
            draft_by_day[draft.day_number].append(draft)

        # Get LLM-generated template structure
        template_structure = self._get_template_structure(session, activities_by_day)

        # Determine template name
        final_name = template_name or session.trip_title or f"AI Generated - {session.destination or 'Trip'}"

        # Calculate duration
        max_day = max(d.day_number for d in drafts) if drafts else 1
        duration_days = max_day
        duration_nights = max(0, duration_days - 1)

        # Get template metadata from LLM or use defaults
        template_desc = "Generated from AI Itinerary Builder"
        approximate_price = None

        if template_structure and "template" in template_structure:
            tmpl_data = template_structure["template"]
            template_desc = tmpl_data.get("description", template_desc)
            if tmpl_data.get("approximate_price"):
                approximate_price = Decimal(str(tmpl_data["approximate_price"]))

        # Create template
        template = Template(
            agency_id=session.agency_id,
            name=final_name,
            destination=session.destination or "Various",
            duration_days=duration_days,
            duration_nights=duration_nights,
            description=template_desc,
            approximate_price=approximate_price,
            status=TemplateStatus.draft,
            created_by=user_id
        )
        db.add(template)
        db.flush()

        # Create template days and activities
        llm_days = {}
        if template_structure and "days" in template_structure:
            for day_data in template_structure["days"]:
                llm_days[day_data["day_number"]] = day_data

        for day_number in sorted(draft_by_day.keys()):
            day_drafts = draft_by_day[day_number]
            llm_day = llm_days.get(day_number, {})

            # Create template day with LLM-generated title and notes
            template_day = TemplateDay(
                template_id=template.id,
                day_number=day_number,
                title=llm_day.get("title") or day_drafts[0].day_title or f"Day {day_number}",
                notes=llm_day.get("notes")
            )
            db.add(template_day)
            db.flush()

            # Get LLM activity data
            llm_activities = {}
            if "activities" in llm_day:
                for act_data in llm_day["activities"]:
                    llm_activities[act_data.get("activity_index", -1)] = act_data

            # Get logistics items
            logistics_items = llm_day.get("logistics", [])
            logistics_by_position = {}
            for log_item in logistics_items:
                pos = log_item.get("insert_before_activity", 999)
                if pos not in logistics_by_position:
                    logistics_by_position[pos] = []
                logistics_by_position[pos].append(log_item)

            display_order = 0

            # Process activities for this day
            for idx, draft in enumerate(day_drafts):
                # Add any logistics items before this activity
                if idx in logistics_by_position:
                    for log_item in logistics_by_position[idx]:
                        logistics_activity = TemplateDayActivity(
                            template_day_id=template_day.id,
                            activity_id=None,
                            item_type="LOGISTICS",
                            custom_title=log_item.get("title", "Transfer"),
                            custom_payload=json.dumps({"notes": log_item.get("notes", "")}),
                            custom_icon=log_item.get("icon", "car"),
                            display_order=display_order,
                            start_time=log_item.get("start_time"),
                            is_locked_by_agency=1
                        )
                        db.add(logistics_activity)
                        display_order += 1

                # Get LLM data for this activity
                llm_act = llm_activities.get(idx, {})

                # Create template day activity
                template_activity = TemplateDayActivity(
                    template_day_id=template_day.id,
                    activity_id=activity_map[draft.id],
                    item_type="LIBRARY_ACTIVITY",
                    display_order=display_order,
                    time_slot=llm_act.get("time_slot"),
                    start_time=llm_act.get("start_time"),
                    end_time=llm_act.get("end_time"),
                    custom_notes=llm_act.get("custom_notes"),
                    is_locked_by_agency=1
                )
                db.add(template_activity)
                display_order += 1

            # Add any remaining logistics at end of day
            if 999 in logistics_by_position:
                for log_item in logistics_by_position[999]:
                    logistics_activity = TemplateDayActivity(
                        template_day_id=template_day.id,
                        activity_id=None,
                        item_type="LOGISTICS",
                        custom_title=log_item.get("title", "Transfer"),
                        custom_payload=json.dumps({"notes": log_item.get("notes", "")}),
                        custom_icon=log_item.get("icon", "car"),
                        display_order=display_order,
                        start_time=log_item.get("start_time"),
                        is_locked_by_agency=1
                    )
                    db.add(logistics_activity)
                    display_order += 1

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

    def _get_template_structure(
        self,
        session: AIBuilderSession,
        activities_by_day: Dict[int, List[Dict[str, Any]]]
    ) -> Optional[Dict[str, Any]]:
        """Get LLM-generated template structure"""
        if not self.client:
            logger.warning("OpenAI client not available, using default structure")
            return None

        try:
            prompt = self._build_template_structure_prompt(session, activities_by_day)

            completion = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert travel itinerary planner.
Create optimal day structures with realistic timings, engaging titles, and helpful notes.
Reply ONLY with valid JSON. No markdown code blocks."""
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=4000
            )

            response_text = completion.choices[0].message.content if completion.choices else ""

            # Clean response
            response_text = response_text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            return json.loads(response_text)

        except Exception as e:
            logger.error(f"Failed to get template structure from LLM: {e}")
            return None

    def _create_activity_from_draft(
        self,
        draft: AIBuilderDraftActivity,
        agency_id: str,
        session_id: str,
        db: Session
    ) -> Activity:
        """Create a new Activity from a draft with all enriched fields"""
        duration_unit = None
        if draft.default_duration_unit:
            unit_str = draft.default_duration_unit.lower()
            if unit_str in ["minutes", "hours", "days", "nights"]:
                duration_unit = DurationUnit(unit_str)
            else:
                duration_unit = DurationUnit.minutes

        cost_type = CostType.included
        if draft.cost_type:
            if draft.cost_type.lower() == "extra":
                cost_type = CostType.extra
        elif draft.price_numeric:
            cost_type = CostType.extra

        activity = Activity(
            agency_id=agency_id,
            activity_type_id=draft.activity_type_id,
            name=draft.name,
            category_label=draft.category_label,
            location_display=draft.location_display,
            short_description=draft.short_description,
            client_description=draft.client_description,
            default_duration_value=draft.default_duration_value,
            default_duration_unit=duration_unit,
            rating=draft.rating,
            group_size_label=draft.group_size_label,
            cost_type=cost_type,
            cost_display=draft.cost_display,
            price_numeric=draft.price_numeric,
            currency_code=draft.currency_code or "INR",
            highlights=draft.highlights,
            tags=draft.tags,
            vibe_tags=draft.vibe_tags,
            marketing_badge=draft.marketing_badge,
            optimal_time_of_day=draft.optimal_time_of_day,
            is_active=True,
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
                detail=f"{activities_without_images} {'activity' if activities_without_images == 1 else 'activities'} need images.",
                count=activities_without_images,
                action_url=f"/activities?filter=ai_session_{template.id}"
            ))

        activities_with_estimates = sum(1 for a in created_activities if a.price_numeric)
        if activities_with_estimates > 0:
            next_steps.append(NextStepItem(
                type="estimated_prices",
                title="Confirm prices",
                detail=f"{activities_with_estimates} {'activity has' if activities_with_estimates == 1 else 'activities have'} estimated prices.",
                count=activities_with_estimates,
                action_url=f"/activities?filter=ai_session_{template.id}"
            ))

        next_steps.append(NextStepItem(
            type="fine_tune",
            title="Fine-tune the template",
            detail="Review day flow, adjust timings, and add any missing details.",
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
