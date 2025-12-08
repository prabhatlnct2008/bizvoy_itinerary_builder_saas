"""Analytics service for gamification features"""
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta


class AnalyticsService:
    """Service for gamification analytics"""

    def __init__(self, db: Session):
        self.db = db

    def get_itinerary_analytics(self, itinerary_id: str) -> Dict:
        """
        Return analytics for a specific itinerary:
        - total_sessions, completed_sessions, confirmed_sessions, abandoned_sessions
        - completion_rate, confirmation_rate
        - avg_cards_liked, avg_time_seconds
        - total_revenue_added
        - most_liked_activities: top 5 with like count
        - most_passed_activities: top 5 with pass count
        - vibe_popularity: breakdown by vibe selection

        Args:
            itinerary_id: The ID of the itinerary

        Returns:
            Dictionary containing analytics data
        """
        # TODO: Implement with actual database queries when models are ready
        # This is a placeholder implementation that returns mock structure

        # Mock data structure for development
        analytics = {
            "itinerary_id": itinerary_id,
            "total_sessions": 0,
            "completed_sessions": 0,
            "confirmed_sessions": 0,
            "abandoned_sessions": 0,
            "completion_rate": 0.0,
            "confirmation_rate": 0.0,
            "avg_cards_liked": 0.0,
            "avg_time_seconds": 0.0,
            "total_revenue_added": 0.0,
            "most_liked_activities": [],
            "most_passed_activities": [],
            "vibe_popularity": {},
            "sessions_over_time": []
        }

        return analytics

    def get_agency_analytics(self, agency_id: str) -> Dict:
        """
        Return aggregate analytics for the entire agency:
        - Total sessions across all itineraries
        - Overall completion/confirmation rates
        - Total revenue added via personalization
        - Game-ready activity percentage
        - Top performing activities

        Args:
            agency_id: The ID of the agency

        Returns:
            Dictionary containing aggregate analytics data
        """
        # TODO: Implement with actual database queries when models are ready
        # This is a placeholder implementation that returns mock structure

        analytics = {
            "agency_id": agency_id,
            "total_sessions": 0,
            "total_itineraries": 0,
            "completion_rate": 0.0,
            "confirmation_rate": 0.0,
            "total_revenue_added": 0.0,
            "game_ready_percentage": 0.0,
            "total_activities": 0,
            "game_ready_activities": 0,
            "top_performing_activities": [],
            "vibe_distribution": {},
            "sessions_over_time": [],
            "revenue_over_time": []
        }

        return analytics

    def get_activity_gamification_status(self, agency_id: str) -> Dict:
        """
        Get gamification readiness status for all activities

        Args:
            agency_id: The ID of the agency

        Returns:
            Dictionary with readiness metrics and issues
        """
        # TODO: Implement with actual database queries

        status = {
            "total_activities": 0,
            "game_ready_count": 0,
            "game_ready_percentage": 0.0,
            "issues": {
                "missing_hero_image": 0,
                "missing_price": 0,
                "missing_vibe_tags": 0,
                "missing_description": 0,
                "missing_location": 0
            },
            "activities_by_readiness": {
                "ready": [],
                "partial": [],
                "not_ready": []
            }
        }

        return status

    def calculate_activity_score(self, activity: Dict) -> int:
        """
        Calculate gamification readiness score for an activity (0-100)

        Args:
            activity: Activity dictionary with gamification fields

        Returns:
            Score from 0-100
        """
        score = 0
        total_checks = 7

        # Required fields (higher weight)
        if activity.get('hero_image_url'):
            score += 20
        if activity.get('price') is not None:
            score += 15
        if activity.get('short_description'):
            score += 15
        if activity.get('location_display'):
            score += 10

        # Gamification enhancements
        if activity.get('vibe_tags') and len(activity.get('vibe_tags', [])) > 0:
            score += 15
        if activity.get('marketing_badge'):
            score += 10
        if activity.get('optimal_time_of_day'):
            score += 10

        # Additional quality indicators
        if activity.get('review_count', 0) > 0:
            score += 5

        return min(score, 100)

    def get_readiness_issues(self, activity: Dict) -> List[str]:
        """
        Get list of issues preventing full gamification readiness

        Args:
            activity: Activity dictionary

        Returns:
            List of issue descriptions
        """
        issues = []

        if not activity.get('hero_image_url'):
            issues.append('Missing hero image')
        if activity.get('price') is None:
            issues.append('Missing price')
        if not activity.get('vibe_tags') or len(activity.get('vibe_tags', [])) == 0:
            issues.append('Missing vibe tags')
        if not activity.get('short_description'):
            issues.append('Missing description')
        if not activity.get('location_display'):
            issues.append('Missing location')
        if not activity.get('optimal_time_of_day'):
            issues.append('Missing optimal time')

        return issues
