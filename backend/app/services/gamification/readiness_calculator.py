"""
Readiness Calculator for Gamification
Calculates how ready an activity is for the gamified discovery engine.
"""
from typing import List, Dict, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.activity import Activity
import json


class ReadinessCalculator:
    """Calculate gamification readiness scores for activities"""

    # Weights for each criterion (must sum to 1.0)
    WEIGHTS = {
        "has_price": 0.15,
        "has_location": 0.10,
        "has_description": 0.15,
        "has_images": 0.20,
        "has_vibes": 0.15,
        "has_time_info": 0.10,
        "has_highlights": 0.10,
        "has_coordinates": 0.05,
    }

    @classmethod
    def calculate_score(cls, activity: Activity) -> Tuple[Decimal, List[str]]:
        """
        Calculate readiness score and return issues.

        Returns:
            Tuple of (score, issues_list)
        """
        score = Decimal("0.0")
        issues = []

        # Check price
        if activity.price_numeric and activity.price_numeric > 0:
            score += Decimal(str(cls.WEIGHTS["has_price"]))
        else:
            issues.append("Missing numeric price")

        # Check location
        if activity.location_display:
            score += Decimal(str(cls.WEIGHTS["has_location"]))
        else:
            issues.append("Missing location display")

        # Check description
        if activity.client_description and len(activity.client_description) > 50:
            score += Decimal(str(cls.WEIGHTS["has_description"]))
        else:
            issues.append("Missing or insufficient client description")

        # Check images
        if hasattr(activity, 'images') and len(activity.images) > 0:
            score += Decimal(str(cls.WEIGHTS["has_images"]))
        else:
            issues.append("No images uploaded")

        # Check vibe tags
        vibe_tags = cls._parse_json_field(activity.vibe_tags)
        if vibe_tags and len(vibe_tags) > 0:
            score += Decimal(str(cls.WEIGHTS["has_vibes"]))
        else:
            issues.append("No vibe tags assigned")

        # Check time info
        if activity.optimal_time_of_day:
            score += Decimal(str(cls.WEIGHTS["has_time_info"]))
        else:
            issues.append("Missing optimal time of day")

        # Check highlights
        highlights = cls._parse_json_field(activity.highlights)
        if highlights and len(highlights) >= 2:
            score += Decimal(str(cls.WEIGHTS["has_highlights"]))
        else:
            issues.append("Insufficient highlights (need at least 2)")

        # Check coordinates
        if activity.latitude and activity.longitude:
            score += Decimal(str(cls.WEIGHTS["has_coordinates"]))
        else:
            issues.append("Missing GPS coordinates")

        # Round to 2 decimal places
        score = score.quantize(Decimal("0.01"))

        return score, issues

    @classmethod
    def batch_calculate(cls, db: Session, agency_id: str) -> Dict[str, int]:
        """
        Calculate readiness for all activities in an agency and update them.

        Returns:
            Dictionary with stats: {ready: count, not_ready: count, total: count}
        """
        activities = db.query(Activity).filter(
            Activity.agency_id == agency_id,
            Activity.is_active == True
        ).all()

        ready_count = 0
        not_ready_count = 0

        for activity in activities:
            score, issues = cls.calculate_score(activity)
            activity.gamification_readiness_score = score
            activity.gamification_readiness_issues = json.dumps(issues) if issues else None

            if score >= Decimal("0.70"):
                ready_count += 1
            else:
                not_ready_count += 1

        db.commit()

        return {
            "ready": ready_count,
            "not_ready": not_ready_count,
            "total": len(activities)
        }

    @staticmethod
    def _parse_json_field(field) -> List:
        """Parse a JSON field that might be a string or list"""
        if not field:
            return []
        if isinstance(field, list):
            return field
        if isinstance(field, str):
            try:
                return json.loads(field)
            except (json.JSONDecodeError, TypeError):
                return []
        return []
