"""
AI Parser Service

Parses raw trip content and generates enriched activity data matching the Activity model.
Uses OpenAI GPT-4o-mini for intelligent extraction and enrichment.
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
    """Parses raw trip content and generates enriched activity data"""

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

    def _try_parse_json(self, text: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Robust JSON parse with repair attempts."""
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}")
            logger.error(f"Response was: {text[:500]}")

        # Attempt to trim trailing junk
        last_brace = max(text.rfind("}"), text.rfind("]"))
        if last_brace != -1:
            try:
                parsed = json.loads(text[: last_brace + 1])
                logger.warning(f"[AI Builder] Recovered by trimming malformed JSON tail for session {session_id}")
                return parsed
            except Exception:
                pass

        # Attempt to extract "days": [...] block
        try:
            start = text.find('"days"')
            if start != -1:
                bracket = text.find("[", start)
                if bracket != -1:
                    depth = 0
                    end = bracket
                    while end < len(text):
                        if text[end] == "[":
                            depth += 1
                        elif text[end] == "]":
                            depth -= 1
                            if depth == 0:
                                break
                        end += 1
                    if depth == 0:
                        days_block = text[bracket : end + 1]
                        parsed = {"days": json.loads(days_block)}
                        logger.warning(f"[AI Builder] Recovered days block only for session {session_id}")
                        return parsed
        except Exception as e:
            logger.error(f"[AI Builder] Failed to salvage days block: {e}")

        return None

    def _build_enrichment_prompt(
        self,
        raw_content: str,
        destination: Optional[str] = None,
        num_days: Optional[int] = None,
        activity_types: Optional[List[Dict[str, str]]] = None,
        chunk_label: Optional[str] = None
    ) -> str:
        """Build the OpenAI prompt for activity enrichment"""
        # Truncate overly long content to reduce token/cost risk
        MAX_INPUT_CHARS = 12000
        truncated = False
        if raw_content and len(raw_content) > MAX_INPUT_CHARS:
            raw_content = raw_content[:MAX_INPUT_CHARS]
            truncated = True
            logger.info(f"[AI Builder] Raw content truncated to {MAX_INPUT_CHARS} chars for prompt")

        hints = []
        if destination:
            hints.append(f"Destination: {destination}")
        if num_days:
            hints.append(f"Expected number of days: {num_days}")

        if chunk_label:
            hints.append(chunk_label)
        hint_text = "\n".join(hints) if hints else "No additional hints provided."

        # Build activity types list for the prompt
        if activity_types:
            types_text = "\n".join([f"- {t.get('id')}: {t.get('name')}" for t in activity_types if t.get("id")])
        else:
            types_text = "Stay, Meal, Experience, Transfer, Other"

        prompt = f"""You are a travel activity enrichment AI. Your job is to:
1. Parse the trip content and identify individual activities
2. Generate RICH, COMPLETE activity data for each one (as if creating a professional travel catalog)

## Activity Types Available:
{types_text}

## For EACH activity, generate these fields:

### Required Fields:
- **name**: Clear, professional activity name (e.g., "Colosseum Guided Tour with Skip-the-Line Access")
- **activity_type_id**: USE AN ID FROM THE LIST ABOVE (do NOT invent or leave blank). If you cannot determine, pick the closest type ID.
- **category_label**: Subcategory like "sightseeing", "fine_dining", "airport_transfer", "boutique_hotel"
- **location_display**: Full location (e.g., "Trastevere, Rome, Italy")

### Descriptions (IMPORTANT - write these professionally):
- **short_description**: 1-2 sentences for preview cards. Engaging, informative.
- **client_description**: Full 3-5 sentence paragraph for the client-facing itinerary. Include what they'll experience, why it's special, practical tips.

### Duration & Timing:
- **duration_value**: Number (e.g., 90)
- **duration_unit**: "minutes", "hours", or "days"
- **optimal_time_of_day**: "morning", "afternoon", "evening", "night", or "flexible"

### Cost Information (infer from context or use reasonable estimates):
- **cost_type**: "included" (part of package) or "extra" (additional cost)
- **cost_display**: Human-readable like "From €45 per person" or "Included in package"
- **price_numeric**: Just the number, or null if included
- **currency_code**: "EUR", "USD", "INR" etc.

### Tags & Highlights:
- **highlights**: Array of 3-5 key highlights (e.g., ["Skip-the-line access", "Expert local guide", "Small group max 15"])
- **tags**: Array of descriptive tags (e.g., ["Family-friendly", "Cultural", "Must-see", "Walking tour"])
- **vibe_tags**: Array of experience vibes (e.g., ["cultural", "adventure", "luxury", "romantic", "family"])

### Additional:
- **group_size_label**: "Private", "Small group", "Shared", or specific like "Max 12 people"
- **marketing_badge**: Optional special badge like "Popular", "Best Seller", "Hidden Gem", "New"
- **rating**: Estimated rating 1.0-5.0 based on quality/popularity (be realistic)

## Input Context:
{hint_text}

## Raw Trip Content{(' (TRUNCATED)' if truncated else '')}:
{raw_content}

## Response Format (ONLY valid JSON, no markdown):
{{
  "trip_title": "Suggested professional trip title",
  "destination": "Primary destination",
  "detected_days": <number>,
  "summary": {{
    "total_activities": <count>,
    "stays": <count>,
    "meals": <count>,
    "experiences": <count>,
    "transfers": <count>
  }},
  "days": [
    {{
      "day_number": 1,
      "day_title": "Thematic title for this day",
      "activities": [
        {{
          "name": "Activity name",
          "activity_type": "Type from list",
          "category_label": "subcategory",
          "location_display": "Full location",
          "short_description": "1-2 engaging sentences",
          "client_description": "Full 3-5 sentence paragraph for clients",
          "duration_value": 90,
          "duration_unit": "minutes",
          "optimal_time_of_day": "morning",
          "cost_type": "included",
          "cost_display": "Included in package",
          "price_numeric": null,
          "currency_code": "EUR",
          "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
          "tags": ["Tag1", "Tag2"],
          "vibe_tags": ["cultural", "adventure"],
          "group_size_label": "Private",
          "marketing_badge": null,
          "rating": 4.5
        }}
      ]
    }}
  ]
}}

IMPORTANT:
- Write descriptions as a professional travel writer would
- Be specific about locations (neighborhood, city, country)
- Generate realistic, useful highlights and tags
- Infer reasonable durations and costs from context
- Every activity should feel ready for a luxury travel catalog"""
        return prompt

    def parse_trip_content(
        self,
        session: AIBuilderSession,
        db: Session
    ) -> bool:
        """
        Parse raw trip content and create enriched draft activities.

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
            logger.info(f"[AI Builder] Parsing session {session.id} (agency={session.agency_id})")
            # Step 1: Reading content
            session.current_step = 1
            db.commit()

            # Get activity types for this agency
            activity_types = db.query(ActivityType).filter(
                ActivityType.agency_id == session.agency_id
            ).all()
            # Build a mapping for both names and IDs
            type_mapping = {at.name.lower(): at.id for at in activity_types}
            type_mapping.update({at.id: at.id for at in activity_types})
            type_payload = [{"id": at.id, "name": at.name} for at in activity_types]

            # Chunk content to avoid oversized prompts
            def chunk_content(text: str, max_chars: int = 6000, max_chunks: int = 3) -> List[str]:
                if not text:
                    return []
                chunks = []
                start = 0
                while start < len(text) and len(chunks) < max_chunks:
                    end = min(start + max_chars, len(text))
                    chunk = text[start:end]
                    chunks.append(chunk)
                    start = end
                return chunks

            chunks = chunk_content(session.raw_content, max_chars=6000, max_chunks=3)
            if not chunks:
                session.status = AISessionStatus.failed
                session.error_message = "No content provided."
                db.commit()
                return False

            all_days: List[Dict[str, Any]] = []
            aggregated_summary: Dict[str, Any] = {"total_activities": 0, "stays": 0, "meals": 0, "experiences": 0, "transfers": 0}

            for idx, chunk in enumerate(chunks):
                chunk_label = f"Chunk {idx + 1}/{len(chunks)}"

                # Build enrichment prompt
                prompt = self._build_enrichment_prompt(
                    raw_content=chunk,
                    destination=session.destination,
                    num_days=session.num_days,
                    activity_types=type_payload,
                    chunk_label=chunk_label
                )

                # Step 2: AI Processing
                session.current_step = 2
                db.commit()

                # Call OpenAI for enrichment
                completion = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": """You are a professional travel content writer and itinerary parser.
Your task is to extract activities from trip content and enrich them with professional descriptions,
highlights, and metadata suitable for a luxury travel agency's catalog.
Reply ONLY with valid JSON. No markdown code blocks, no explanations."""
                        },
                        {"role": "user", "content": prompt}
                    ],
                temperature=0.4,
                max_tokens=4000,  # Raised to reduce truncation risk
                response_format={"type": "json_object"}
            )

                response_text = completion.choices[0].message.content if completion.choices else ""

                # Clean response (remove markdown code blocks if present)
                response_text = response_text.strip()
                if response_text.startswith("```"):
                    response_text = response_text.split("```")[1]
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                    response_text = response_text.strip()

                # Step 3: Parsing response
                session.current_step = 3
                db.commit()

                # Parse JSON response with repair fallback
                parsed_data = self._try_parse_json(response_text, session.id)
                if not parsed_data:
                    session.status = AISessionStatus.failed
                    session.error_message = "Failed to parse trip content. Please try again with clearer input."
                    db.commit()
                    logger.error(f"[AI Builder] JSON parse failed for session {session.id}")
                    return False

                # Step 4: Creating draft activities
                session.current_step = 4
                db.commit()

                # Update session with parsed info (aggregate)
                if not session.trip_title and parsed_data.get("trip_title"):
                    session.trip_title = parsed_data["trip_title"]
                if not session.destination and parsed_data.get("destination"):
                    session.destination = parsed_data["destination"]

                chunk_summary = parsed_data.get("summary", {})
                for key in aggregated_summary.keys():
                    if key in chunk_summary and isinstance(chunk_summary[key], (int, float)):
                        aggregated_summary[key] = aggregated_summary.get(key, 0) + chunk_summary[key]

                # Collect days
                days = parsed_data.get("days", [])
                if not days:
                    continue
                all_days.extend(days)

            if not all_days:
                session.status = AISessionStatus.failed
                session.error_message = "Could not detect any activities from the content."
                db.commit()
                return False

            # Step 5: Saving drafts
            session.current_step = 5
            db.commit()

            # Set detected days and summary from aggregated data
            max_day = max(day.get("day_number", 0) for day in all_days)
            session.detected_days = max_day or len(all_days)
            session.parsed_summary = aggregated_summary

            # Create draft activities with all enriched fields
            for day_data in all_days:
                day_number = day_data.get("day_number", 1)
                day_title = day_data.get("day_title")
                activities = day_data.get("activities", [])

                for idx, act_data in enumerate(activities):
                    # Map activity type
                    act_type_name = act_data.get("activity_type", "Other")
                    # Allow either explicit ID or name
                    activity_type_id = None
                    raw_type = act_data.get("activity_type_id") or act_type_name
                    if raw_type:
                        raw_type_str = str(raw_type)
                        # Exact ID match
                        if raw_type_str in type_mapping:
                            activity_type_id = type_mapping[raw_type_str]
                        else:
                            # Try lowercased name lookup
                            activity_type_id = type_mapping.get(raw_type_str.lower())

                    # Determine duration unit with normalization (map night/nights to days)
                    duration_unit = act_data.get("duration_unit", "minutes")
                    if duration_unit:
                        unit_lower = str(duration_unit).lower()
                        if unit_lower in ["night", "nights"]:
                            duration_unit = "days"
                        elif unit_lower not in ["minutes", "hours", "days"]:
                            duration_unit = "minutes"

                    draft = AIBuilderDraftActivity(
                        session_id=session.id,
                        day_number=day_number,
                        order_index=idx,
                        day_title=day_title,
                        # Core fields
                        name=act_data.get("name", "Unnamed Activity"),
                        activity_type_id=activity_type_id,
                        category_label=act_data.get("category_label"),
                        location_display=act_data.get("location_display"),
                        # Descriptions
                        short_description=act_data.get("short_description"),
                        client_description=act_data.get("client_description"),
                        # Duration
                        default_duration_value=act_data.get("duration_value"),
                        default_duration_unit=duration_unit,
                        optimal_time_of_day=act_data.get("optimal_time_of_day"),
                        # Cost
                        cost_type=act_data.get("cost_type", "included"),
                        cost_display=act_data.get("cost_display"),
                        price_numeric=act_data.get("price_numeric"),
                        currency_code=act_data.get("currency_code", "INR"),
                        # Tags & Highlights
                        highlights=act_data.get("highlights"),
                        tags=act_data.get("tags"),
                        vibe_tags=act_data.get("vibe_tags"),
                        # Meta
                        group_size_label=act_data.get("group_size_label"),
                        marketing_badge=act_data.get("marketing_badge"),
                        rating=act_data.get("rating"),
                    )
                    db.add(draft)

            # Mark parsing complete (matching will happen next)
            db.commit()

            logger.info(f"[AI Builder] Parsed session {session.id}: days={session.detected_days}, drafts={len(all_days)}")
            return True

        except Exception as e:
            logger.exception(f"Error parsing trip content: {e}")
            session.status = AISessionStatus.failed
            session.error_message = f"An error occurred while parsing: {str(e)}"
            db.commit()
            return False


# Singleton instance
_parser_service = None


def get_parser_service() -> AIParserService:
    """Get or create parser service singleton"""
    global _parser_service
    if _parser_service is None:
        _parser_service = AIParserService()
    return _parser_service
