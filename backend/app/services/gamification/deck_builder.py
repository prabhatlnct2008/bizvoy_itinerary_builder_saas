"""
Deck Builder Service
Builds personalized activity decks based on vibes and constraints.
"""
from typing import List, Dict, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.activity import Activity
from app.models.personalization_session import PersonalizationSession
from app.models.user_deck_interaction import UserDeckInteraction
from app.models.agency_personalization_settings import AgencyPersonalizationSettings
from app.models.itinerary import Itinerary, ItineraryDayActivity
from decimal import Decimal
import json
import random


class DeckBuilder:
    """Build personalized activity decks"""

    def __init__(self, db: Session):
        self.db = db

    def build_deck(
        self,
        session: PersonalizationSession,
        settings: AgencyPersonalizationSettings
    ) -> List[Activity]:
        """
        Build a personalized deck of activities for a session.

        Args:
            session: The personalization session
            settings: Agency personalization settings

        Returns:
            List of Activity objects
        """
        itinerary = self.db.query(Itinerary).filter(
            Itinerary.id == session.itinerary_id
        ).first()

        if not itinerary:
            return []

        # Get base query
        query = self.db.query(Activity).filter(
            Activity.agency_id == itinerary.agency_id,
            Activity.is_active == True,
            Activity.gamification_readiness_score >= Decimal("0.70")
        )

        # Filter by allowed activity types
        if settings.allowed_activity_type_ids:
            allowed_types = self._parse_json_list(settings.allowed_activity_type_ids)
            if allowed_types:
                query = query.filter(Activity.activity_type_id.in_(allowed_types))

        # Filter by price constraints
        if settings.max_price_per_traveler:
            query = query.filter(
                or_(
                    Activity.price_numeric == None,
                    Activity.price_numeric <= settings.max_price_per_traveler
                )
            )

        # Get all candidates
        candidates = query.all()

        if not candidates:
            return []

        # Filter by selected vibes if any
        selected_vibes = self._parse_json_list(session.selected_vibes)
        if selected_vibes:
            candidates = self._filter_by_vibes(candidates, selected_vibes)

        # Exclude already viewed activities
        viewed_ids = self._get_viewed_activity_ids(session.id)
        candidates = [a for a in candidates if a.id not in viewed_ids]

        # Exclude activities already in the itinerary
        existing_ids = self._get_itinerary_activity_ids(itinerary.id)
        candidates = [a for a in candidates if a.id not in existing_ids]

        # Score and sort activities
        scored_activities = [
            (activity, self._score_activity(activity, selected_vibes, itinerary))
            for activity in candidates
        ]
        scored_activities.sort(key=lambda x: x[1], reverse=True)

        # Take top N activities
        deck_size = min(session.deck_size, len(scored_activities))
        top_activities = [a for a, score in scored_activities[:deck_size]]

        # Ensure variety
        final_deck = self._ensure_variety(top_activities, deck_size)

        return final_deck

    def _score_activity(
        self,
        activity: Activity,
        selected_vibes: List[str],
        itinerary: Itinerary
    ) -> float:
        """
        Score an activity based on various factors.

        Returns:
            Float score (higher is better)
        """
        score = 0.0

        # Base score from readiness
        score += float(activity.gamification_readiness_score) * 30

        # Vibe matching score
        if selected_vibes:
            activity_vibes = self._parse_json_list(activity.vibe_tags)
            matching_vibes = set(selected_vibes) & set(activity_vibes)
            score += len(matching_vibes) * 20

        # Rating boost
        if activity.review_rating:
            score += float(activity.review_rating) * 5

        # Review count boost (social proof)
        if activity.review_count:
            score += min(activity.review_count / 10, 10)

        # Marketing badge boost
        if activity.marketing_badge:
            score += 5

        # Randomness for variety
        score += random.uniform(0, 10)

        return score

    def _filter_by_vibes(
        self,
        activities: List[Activity],
        selected_vibes: List[str]
    ) -> List[Activity]:
        """Filter activities that match at least one selected vibe"""
        filtered = []
        for activity in activities:
            activity_vibes = self._parse_json_list(activity.vibe_tags)
            if any(vibe in activity_vibes for vibe in selected_vibes):
                filtered.append(activity)
        return filtered if filtered else activities  # Fallback to all if none match

    def _get_viewed_activity_ids(self, session_id: str) -> Set[str]:
        """Get IDs of activities already viewed in this session"""
        interactions = self.db.query(UserDeckInteraction).filter(
            UserDeckInteraction.session_id == session_id
        ).all()
        return {i.activity_id for i in interactions}

    def _get_itinerary_activity_ids(self, itinerary_id: str) -> Set[str]:
        """Get IDs of activities already in the itinerary (to exclude from deck)"""
        from app.models.itinerary import ItineraryDay

        # Get all day IDs for this itinerary
        day_ids = self.db.query(ItineraryDay.id).filter(
            ItineraryDay.itinerary_id == itinerary_id
        ).all()
        day_ids = [d[0] for d in day_ids]

        if not day_ids:
            return set()

        # Get all activity_ids from those days (only LIBRARY_ACTIVITY items have activity_id)
        activities = self.db.query(ItineraryDayActivity.activity_id).filter(
            ItineraryDayActivity.itinerary_day_id.in_(day_ids),
            ItineraryDayActivity.activity_id != None
        ).all()

        return {a[0] for a in activities if a[0]}

    def _ensure_variety(
        self,
        activities: List[Activity],
        target_size: int
    ) -> List[Activity]:
        """
        Ensure variety in the deck by avoiding too many of the same type.

        Args:
            activities: List of activities
            target_size: Desired deck size

        Returns:
            Reordered list with variety
        """
        if len(activities) <= target_size:
            return activities

        # Group by activity type
        by_type: Dict[str, List[Activity]] = {}
        for activity in activities:
            type_id = activity.activity_type_id
            if type_id not in by_type:
                by_type[type_id] = []
            by_type[type_id].append(activity)

        # Interleave activities from different types
        result = []
        type_keys = list(by_type.keys())
        type_index = 0

        while len(result) < target_size and any(by_type.values()):
            current_type = type_keys[type_index % len(type_keys)]
            if by_type[current_type]:
                result.append(by_type[current_type].pop(0))
            type_index += 1

        return result[:target_size]

    @staticmethod
    def _parse_json_list(field) -> List:
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
