"""
Reuse Matcher Service

Finds similar existing activities for reuse suggestions.
"""
import logging
from typing import List, Dict, Optional
from difflib import SequenceMatcher

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.ai_builder import AIBuilderSession, AIBuilderDraftActivity
from app.models.activity import Activity
from app.services.search_service import search_service

logger = logging.getLogger(__name__)


class ReuseMatcherService:
    """Finds similar existing activities for reuse suggestions"""

    def __init__(self):
        self.search_service = search_service

    def find_matches_for_session(
        self,
        session: AIBuilderSession,
        db: Session
    ) -> int:
        """
        Find matching activities for all draft activities in a session.

        Args:
            session: The AI builder session
            db: Database session

        Returns:
            Number of drafts with matches found
        """
        drafts = db.query(AIBuilderDraftActivity).filter(
            AIBuilderDraftActivity.session_id == session.id
        ).all()

        match_count = 0
        for draft in drafts:
            match = self.find_best_match(draft, session.agency_id, db)
            if match:
                draft.matched_activity_id = match["activity_id"]
                draft.match_score = match["score"]
                match_count += 1

        db.commit()
        return match_count

    def find_best_match(
        self,
        draft: AIBuilderDraftActivity,
        agency_id: str,
        db: Session
    ) -> Optional[Dict]:
        """
        Find the best matching existing activity for a draft.

        Args:
            draft: The draft activity to match
            agency_id: The agency ID
            db: Database session

        Returns:
            Dict with activity_id and score, or None if no good match
        """
        candidates = []

        # Strategy 1: Exact name match
        exact_match = db.query(Activity).filter(
            Activity.agency_id == agency_id,
            Activity.is_active == True,
            func.lower(Activity.name) == func.lower(draft.name)
        ).first()

        if exact_match:
            return {
                "activity_id": exact_match.id,
                "activity_name": exact_match.name,
                "score": 1.0
            }

        # Strategy 2: Fuzzy name match on all activities
        activities = db.query(Activity).filter(
            Activity.agency_id == agency_id,
            Activity.is_active == True
        ).all()

        for activity in activities:
            score = self._calculate_match_score(draft, activity)
            if score >= 0.5:  # Minimum threshold
                candidates.append({
                    "activity_id": activity.id,
                    "activity_name": activity.name,
                    "score": score
                })

        # Strategy 3: Semantic search (if available and no good fuzzy matches)
        if not candidates or max(c["score"] for c in candidates) < 0.7:
            search_query = f"{draft.name} {draft.location_display or ''} {draft.short_description or ''}".strip()
            semantic_results = self.search_service.search_activities(
                agency_id=agency_id,
                query=search_query,
                limit=5,
                db=db
            )

            for result in semantic_results:
                if "activity" in result:
                    activity = result["activity"]
                    semantic_score = result.get("similarity_score", 0)

                    # Combine semantic score with other factors
                    combined_score = self._calculate_combined_score(
                        draft, activity, semantic_score
                    )

                    # Check if this activity is already in candidates
                    existing = next(
                        (c for c in candidates if c["activity_id"] == activity.id),
                        None
                    )

                    if existing:
                        # Update score if combined is better
                        existing["score"] = max(existing["score"], combined_score)
                    else:
                        candidates.append({
                            "activity_id": activity.id,
                            "activity_name": activity.name,
                            "score": combined_score
                        })

        if not candidates:
            return None

        # Return the best match
        best = max(candidates, key=lambda x: x["score"])
        return best if best["score"] >= 0.5 else None

    def _calculate_match_score(
        self,
        draft: AIBuilderDraftActivity,
        activity: Activity
    ) -> float:
        """
        Calculate match score between draft and existing activity.

        Factors:
        - Name similarity (fuzzy match) - 60% weight
        - Same activity type - 15% weight
        - Location similarity - 15% weight
        - Duration similarity - 10% weight
        """
        score = 0.0

        # Name similarity (60% weight)
        name_similarity = SequenceMatcher(
            None,
            draft.name.lower(),
            activity.name.lower()
        ).ratio()
        score += name_similarity * 0.6

        # Activity type match (15% weight)
        if draft.activity_type_id and activity.activity_type_id:
            if draft.activity_type_id == activity.activity_type_id:
                score += 0.15

        # Location similarity (15% weight)
        if draft.location_display and activity.location_display:
            location_similarity = SequenceMatcher(
                None,
                draft.location_display.lower(),
                activity.location_display.lower()
            ).ratio()
            score += location_similarity * 0.15
        elif not draft.location_display and not activity.location_display:
            # Both have no location - slight bonus
            score += 0.05

        # Duration similarity (10% weight)
        if draft.default_duration_value and activity.default_duration_value:
            # Normalize durations to minutes for comparison
            draft_mins = self._normalize_to_minutes(
                draft.default_duration_value,
                draft.default_duration_unit
            )
            activity_mins = self._normalize_to_minutes(
                activity.default_duration_value,
                activity.default_duration_unit.value if activity.default_duration_unit else "minutes"
            )

            if draft_mins > 0 and activity_mins > 0:
                # Calculate similarity (closer durations = higher score)
                duration_ratio = min(draft_mins, activity_mins) / max(draft_mins, activity_mins)
                score += duration_ratio * 0.1

        return min(score, 1.0)

    def _calculate_combined_score(
        self,
        draft: AIBuilderDraftActivity,
        activity: Activity,
        semantic_score: float
    ) -> float:
        """
        Combine semantic search score with other factors.

        Args:
            draft: Draft activity
            activity: Existing activity
            semantic_score: Semantic similarity score (0-1)

        Returns:
            Combined score (0-1)
        """
        # Base score from semantic search (50% weight)
        score = semantic_score * 0.5

        # Name similarity bonus (30% weight)
        name_similarity = SequenceMatcher(
            None,
            draft.name.lower(),
            activity.name.lower()
        ).ratio()
        score += name_similarity * 0.3

        # Activity type match bonus (10% weight)
        if draft.activity_type_id and activity.activity_type_id:
            if draft.activity_type_id == activity.activity_type_id:
                score += 0.1

        # Location match bonus (10% weight)
        if draft.location_display and activity.location_display:
            location_similarity = SequenceMatcher(
                None,
                draft.location_display.lower(),
                activity.location_display.lower()
            ).ratio()
            score += location_similarity * 0.1

        return min(score, 1.0)

    def _normalize_to_minutes(self, value: int, unit: str) -> int:
        """Convert duration to minutes"""
        if not value:
            return 0

        unit = unit.lower() if unit else "minutes"

        if unit == "minutes":
            return value
        elif unit == "hours":
            return value * 60
        elif unit == "days":
            return value * 60 * 24
        elif unit == "nights":
            return value * 60 * 24
        else:
            return value


# Singleton instance
_matcher_service = None


def get_matcher_service() -> ReuseMatcherService:
    """Get or create matcher service singleton"""
    global _matcher_service
    if _matcher_service is None:
        _matcher_service = ReuseMatcherService()
    return _matcher_service
