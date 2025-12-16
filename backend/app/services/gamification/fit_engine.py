"""
Fit Engine - Bin Packing Algorithm for Activity Scheduling

This module implements the core algorithm that fits "liked" activities into
available time slots within an itinerary. It uses a bin-packing approach with
constraints like time-of-day preferences, day-of-week restrictions, and duration limits.
"""

from datetime import time, date, datetime
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from decimal import Decimal


class TimeSlot(str, Enum):
    """Time slots for scheduling activities."""
    MORNING = "MORNING"      # 09:00 - 12:00
    AFTERNOON = "AFTERNOON"  # 12:00 - 16:00
    EVENING = "EVENING"      # 16:00 - 20:00


@dataclass
class TimeWindow:
    """Represents an available time window in a day."""
    slot: TimeSlot
    start: time
    end: time
    minutes_available: int
    day_number: int
    day_date: date
    day_id: str


@dataclass
class FitSlot:
    """Represents where an activity was fitted."""
    day_number: int
    day_date: date
    day_id: str
    time_slot: TimeSlot
    fit_reason: str


@dataclass
class FitResult:
    """Results of the fit algorithm."""
    fitted_items: List[dict]
    missed_items: List[dict]
    total_price: float
    currency_code: str


class FitEngine:
    """
    Implements the bin-packing algorithm to fit activities into itinerary time slots.

    Policies:
    - STRICT: Only use truly empty slots (no existing activities)
    - BALANCED: Empty slots + can replace non-locked items (default)
    - AGGRESSIVE: All slots except locked items
    """

    TIME_WINDOWS = {
        TimeSlot.MORNING: {"start": time(9, 0), "end": time(12, 0), "minutes": 180},
        TimeSlot.AFTERNOON: {"start": time(12, 0), "end": time(16, 0), "minutes": 240},
        TimeSlot.EVENING: {"start": time(16, 0), "end": time(20, 0), "minutes": 240},
    }

    def __init__(self, policy: str = "BALANCED"):
        """
        Initialize the fit engine.

        Args:
            policy: Fitting policy - STRICT, BALANCED, or AGGRESSIVE
        """
        self.policy = policy

    def fit_activities(self, itinerary, liked_activities, session) -> FitResult:
        """
        Main bin-packing algorithm to fit liked activities into the itinerary.

        Algorithm:
        1. Get all days from itinerary with their existing activities
        2. Calculate available windows per day based on policy
        3. Sort liked activities by priority (price high→low, then duration long→short)
        4. For each activity:
           a. Check optimal_time_of_day preference
           b. Check blocked_days_of_week against itinerary dates
           c. Find best available window
           d. If fit: add to fitted list, mark window as used
           e. If no fit: add to missed list with reason and swap suggestion
        5. Return FitResult

        Args:
            itinerary: Itinerary model instance
            liked_activities: List of Activity instances that user liked
            session: Database session

        Returns:
            FitResult with fitted and missed items
        """
        from app.models import ItineraryCartItem, CartItemStatus, FitStatus

        # Step 1: Get available windows for each day
        available_windows = self.get_available_windows(itinerary)

        # Step 2: Sort activities by priority
        # Higher price first (more revenue), then longer duration first (harder to fit)
        sorted_activities = sorted(
            liked_activities,
            key=lambda a: (
                -float(getattr(a, 'price_numeric', 0) or 0),
                -self._calculate_duration_minutes(a)
            )
        )

        fitted_items = []
        missed_items = []
        total_price = 0.0
        currency_code = "USD"

        # Step 3: Try to fit each activity
        for activity in sorted_activities:
            # Get activity details
            duration_minutes = self._calculate_duration_minutes(activity)
            price = float(getattr(activity, 'price_numeric', 0) or 0)
            currency = getattr(activity, 'currency_code', 'USD')

            # Try to find a suitable window
            fit_slot = self._find_best_window(activity, available_windows)

            if fit_slot:
                # Activity fits - create cart item
                cart_item = ItineraryCartItem(
                    session_id=session.id,
                    itinerary_id=itinerary.id,
                    activity_id=activity.id,
                    day_id=fit_slot.day_id,
                    quoted_price=Decimal(str(price)),
                    currency_code=currency,
                    time_slot=fit_slot.time_slot.value,
                    fit_status=FitStatus.FITTED,
                    fit_reason=fit_slot.fit_reason,
                    status=CartItemStatus.PENDING
                )

                fitted_items.append({
                    'cart_item': cart_item,
                    'activity': activity,
                    'fit_slot': fit_slot
                })

                total_price += price
                currency_code = currency  # Use last currency (assume all same)

                # Mark this window as used
                self._mark_window_used(available_windows, fit_slot, duration_minutes)

            else:
                # Activity doesn't fit - determine why
                miss_reason, swap_suggestion = self._generate_miss_reason(
                    activity, available_windows, fitted_items
                )

                cart_item = ItineraryCartItem(
                    session_id=session.id,
                    itinerary_id=itinerary.id,
                    activity_id=activity.id,
                    day_id=None,
                    quoted_price=Decimal(str(price)),
                    currency_code=currency,
                    time_slot=None,
                    fit_status=FitStatus.MISSED,
                    fit_reason=None,
                    miss_reason=miss_reason,
                    swap_suggestion_activity_id=swap_suggestion,
                    status=CartItemStatus.PENDING
                )

                missed_items.append({
                    'cart_item': cart_item,
                    'activity': activity,
                    'miss_reason': miss_reason
                })

        return FitResult(
            fitted_items=fitted_items,
            missed_items=missed_items,
            total_price=total_price,
            currency_code=currency_code
        )

    def get_available_windows(self, itinerary) -> Dict[int, List[TimeWindow]]:
        """
        Calculate available time windows for each day in the itinerary.

        Policy logic:
        - STRICT: Only truly empty slots (no activities scheduled)
        - BALANCED: Empty slots + slots with non-locked activities
        - AGGRESSIVE: All slots except those with locked activities

        Args:
            itinerary: Itinerary model instance

        Returns:
            Dictionary mapping day_number to list of TimeWindow objects
        """
        windows_by_day = {}

        for day in itinerary.days:
            day_windows = []

            # Get existing activities for this day
            existing_activities = day.activities if hasattr(day, 'activities') else []

            # Check each time slot
            for slot, slot_info in self.TIME_WINDOWS.items():
                # Check if this slot has existing activities
                slot_activities = [
                    a for a in existing_activities
                    if self._activity_in_slot(a, slot)
                ]

                # Determine if slot is available based on policy
                is_available = False
                minutes_available = slot_info['minutes']

                if self.policy == "STRICT":
                    # Only empty slots
                    is_available = len(slot_activities) == 0
                elif self.policy == "BALANCED":
                    # Empty slots or slots with non-locked activities
                    locked_count = sum(
                        1 for a in slot_activities
                        if getattr(a, 'is_locked_by_agency', False)
                    )
                    is_available = locked_count == 0
                else:  # AGGRESSIVE
                    # All slots except fully locked ones
                    unlocked_exists = any(
                        not getattr(a, 'is_locked_by_agency', False)
                        for a in slot_activities
                    )
                    is_available = len(slot_activities) == 0 or unlocked_exists

                if is_available:
                    # Calculate actual available minutes (subtract existing activities)
                    if self.policy != "STRICT" and slot_activities:
                        # Subtract time used by activities we can't replace
                        for activity in slot_activities:
                            if getattr(activity, 'is_locked_by_agency', False):
                                # For locked activities, reduce available time
                                activity_duration = self._calculate_activity_duration(activity)
                                minutes_available -= activity_duration

                    if minutes_available > 0:
                        day_windows.append(TimeWindow(
                            slot=slot,
                            start=slot_info['start'],
                            end=slot_info['end'],
                            minutes_available=minutes_available,
                            day_number=day.day_number,
                            day_date=day.actual_date,
                            day_id=day.id
                        ))

            windows_by_day[day.day_number] = day_windows

        return windows_by_day

    def _find_best_window(
        self,
        activity,
        available_windows: Dict[int, List[TimeWindow]]
    ) -> Optional[FitSlot]:
        """
        Find the best time window for an activity.

        Considers:
        1. Activity's optimal_time_of_day preference
        2. Activity's duration vs window capacity
        3. Day of week restrictions (blocked_days_of_week)

        Args:
            activity: Activity instance
            available_windows: Dictionary of available windows by day

        Returns:
            FitSlot if a suitable window is found, None otherwise
        """
        duration_minutes = self._calculate_duration_minutes(activity)
        optimal_time = getattr(activity, 'optimal_time_of_day', None)
        blocked_days = getattr(activity, 'blocked_days_of_week', None) or []

        # Parse blocked days if it's a JSON string
        if isinstance(blocked_days, str):
            import json
            try:
                blocked_days = json.loads(blocked_days)
            except:
                blocked_days = []

        best_fit = None
        best_score = -1

        # Try all available windows
        for day_number, windows in available_windows.items():
            for window in windows:
                # Check if duration fits
                if duration_minutes > window.minutes_available:
                    continue

                # Check day of week restriction
                day_of_week = self._get_day_of_week(window.day_date)
                if day_of_week in blocked_days:
                    continue

                # Calculate fit score
                score = 0

                # Prefer optimal time slot
                if optimal_time and window.slot.value == optimal_time:
                    score += 100

                # Prefer earlier days (fill itinerary from start)
                score += (10 - day_number)

                # Prefer tighter fits (less wasted time)
                fit_efficiency = duration_minutes / window.minutes_available
                score += fit_efficiency * 10

                if score > best_score:
                    best_score = score
                    reason = f"Fits in {window.slot.value.title()} slot on Day {day_number}"
                    if optimal_time and window.slot.value == optimal_time:
                        reason += " (preferred time)"

                    best_fit = FitSlot(
                        day_number=day_number,
                        day_date=window.day_date,
                        day_id=window.day_id,
                        time_slot=window.slot,
                        fit_reason=reason
                    )

        return best_fit

    def _calculate_duration_minutes(self, activity) -> int:
        """
        Convert activity duration to minutes.

        Args:
            activity: Activity instance with default_duration_value and default_duration_unit

        Returns:
            Duration in minutes
        """
        duration_value = getattr(activity, 'default_duration_value', None)
        duration_unit = getattr(activity, 'default_duration_unit', None)

        if not duration_value:
            return 120  # Default 2 hours

        if duration_unit == 'minutes':
            return int(duration_value)
        elif duration_unit == 'hours':
            return int(duration_value * 60)
        elif duration_unit == 'days':
            return int(duration_value * 480)  # 8 hours per day
        elif duration_unit == 'nights':
            return int(duration_value * 1440)  # 24 hours per night
        else:
            return 120  # Default 2 hours

    def _calculate_activity_duration(self, itinerary_activity) -> int:
        """
        Calculate duration of an existing itinerary activity in minutes.

        Args:
            itinerary_activity: ItineraryDayActivity instance

        Returns:
            Duration in minutes
        """
        # If the activity has an associated Activity record, use that
        if hasattr(itinerary_activity, 'activity') and itinerary_activity.activity:
            return self._calculate_duration_minutes(itinerary_activity.activity)

        # Default to 2 hours
        return 120

    def _activity_in_slot(self, itinerary_activity, slot: TimeSlot) -> bool:
        """
        Check if an itinerary activity is scheduled in a given time slot.

        Args:
            itinerary_activity: ItineraryDayActivity instance
            slot: TimeSlot to check

        Returns:
            True if activity is in this slot
        """
        activity_slot = getattr(itinerary_activity, 'time_slot', None)
        if not activity_slot:
            # If no time slot specified, assume it's flexible
            return False

        return activity_slot == slot.value

    def _mark_window_used(
        self,
        available_windows: Dict[int, List[TimeWindow]],
        fit_slot: FitSlot,
        duration_minutes: int
    ):
        """
        Mark a time window as used by reducing its available minutes.

        Args:
            available_windows: Dictionary of available windows
            fit_slot: The slot where activity was fitted
            duration_minutes: Duration of the fitted activity
        """
        if fit_slot.day_number in available_windows:
            day_windows = available_windows[fit_slot.day_number]
            for window in day_windows:
                if window.slot == fit_slot.time_slot:
                    window.minutes_available -= duration_minutes
                    # Remove window if no time left
                    if window.minutes_available <= 0:
                        day_windows.remove(window)
                    break

    def _generate_miss_reason(
        self,
        activity,
        available_windows: Dict[int, List[TimeWindow]],
        fitted_items: List[dict]
    ) -> Tuple[str, Optional[str]]:
        """
        Generate a reason why an activity couldn't be fitted and suggest a swap.

        Args:
            activity: Activity that couldn't be fitted
            available_windows: Available time windows
            fitted_items: List of already fitted items

        Returns:
            Tuple of (miss_reason, swap_suggestion_activity_id)
        """
        duration_minutes = self._calculate_duration_minutes(activity)
        optimal_time = getattr(activity, 'optimal_time_of_day', None)
        blocked_days = getattr(activity, 'blocked_days_of_week', None) or []

        # Parse blocked days if it's a JSON string
        if isinstance(blocked_days, str):
            import json
            try:
                blocked_days = json.loads(blocked_days)
            except:
                blocked_days = []

        # Determine specific reason
        has_any_windows = any(len(windows) > 0 for windows in available_windows.values())

        if not has_any_windows:
            reason = "No available time slots in itinerary"
            swap_id = self._suggest_swap_candidate(activity, fitted_items)
            return reason, swap_id

        # Check if duration is the issue
        max_available = max(
            (w.minutes_available for windows in available_windows.values() for w in windows),
            default=0
        )

        if duration_minutes > max_available:
            reason = f"Duration ({duration_minutes}min) exceeds available slots (max {max_available}min)"
            swap_id = self._suggest_swap_candidate(activity, fitted_items)
            return reason, swap_id

        # Check if day restrictions are the issue
        if blocked_days:
            available_days = set(available_windows.keys())
            all_blocked = all(
                self._get_day_of_week(available_windows[day][0].day_date) in blocked_days
                for day in available_days if available_windows.get(day)
            )
            if all_blocked:
                reason = "Activity not available on these days of week"
                return reason, None

        # Check if time preference is the issue
        if optimal_time:
            has_preferred_slot = any(
                any(w.slot.value == optimal_time for w in windows)
                for windows in available_windows.values()
            )
            if not has_preferred_slot:
                reason = f"No available {optimal_time} slots found"
                swap_id = self._suggest_swap_candidate(activity, fitted_items, optimal_time)
                return reason, swap_id

        # Generic reason
        reason = "Could not find suitable time slot"
        swap_id = self._suggest_swap_candidate(activity, fitted_items)
        return reason, swap_id

    def _suggest_swap_candidate(
        self,
        missed_activity,
        fitted_items: List[dict],
        preferred_time_slot: Optional[str] = None
    ) -> Optional[str]:
        """
        Find a fitted activity that could be swapped for the missed one.

        Prioritizes:
        1. Activities in the preferred time slot
        2. Activities with similar or shorter duration
        3. Activities with lower price

        Args:
            missed_activity: The activity that couldn't be fitted
            fitted_items: List of fitted items
            preferred_time_slot: Optional preferred time slot

        Returns:
            Activity ID of suggested swap candidate, or None
        """
        if not fitted_items:
            return None

        missed_duration = self._calculate_duration_minutes(missed_activity)
        missed_price = float(getattr(missed_activity, 'price_numeric', 0) or 0)

        best_candidate = None
        best_score = -1

        for item in fitted_items:
            activity = item['activity']
            fit_slot = item['fit_slot']

            # Calculate score for this swap candidate
            score = 0

            # Prefer same time slot
            if preferred_time_slot and fit_slot.time_slot.value == preferred_time_slot:
                score += 50

            # Prefer similar or shorter duration
            activity_duration = self._calculate_duration_minutes(activity)
            if activity_duration <= missed_duration:
                score += 30
            else:
                # Penalty for longer duration
                score -= 20

            # Prefer lower price (swap cheap for expensive)
            activity_price = float(getattr(activity, 'price_numeric', 0) or 0)
            if activity_price < missed_price:
                score += (missed_price - activity_price) / 10

            if score > best_score:
                best_score = score
                best_candidate = activity.id

        return best_candidate

    def _get_day_of_week(self, day_date: date) -> int:
        """
        Get day of week for a date.

        Args:
            day_date: Date to check

        Returns:
            0-6 where 0=Sunday, 1=Monday, ..., 6=Saturday
        """
        # Python's weekday() returns 0=Monday, 6=Sunday
        # We need to convert to 0=Sunday, 6=Saturday
        python_weekday = day_date.weekday()
        return (python_weekday + 1) % 7
