import json
from typing import List, Dict, Optional

from openai import OpenAI

from app.core.config import settings
from app.models.itinerary import ItineraryDay
from app.models.activity import Activity
from app.models.itinerary_cart_item import ItineraryCartItem


def _safe_openai_client() -> Optional[OpenAI]:
    """Instantiate OpenAI client if key is present."""
    api_key = getattr(settings, "OPENAI_API_KEY", None)
    if not api_key:
        return None
    try:
        return OpenAI(api_key=api_key)
    except Exception:
        return None


def _build_prompt(itinerary_days: List[ItineraryDay], activities: List[Activity]) -> str:
    """Create a compact JSON instruction for the LLM."""
    days_json = [
        {
            "day_number": d.day_number,
            "date": d.actual_date.isoformat(),
        }
        for d in itinerary_days
    ]

    activities_json = []
    for act in activities:
        activities_json.append(
            {
                "id": act.id,
                "name": act.name,
                "type": act.activity_type.name if act.activity_type else None,
                "category": act.category_label,
                "duration_hours": act.default_duration_value if act.default_duration_unit == "hours" else None,
                "meal_hint": act.category_label.lower() if act.category_label else "",
            }
        )

    prompt = {
        "instruction": "Distribute activities across days. Keep meals in order (breakfast < brunch < lunch < dinner). Prefer earlier meals earlier in the day. Avoid overfilling a day: max 3 items/day. Use provided day numbers only.",
        "days": days_json,
        "activities": activities_json,
        "response_schema": {
            "assignments": [
                {"activity_id": "string", "day_number": "int", "time_slot": "morning|afternoon|evening|flex"}
            ],
            "missed": ["activity_id"],
            "notes": ["string"],
        },
    }
    return json.dumps(prompt)


def propose_schedule(
    itinerary_days: List[ItineraryDay],
    cart_items: List[ItineraryCartItem],
    activities_by_id: Dict[str, Activity],
) -> Optional[Dict]:
    """
    Call OpenAI to propose a distribution of activities to days.
    Returns a dict with assignments/missed or None on failure.
    """
    client = _safe_openai_client()
    if not client:
        return None

    liked_activities = [activities_by_id.get(ci.activity_id) for ci in cart_items]
    liked_activities = [a for a in liked_activities if a]
    if not liked_activities:
        return None

    prompt = _build_prompt(itinerary_days, liked_activities)

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a travel scheduler. Reply ONLY with JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )
        content = completion.choices[0].message.content if completion.choices else ""
        return json.loads(content)
    except Exception:
        return None
