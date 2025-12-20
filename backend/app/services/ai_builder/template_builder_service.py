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
        activities_by_day: Dict[int, List[Dict[str, Any]]],
        activity_id_map: Dict[str, str]  # draft_index_key -> activity_id
    ) -> str:
        """
        Build prompt for LLM to structure the template.

        The LLM output must exactly match the TemplateCreate schema structure:
        - Template fields: description, approximate_price
        - Days: day_number, title, notes, activities[]
        - Activities: activity_id, item_type, custom_title, custom_payload, custom_icon,
                      display_order, time_slot, custom_notes, start_time, end_time, is_locked_by_agency
        """

        # Format activities for the prompt with their actual activity_ids
        activities_text = ""
        for day_num in sorted(activities_by_day.keys()):
            day_activities = activities_by_day[day_num]
            activities_text += f"\n### Day {day_num}:\n"
            for idx, act in enumerate(day_activities):
                # Get the actual activity_id for this draft
                activity_id = act.get('activity_id', 'unknown')
                activities_text += f"""
Activity #{idx} (activity_id: "{activity_id}")
  - Name: {act['name']}
  - Type: {act.get('activity_type', 'Experience')}
  - Location: {act.get('location', 'N/A')}
  - Duration: {act.get('duration_value', 60)} {act.get('duration_unit', 'minutes')}
  - Optimal time: {act.get('optimal_time', 'flexible')}
  - Description: {act.get('short_description', 'N/A')}
"""

        num_days = session.detected_days or len(activities_by_day)

        prompt = f"""You are a professional travel itinerary planner. Your task is to structure activities into a template
that will be saved to our database.

## Trip Details:
- Destination: {session.destination or 'Multi-destination'}
- Title: {session.trip_title or 'Untitled Trip'}
- Number of Days: {num_days}
- Number of Nights: {max(0, num_days - 1)}

## Activities by Day (with their database IDs):
{activities_text}

## OUTPUT REQUIREMENTS:

You must output JSON that matches our exact database schema:

### Template Level Fields:
- description: string (2-3 professional sentences about the trip)
- approximate_price: number (estimated total cost in local currency, or null)

### For Each Day (template_days table):
- day_number: integer (1, 2, 3...)
- title: string (engaging thematic title like "Ancient Wonders of Rome", not "Day 1")
- notes: string or null (brief overview, travel tips, what to expect)
- activities: array of activity items

### For Each Activity (template_day_activities table):
For LIBRARY_ACTIVITY items (activities from our catalog):
- activity_id: string (USE THE EXACT activity_id PROVIDED ABOVE)
- item_type: "LIBRARY_ACTIVITY"
- display_order: integer (0, 1, 2... for ordering within the day)
- time_slot: string ("Morning", "Afternoon", "Evening", or "Night")
- custom_notes: string or null (specific tips for this activity in context of this trip)
- start_time: string (HH:MM format like "09:00")
- end_time: string (HH:MM format, calculated from start + duration)
- is_locked_by_agency: boolean (true = traveler cannot swap this activity)

For LOGISTICS items (transfers, travel between places):
- activity_id: null
- item_type: "LOGISTICS"
- custom_title: string (e.g., "Airport Transfer", "Train to Florence")
- custom_payload: string (JSON string with extra details, e.g., '{{"notes": "45 min drive"}}')
- custom_icon: string (one of: "car", "plane", "train", "bus", "taxi", "hotel", "info")
- display_order: integer
- time_slot: string or null
- custom_notes: string or null
- start_time: string or null
- end_time: string or null
- is_locked_by_agency: true

For NOTE items (important information without activity):
- activity_id: null
- item_type: "NOTE"
- custom_title: string (the note title)
- custom_payload: string (JSON with note content)
- custom_icon: "info"
- display_order: integer
- time_slot: null
- custom_notes: null
- start_time: null
- end_time: null
- is_locked_by_agency: true

## OUTPUT FORMAT (JSON only, no markdown code blocks):
{{
  "description": "A captivating 2-3 sentence description of this travel experience...",
  "approximate_price": 1500,
  "days": [
    {{
      "day_number": 1,
      "title": "Arrival & First Impressions",
      "notes": "Brief day overview and helpful tips...",
      "activities": [
        {{
          "activity_id": null,
          "item_type": "LOGISTICS",
          "custom_title": "Airport Transfer",
          "custom_payload": "{{\\"notes\\": \\"Private car pickup from airport to hotel (45 mins)\\"}}",
          "custom_icon": "car",
          "display_order": 0,
          "time_slot": "Afternoon",
          "custom_notes": null,
          "start_time": "14:00",
          "end_time": "14:45",
          "is_locked_by_agency": true
        }},
        {{
          "activity_id": "actual-uuid-from-above",
          "item_type": "LIBRARY_ACTIVITY",
          "custom_title": null,
          "custom_payload": null,
          "custom_icon": null,
          "display_order": 1,
          "time_slot": "Afternoon",
          "custom_notes": "Best to arrive early to avoid crowds",
          "start_time": "15:00",
          "end_time": "17:00",
          "is_locked_by_agency": true
        }}
      ]
    }}
  ]
}}

## IMPORTANT RULES:
1. Use EXACT activity_id values from the activity list above - do not make up IDs
2. Use realistic times (breakfast 8-9am, lunch 12-1pm, dinner 7-9pm, etc.)
3. Account for travel time between activities
4. Add LOGISTICS items for:
   - Airport arrival/departure transfers on first/last days
   - Inter-city travel (train/flight when destination changes)
   - Check-in/check-out notes for hotels
5. Day titles should be thematic and engaging, never generic like "Day 1"
6. display_order must be sequential starting from 0 within each day
7. is_locked_by_agency should be true for most activities (travelers cannot swap)
8. custom_payload must be a valid JSON STRING (escaped quotes inside)"""

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

        The LLM generates data that directly matches the TemplateCreate schema:
        - Template fields: description, approximate_price
        - Days: day_number, title, notes, activities[]
        - Activities: activity_id, item_type, custom_title, custom_payload, custom_icon,
                      display_order, time_slot, custom_notes, start_time, end_time, is_locked_by_agency

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

        # Prepare activities by day for LLM prompt - now includes activity_id
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
                "activity_id": activity_map[draft.id],  # Include actual activity_id for LLM
            })
            draft_by_day[draft.day_number].append(draft)

        # Get LLM-generated template structure (now in exact schema format)
        template_structure = self._get_template_structure(session, activities_by_day, activity_map)

        # Determine template name
        final_name = template_name or session.trip_title or f"AI Generated - {session.destination or 'Trip'}"

        # Calculate duration
        max_day = max(d.day_number for d in drafts) if drafts else 1
        duration_days = max_day
        duration_nights = max(0, duration_days - 1)

        # Get template metadata from LLM or use defaults
        template_desc = "Generated from AI Itinerary Builder"
        approximate_price = None

        if template_structure:
            template_desc = template_structure.get("description", template_desc)
            if template_structure.get("approximate_price"):
                approximate_price = Decimal(str(template_structure["approximate_price"]))

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

        # Build a set of valid activity IDs for validation
        valid_activity_ids = set(activity_map.values())

        # Create template days and activities from LLM output
        if template_structure and "days" in template_structure:
            # Use LLM-generated structure directly (matches TemplateCreate schema)
            for llm_day in template_structure["days"]:
                day_number = llm_day.get("day_number", 1)

                # Create template day
                template_day = TemplateDay(
                    template_id=template.id,
                    day_number=day_number,
                    title=llm_day.get("title") or f"Day {day_number}",
                    notes=llm_day.get("notes")
                )
                db.add(template_day)
                db.flush()

                # Create activities from LLM output (already in correct format)
                for act_data in llm_day.get("activities", []):
                    item_type = act_data.get("item_type", "LIBRARY_ACTIVITY")
                    activity_id = act_data.get("activity_id")

                    # Validate activity_id for LIBRARY_ACTIVITY
                    if item_type == "LIBRARY_ACTIVITY":
                        if not activity_id or activity_id not in valid_activity_ids:
                            logger.warning(f"Invalid activity_id {activity_id} from LLM, skipping")
                            continue

                    template_activity = TemplateDayActivity(
                        template_day_id=template_day.id,
                        activity_id=activity_id if item_type == "LIBRARY_ACTIVITY" else None,
                        item_type=item_type,
                        custom_title=act_data.get("custom_title"),
                        custom_payload=act_data.get("custom_payload"),
                        custom_icon=act_data.get("custom_icon"),
                        display_order=act_data.get("display_order", 0),
                        time_slot=act_data.get("time_slot"),
                        custom_notes=act_data.get("custom_notes"),
                        start_time=act_data.get("start_time"),
                        end_time=act_data.get("end_time"),
                        is_locked_by_agency=1 if act_data.get("is_locked_by_agency", True) else 0
                    )
                    db.add(template_activity)
        else:
            # Fallback: create basic structure without LLM enhancements
            logger.warning("LLM structure not available, using fallback template creation")
            for day_number in sorted(draft_by_day.keys()):
                day_drafts = draft_by_day[day_number]

                # Create template day
                template_day = TemplateDay(
                    template_id=template.id,
                    day_number=day_number,
                    title=day_drafts[0].day_title or f"Day {day_number}",
                    notes=None
                )
                db.add(template_day)
                db.flush()

                # Create activities
                for idx, draft in enumerate(day_drafts):
                    template_activity = TemplateDayActivity(
                        template_day_id=template_day.id,
                        activity_id=activity_map[draft.id],
                        item_type="LIBRARY_ACTIVITY",
                        display_order=idx,
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

    def _get_template_structure(
        self,
        session: AIBuilderSession,
        activities_by_day: Dict[int, List[Dict[str, Any]]],
        activity_id_map: Dict[str, str]
    ) -> Optional[Dict[str, Any]]:
        """
        Get LLM-generated template structure in exact TemplateCreate schema format.

        The output directly matches the database schema for:
        - templates table: description, approximate_price
        - template_days table: day_number, title, notes
        - template_day_activities table: activity_id, item_type, custom_title,
          custom_payload, custom_icon, display_order, time_slot, custom_notes,
          start_time, end_time, is_locked_by_agency
        """
        if not self.client:
            logger.warning("OpenAI client not available, using default structure")
            return None

        try:
            prompt = self._build_template_structure_prompt(session, activities_by_day, activity_id_map)

            completion = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert travel itinerary planner creating data for a travel template database.

Your output must be valid JSON that exactly matches the database schema:
- Template: description, approximate_price
- Days: day_number, title, notes, activities[]
- Activities: activity_id, item_type, custom_title, custom_payload, custom_icon, display_order, time_slot, custom_notes, start_time, end_time, is_locked_by_agency

CRITICAL RULES:
1. Use EXACT activity_id values provided - never invent IDs
2. item_type must be "LIBRARY_ACTIVITY", "LOGISTICS", or "NOTE"
3. custom_payload must be a JSON STRING (with escaped quotes)
4. Reply ONLY with valid JSON - no markdown code blocks, no explanations"""
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
