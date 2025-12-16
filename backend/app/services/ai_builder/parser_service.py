"""
AI Parser Service

Parses raw trip content into structured activities using OpenAI.
"""
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_builder import AIBuilderSession, AIBuilderDraftActivity, AISessionStatus
from app.models.activity_type import ActivityType

logger = logging.getLogger(__name__)


class AIParserService:
    """Parses raw trip content into structured activities using OpenAI"""

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

    def _build_prompt(
        self,
        raw_content: str,
        destination: Optional[str] = None,
        num_days: Optional[int] = None
    ) -> str:
        """Build the OpenAI prompt for trip parsing"""
        hints = []
        if destination:
            hints.append(f"Destination: {destination}")
        if num_days:
            hints.append(f"Expected number of days: {num_days}")

        hint_text = "\n".join(hints) if hints else "No additional hints provided."

        prompt = f"""You are a travel itinerary parser. Extract structured activities from the following trip description.

## Rules:
1. Identify day markers (Day 1, Day 2, dates, or sequential patterns)
2. For each day, extract all activities, stays, meals, and transfers
3. Classify each item into one of these types:
   - "Stay" - Hotels, accommodations, resorts, guesthouses
   - "Breakfast" - Morning meals
   - "Lunch" - Midday meals
   - "Dinner" - Evening meals
   - "Local Experience" - Cultural activities, tours, sightseeing
   - "Outdoor Sports" - Adventure activities, water sports, trekking
   - "Transfer" - Airport pickup, car rental, taxi, train, flight
   - "Other" - Anything that doesn't fit above

4. Extract for each activity:
   - name: A clear, concise name
   - type: One of the types above
   - location: Where it takes place (if mentioned)
   - description: Brief description (1-2 sentences)
   - duration_value: Estimated duration number
   - duration_unit: "minutes" or "hours"
   - estimated_price: Price if mentioned (just the number)

5. Return ONLY valid JSON, no markdown or explanation.

## Hints:
{hint_text}

## Trip Content:
{raw_content}

## Response Format:
{{
  "trip_title": "Suggested title for the trip",
  "detected_days": <number of days detected>,
  "summary": {{
    "stays": <count>,
    "meals": <count>,
    "experiences": <count>,
    "transfers": <count>
  }},
  "days": [
    {{
      "day_number": 1,
      "day_title": "Day theme/title",
      "activities": [
        {{
          "name": "Activity name",
          "type": "Stay|Breakfast|Lunch|Dinner|Local Experience|Outdoor Sports|Transfer|Other",
          "location": "Location or null",
          "description": "Brief description",
          "duration_value": 60,
          "duration_unit": "minutes",
          "estimated_price": null
        }}
      ]
    }}
  ]
}}"""
        return prompt

    def parse_trip_content(
        self,
        session: AIBuilderSession,
        db: Session
    ) -> bool:
        """
        Parse raw trip content and create draft activities.

        Args:
            session: The AI builder session to process
            db: Database session

        Returns:
            True if successful, False otherwise
        """
        if not self.client:
            session.status = AISessionStatus.failed
            session.error_message = "AI service not available. Please try again later."
            db.commit()
            return False

        try:
            # Step 1: Reading content
            session.current_step = 1
            db.commit()

            # Build prompt
            prompt = self._build_prompt(
                raw_content=session.raw_content,
                destination=session.destination,
                num_days=session.num_days
            )

            # Step 2: Detecting days & dates
            session.current_step = 2
            db.commit()

            # Call OpenAI
            completion = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a travel itinerary parser. Reply ONLY with valid JSON. No markdown code blocks, no explanations."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=4000
            )

            response_text = completion.choices[0].message.content if completion.choices else ""

            # Clean response (remove markdown code blocks if present)
            response_text = response_text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            # Step 3: Finding stays, meals & experiences
            session.current_step = 3
            db.commit()

            # Parse JSON response
            try:
                parsed_data = json.loads(response_text)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response: {e}")
                logger.error(f"Response was: {response_text[:500]}")
                session.status = AISessionStatus.failed
                session.error_message = "Failed to parse trip content. Please try again with clearer input."
                db.commit()
                return False

            # Step 4: Grouping by day
            session.current_step = 4
            db.commit()

            # Update session with parsed info
            session.detected_days = parsed_data.get("detected_days", len(parsed_data.get("days", [])))
            session.parsed_summary = parsed_data.get("summary", {})

            if not session.trip_title and parsed_data.get("trip_title"):
                session.trip_title = parsed_data["trip_title"]

            # Get activity types for mapping
            activity_types = self._get_activity_type_mapping(session.agency_id, db)

            # Step 5: Drafting activity cards
            session.current_step = 5
            db.commit()

            # Create draft activities
            days = parsed_data.get("days", [])
            if not days:
                session.status = AISessionStatus.failed
                session.error_message = "Could not detect any activities from the content."
                db.commit()
                return False

            for day_data in days:
                day_number = day_data.get("day_number", 1)
                day_title = day_data.get("day_title")
                activities = day_data.get("activities", [])

                for idx, act_data in enumerate(activities):
                    # Map activity type
                    act_type = act_data.get("type", "Other")
                    activity_type_id = activity_types.get(act_type)

                    # Determine duration unit
                    duration_unit = act_data.get("duration_unit", "minutes")
                    if duration_unit not in ["minutes", "hours", "days"]:
                        duration_unit = "minutes"

                    draft = AIBuilderDraftActivity(
                        session_id=session.id,
                        day_number=day_number,
                        order_index=idx,
                        day_title=day_title,
                        name=act_data.get("name", "Unnamed Activity"),
                        activity_type_id=activity_type_id,
                        location_display=act_data.get("location"),
                        short_description=act_data.get("description"),
                        default_duration_value=act_data.get("duration_value"),
                        default_duration_unit=duration_unit,
                        estimated_price=act_data.get("estimated_price"),
                        currency_code="INR"
                    )
                    db.add(draft)

            # Mark session as completed
            session.status = AISessionStatus.completed
            session.completed_at = datetime.utcnow()
            db.commit()

            logger.info(f"Successfully parsed session {session.id} with {session.detected_days} days")
            return True

        except Exception as e:
            logger.exception(f"Error parsing trip content: {e}")
            session.status = AISessionStatus.failed
            session.error_message = f"An error occurred while parsing: {str(e)}"
            db.commit()
            return False

    def _get_activity_type_mapping(self, agency_id: str, db: Session) -> Dict[str, str]:
        """Get mapping of activity type names to IDs"""
        activity_types = db.query(ActivityType).filter(
            ActivityType.agency_id == agency_id
        ).all()

        # Create mapping with common aliases
        mapping = {}
        for at in activity_types:
            mapping[at.name] = at.id
            mapping[at.name.lower()] = at.id

        # Add common aliases
        alias_mapping = {
            "Stay": ["Hotel", "Accommodation", "Resort", "Guesthouse", "Lodge"],
            "Meal": ["Breakfast", "Lunch", "Dinner", "Brunch"],
            "Experience": ["Local Experience", "Tour", "Sightseeing", "Cultural"],
            "Transfer": ["Transport", "Transportation", "Pickup", "Drop-off"],
            "Other": ["Miscellaneous", "General"]
        }

        for canonical, aliases in alias_mapping.items():
            if canonical in mapping:
                for alias in aliases:
                    if alias not in mapping:
                        mapping[alias] = mapping[canonical]
                    if alias.lower() not in mapping:
                        mapping[alias.lower()] = mapping[canonical]

        # Handle specific meal types to Meal
        if "Meal" in mapping:
            for meal_type in ["Breakfast", "Lunch", "Dinner", "Brunch"]:
                if meal_type not in mapping:
                    mapping[meal_type] = mapping["Meal"]
                if meal_type.lower() not in mapping:
                    mapping[meal_type.lower()] = mapping["Meal"]

        # Handle Local Experience and Outdoor Sports to Experience
        if "Experience" in mapping:
            for exp_type in ["Local Experience", "Outdoor Sports", "Adventure"]:
                if exp_type not in mapping:
                    mapping[exp_type] = mapping["Experience"]
                if exp_type.lower() not in mapping:
                    mapping[exp_type.lower()] = mapping["Experience"]

        return mapping


# Singleton instance
_parser_service = None


def get_parser_service() -> AIParserService:
    """Get or create parser service singleton"""
    global _parser_service
    if _parser_service is None:
        _parser_service = AIParserService()
    return _parser_service
