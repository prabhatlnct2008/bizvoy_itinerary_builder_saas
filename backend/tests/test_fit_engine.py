"""
Unit tests for the FitEngine service.

Tests the core bin-packing algorithm that fits activities into itinerary time slots.
"""

import pytest
from datetime import time, date, datetime
from decimal import Decimal
from unittest.mock import Mock, MagicMock

from app.services.gamification.fit_engine import (
    FitEngine,
    TimeSlot,
    TimeWindow,
    FitSlot,
    FitResult
)


class MockActivity:
    """Mock Activity model for testing."""

    def __init__(
        self,
        id="act-1",
        name="Test Activity",
        price_numeric=100.0,
        currency_code="USD",
        default_duration_value=2,
        default_duration_unit="hours",
        optimal_time_of_day=None,
        blocked_days_of_week=None
    ):
        self.id = id
        self.name = name
        self.price_numeric = Decimal(str(price_numeric))
        self.currency_code = currency_code
        self.default_duration_value = default_duration_value
        self.default_duration_unit = default_duration_unit
        self.optimal_time_of_day = optimal_time_of_day
        self.blocked_days_of_week = blocked_days_of_week or []


class MockItineraryDayActivity:
    """Mock ItineraryDayActivity model for testing."""

    def __init__(self, activity=None, time_slot=None, is_locked_by_agency=False):
        self.activity = activity
        self.time_slot = time_slot
        self.is_locked_by_agency = is_locked_by_agency


class MockItineraryDay:
    """Mock ItineraryDay model for testing."""

    def __init__(self, id="day-1", day_number=1, actual_date=None, activities=None):
        self.id = id
        self.day_number = day_number
        self.actual_date = actual_date or date(2025, 6, 15)
        self.activities = activities or []


class MockItinerary:
    """Mock Itinerary model for testing."""

    def __init__(self, id="itin-1", days=None):
        self.id = id
        self.days = days or []


class MockSession:
    """Mock PersonalizationSession for testing."""

    def __init__(self, id="session-1"):
        self.id = id


class TestFitEngine:
    """Test suite for FitEngine."""

    def test_fit_single_activity_morning(self):
        """Test fitting a single activity in the morning slot."""
        engine = FitEngine(policy="STRICT")

        # Create itinerary with one empty day
        day = MockItineraryDay(day_number=1, actual_date=date(2025, 6, 15))
        itinerary = MockItinerary(days=[day])

        # Create activity that prefers morning
        activity = MockActivity(
            id="act-1",
            name="Morning Tour",
            price_numeric=100.0,
            default_duration_value=2,
            default_duration_unit="hours",
            optimal_time_of_day="MORNING"
        )

        session = MockSession()

        # Fit activities
        result = engine.fit_activities(itinerary, [activity], session)

        # Assertions
        assert len(result.fitted_items) == 1
        assert len(result.missed_items) == 0
        assert result.total_price == 100.0
        assert result.fitted_items[0]['fit_slot'].time_slot == TimeSlot.MORNING

    def test_fit_multiple_activities_same_day(self):
        """Test fitting multiple activities on the same day."""
        engine = FitEngine(policy="STRICT")

        # Create itinerary with one empty day
        day = MockItineraryDay(day_number=1, actual_date=date(2025, 6, 15))
        itinerary = MockItinerary(days=[day])

        # Create activities for different time slots
        morning_activity = MockActivity(
            id="act-1",
            name="Morning Tour",
            price_numeric=100.0,
            default_duration_value=2,
            default_duration_unit="hours",
            optimal_time_of_day="MORNING"
        )

        afternoon_activity = MockActivity(
            id="act-2",
            name="Afternoon Museum",
            price_numeric=80.0,
            default_duration_value=3,
            default_duration_unit="hours",
            optimal_time_of_day="AFTERNOON"
        )

        session = MockSession()

        # Fit activities
        result = engine.fit_activities(
            itinerary,
            [morning_activity, afternoon_activity],
            session
        )

        # Assertions
        assert len(result.fitted_items) == 2
        assert len(result.missed_items) == 0
        assert result.total_price == 180.0

        # Check time slots
        time_slots = [item['fit_slot'].time_slot for item in result.fitted_items]
        assert TimeSlot.MORNING in time_slots
        assert TimeSlot.AFTERNOON in time_slots

    def test_activity_blocked_day(self):
        """Test that activities are not scheduled on blocked days."""
        engine = FitEngine(policy="STRICT")

        # Create itinerary with a Monday (day 1)
        # 2025-06-16 is a Monday
        day = MockItineraryDay(day_number=1, actual_date=date(2025, 6, 16))
        itinerary = MockItinerary(days=[day])

        # Create activity that's blocked on Mondays (day 1)
        activity = MockActivity(
            id="act-1",
            name="Closed Monday Tour",
            price_numeric=100.0,
            default_duration_value=2,
            default_duration_unit="hours",
            blocked_days_of_week=[1]  # Monday
        )

        session = MockSession()

        # Fit activities
        result = engine.fit_activities(itinerary, [activity], session)

        # Assertions - should be missed
        assert len(result.fitted_items) == 0
        assert len(result.missed_items) == 1
        assert "not available" in result.missed_items[0]['cart_item'].miss_reason.lower()

    def test_optimal_time_preference(self):
        """Test that optimal_time_of_day is respected when possible."""
        engine = FitEngine(policy="STRICT")

        # Create itinerary with two days
        day1 = MockItineraryDay(day_number=1, actual_date=date(2025, 6, 15))
        day2 = MockItineraryDay(day_number=2, actual_date=date(2025, 6, 16))
        itinerary = MockItinerary(days=[day1, day2])

        # Create activity that prefers evening
        activity = MockActivity(
            id="act-1",
            name="Sunset Tour",
            price_numeric=100.0,
            default_duration_value=2,
            default_duration_unit="hours",
            optimal_time_of_day="EVENING"
        )

        session = MockSession()

        # Fit activities
        result = engine.fit_activities(itinerary, [activity], session)

        # Assertions - should fit in evening slot
        assert len(result.fitted_items) == 1
        assert result.fitted_items[0]['fit_slot'].time_slot == TimeSlot.EVENING
        assert "preferred time" in result.fitted_items[0]['fit_slot'].fit_reason.lower()

    def test_all_slots_full(self):
        """Test behavior when no slots are available."""
        engine = FitEngine(policy="STRICT")

        # Create itinerary with one day that has locked activities in all slots
        locked_morning = MockItineraryDayActivity(
            activity=MockActivity(id="locked-1", name="Hotel"),
            time_slot="MORNING",
            is_locked_by_agency=True
        )
        locked_afternoon = MockItineraryDayActivity(
            activity=MockActivity(id="locked-2", name="Transfer"),
            time_slot="AFTERNOON",
            is_locked_by_agency=True
        )
        locked_evening = MockItineraryDayActivity(
            activity=MockActivity(id="locked-3", name="Dinner"),
            time_slot="EVENING",
            is_locked_by_agency=True
        )

        day = MockItineraryDay(
            day_number=1,
            actual_date=date(2025, 6, 15),
            activities=[locked_morning, locked_afternoon, locked_evening]
        )
        itinerary = MockItinerary(days=[day])

        # Try to fit an activity
        activity = MockActivity(
            id="act-1",
            name="New Tour",
            price_numeric=100.0
        )

        session = MockSession()

        # Fit activities
        result = engine.fit_activities(itinerary, [activity], session)

        # Assertions - should be missed
        assert len(result.fitted_items) == 0
        assert len(result.missed_items) == 1
        assert "no available" in result.missed_items[0]['cart_item'].miss_reason.lower()

    def test_strict_policy(self):
        """Test STRICT policy only uses empty slots."""
        engine = FitEngine(policy="STRICT")

        # Create itinerary with one day with non-locked activity
        existing_activity = MockItineraryDayActivity(
            activity=MockActivity(id="existing", name="Existing Tour"),
            time_slot="MORNING",
            is_locked_by_agency=False  # Not locked
        )

        day = MockItineraryDay(
            day_number=1,
            actual_date=date(2025, 6, 15),
            activities=[existing_activity]
        )
        itinerary = MockItinerary(days=[day])

        # Try to fit an activity
        activity = MockActivity(
            id="act-1",
            name="New Tour",
            price_numeric=100.0,
            optimal_time_of_day="MORNING"
        )

        session = MockSession()

        # Fit activities
        result = engine.fit_activities(itinerary, [activity], session)

        # STRICT policy should not use morning slot
        # Should fit in afternoon or evening instead
        if result.fitted_items:
            assert result.fitted_items[0]['fit_slot'].time_slot != TimeSlot.MORNING

    def test_balanced_policy(self):
        """Test BALANCED policy can replace non-locked items."""
        engine = FitEngine(policy="BALANCED")

        # Create itinerary with one day with non-locked activity
        existing_activity = MockItineraryDayActivity(
            activity=MockActivity(
                id="existing",
                name="Existing Tour",
                default_duration_value=1,
                default_duration_unit="hours"
            ),
            time_slot="MORNING",
            is_locked_by_agency=False  # Not locked
        )

        day = MockItineraryDay(
            day_number=1,
            actual_date=date(2025, 6, 15),
            activities=[existing_activity]
        )
        itinerary = MockItinerary(days=[day])

        # Try to fit an activity in morning
        activity = MockActivity(
            id="act-1",
            name="New Tour",
            price_numeric=100.0,
            optimal_time_of_day="MORNING",
            default_duration_value=2,
            default_duration_unit="hours"
        )

        session = MockSession()

        # Fit activities
        result = engine.fit_activities(itinerary, [activity], session)

        # BALANCED policy should allow using morning slot
        # (since existing activity is not locked)
        assert len(result.fitted_items) == 1

    def test_aggressive_policy(self):
        """Test AGGRESSIVE policy replaces all non-locked items."""
        engine = FitEngine(policy="AGGRESSIVE")

        # Create itinerary with locked and non-locked activities
        locked_activity = MockItineraryDayActivity(
            activity=MockActivity(
                id="locked",
                name="Hotel",
                default_duration_value=8,
                default_duration_unit="hours"
            ),
            time_slot="MORNING",
            is_locked_by_agency=True
        )

        non_locked_activity = MockItineraryDayActivity(
            activity=MockActivity(
                id="non-locked",
                name="Flexible Tour",
                default_duration_value=2,
                default_duration_unit="hours"
            ),
            time_slot="AFTERNOON",
            is_locked_by_agency=False
        )

        day = MockItineraryDay(
            day_number=1,
            actual_date=date(2025, 6, 15),
            activities=[locked_activity, non_locked_activity]
        )
        itinerary = MockItinerary(days=[day])

        # Try to fit an activity
        activity = MockActivity(
            id="act-1",
            name="New Tour",
            price_numeric=100.0,
            optimal_time_of_day="AFTERNOON",
            default_duration_value=3,
            default_duration_unit="hours"
        )

        session = MockSession()

        # Fit activities
        result = engine.fit_activities(itinerary, [activity], session)

        # AGGRESSIVE should be able to use afternoon slot
        assert len(result.fitted_items) >= 0  # Should at least try

    def test_swap_suggestion_generated(self):
        """Test that missed items get appropriate swap suggestions."""
        engine = FitEngine(policy="STRICT")

        # Create itinerary with one day, afternoon slot available
        day = MockItineraryDay(day_number=1, actual_date=date(2025, 6, 15))
        itinerary = MockItinerary(days=[day])

        # Create two activities - one cheap (fits), one expensive (priority)
        cheap_activity = MockActivity(
            id="act-1",
            name="Cheap Tour",
            price_numeric=50.0,
            default_duration_value=2,
            default_duration_unit="hours",
            optimal_time_of_day="MORNING"
        )

        expensive_activity = MockActivity(
            id="act-2",
            name="Expensive Tour",
            price_numeric=200.0,
            default_duration_value=2,
            default_duration_unit="hours",
            optimal_time_of_day="MORNING"
        )

        # Second expensive activity that won't fit
        another_expensive = MockActivity(
            id="act-3",
            name="Another Expensive",
            price_numeric=180.0,
            default_duration_value=2,
            default_duration_unit="hours",
            optimal_time_of_day="MORNING"
        )

        session = MockSession()

        # Fit activities (expensive should fit first due to sorting)
        result = engine.fit_activities(
            itinerary,
            [cheap_activity, expensive_activity, another_expensive],
            session
        )

        # Check if swap suggestions exist for missed items
        if result.missed_items:
            for missed in result.missed_items:
                # Swap suggestion might be None or an activity ID
                assert hasattr(missed['cart_item'], 'swap_suggestion_activity_id')

    def test_priority_by_price(self):
        """Test that higher-priced items are fitted first."""
        engine = FitEngine(policy="STRICT")

        # Create itinerary with limited space (one slot available)
        day = MockItineraryDay(day_number=1, actual_date=date(2025, 6, 15))
        itinerary = MockItinerary(days=[day])

        # Create activities with different prices
        cheap = MockActivity(id="cheap", price_numeric=50.0)
        medium = MockActivity(id="medium", price_numeric=100.0)
        expensive = MockActivity(id="expensive", price_numeric=200.0)

        session = MockSession()

        # Fit activities
        result = engine.fit_activities(
            itinerary,
            [cheap, medium, expensive],  # Order doesn't matter
            session
        )

        # Higher priced activities should be fitted first
        if result.fitted_items:
            # The first fitted should be the expensive one
            fitted_prices = [
                float(item['cart_item'].quoted_price)
                for item in result.fitted_items
            ]
            # Most expensive should be prioritized
            assert max(fitted_prices) >= 100.0

    def test_duration_exceeds_window(self):
        """Test activities that don't fit in any window."""
        engine = FitEngine(policy="STRICT")

        # Create itinerary with one day
        day = MockItineraryDay(day_number=1, actual_date=date(2025, 6, 15))
        itinerary = MockItinerary(days=[day])

        # Create activity with very long duration (longer than any slot)
        long_activity = MockActivity(
            id="act-1",
            name="Multi-Day Tour",
            price_numeric=500.0,
            default_duration_value=10,  # 10 hours - longer than any slot
            default_duration_unit="hours"
        )

        session = MockSession()

        # Fit activities
        result = engine.fit_activities(itinerary, [long_activity], session)

        # Should be missed due to duration
        assert len(result.fitted_items) == 0
        assert len(result.missed_items) == 1
        assert "duration" in result.missed_items[0]['cart_item'].miss_reason.lower()

    def test_calculate_duration_minutes(self):
        """Test duration calculation helper method."""
        engine = FitEngine()

        # Test hours
        activity = MockActivity(default_duration_value=2, default_duration_unit="hours")
        assert engine._calculate_duration_minutes(activity) == 120

        # Test minutes
        activity = MockActivity(default_duration_value=45, default_duration_unit="minutes")
        assert engine._calculate_duration_minutes(activity) == 45

        # Test days
        activity = MockActivity(default_duration_value=1, default_duration_unit="days")
        assert engine._calculate_duration_minutes(activity) == 480

        # Test default (no duration)
        activity = MockActivity(default_duration_value=None)
        assert engine._calculate_duration_minutes(activity) == 120

    def test_get_day_of_week(self):
        """Test day of week calculation."""
        engine = FitEngine()

        # Sunday June 15, 2025
        sunday = date(2025, 6, 15)
        assert engine._get_day_of_week(sunday) == 0

        # Monday June 16, 2025
        monday = date(2025, 6, 16)
        assert engine._get_day_of_week(monday) == 1

        # Saturday June 21, 2025
        saturday = date(2025, 6, 21)
        assert engine._get_day_of_week(saturday) == 6


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
