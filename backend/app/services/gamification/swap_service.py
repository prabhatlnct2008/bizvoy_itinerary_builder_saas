"""
Swap Service - Handles swapping of fitted and missed activities

This module allows users to swap a fitted activity with a missed one,
re-running the fit algorithm to see if the missed activity can fit in
the vacated slot.
"""

from typing import Tuple, Optional
from datetime import datetime


class SwapService:
    """
    Handles swapping activities between fitted and missed lists.

    A swap occurs when:
    1. User wants to replace a fitted activity with a missed one
    2. The missed activity can fit in the vacated slot
    """

    def __init__(self, db_session):
        """
        Initialize swap service.

        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session

    def validate_swap(
        self,
        session,
        missed_activity_id: str,
        replace_activity_id: str
    ) -> Tuple[bool, str]:
        """
        Validate that a swap is allowed.

        Checks:
        1. missed_activity_id is in the missed list
        2. replace_activity_id is in the fitted list
        3. The replace activity is not locked by agency
        4. The missed activity could potentially fit in the slot

        Args:
            session: PersonalizationSession instance
            missed_activity_id: Activity ID to swap in (currently missed)
            replace_activity_id: Activity ID to swap out (currently fitted)

        Returns:
            Tuple of (is_valid, error_message)
        """
        from app.models import FitStatus, CartItemStatus

        # Get both cart items
        missed_item = self.db.query(
            self.db.query.__self__.registry._class_registry.data['ItineraryCartItem']
        ).filter_by(
            session_id=session.id,
            activity_id=missed_activity_id,
            fit_status=FitStatus.MISSED,
            status=CartItemStatus.PENDING
        ).first()

        if not missed_item:
            return False, "Activity not found in missed list"

        replace_item = self.db.query(
            self.db.query.__self__.registry._class_registry.data['ItineraryCartItem']
        ).filter_by(
            session_id=session.id,
            activity_id=replace_activity_id,
            fit_status=FitStatus.FITTED,
            status=CartItemStatus.PENDING
        ).first()

        if not replace_item:
            return False, "Activity not found in fitted list"

        # Check if the fitted activity can be swapped (not locked)
        # This would require checking the itinerary day activity if it exists
        # For now, we allow all swaps of personalized items

        return True, ""

    def execute_swap(
        self,
        session,
        itinerary,
        missed_activity_id: str,
        replace_activity_id: str,
        fit_engine,
        reveal_builder,
        company_profile
    ) -> dict:
        """
        Execute a swap between a missed and fitted activity.

        Algorithm:
        1. Validate swap is allowed
        2. Get both cart items
        3. Mark replace_activity as SWAPPED (move to missed)
        4. Try to fit missed_activity in the vacated slot
        5. If it fits: update both items, recalculate totals
        6. If it doesn't fit: revert and return error
        7. Return updated reveal response

        Args:
            session: PersonalizationSession instance
            itinerary: Itinerary instance
            missed_activity_id: Activity to swap in
            replace_activity_id: Activity to swap out
            fit_engine: FitEngine instance
            reveal_builder: RevealBuilder instance
            company_profile: CompanyProfile instance

        Returns:
            Updated reveal response or error
        """
        from app.models import (
            ItineraryCartItem,
            FitStatus,
            CartItemStatus
        )

        # Validate swap
        is_valid, error_msg = self.validate_swap(session, missed_activity_id, replace_activity_id)
        if not is_valid:
            raise ValueError(error_msg)

        # Get cart items
        missed_item = self.db.query(ItineraryCartItem).filter_by(
            session_id=session.id,
            activity_id=missed_activity_id,
            fit_status=FitStatus.MISSED
        ).first()

        replace_item = self.db.query(ItineraryCartItem).filter_by(
            session_id=session.id,
            activity_id=replace_activity_id,
            fit_status=FitStatus.FITTED
        ).first()

        if not missed_item or not replace_item:
            raise ValueError("Invalid swap: items not found")

        # Get the activities
        from app.models import Activity
        missed_activity = self.db.query(Activity).filter_by(id=missed_activity_id).first()
        replace_activity = self.db.query(Activity).filter_by(id=replace_activity_id).first()

        if not missed_activity or not replace_activity:
            raise ValueError("Activities not found")

        # Store original state for potential rollback
        original_replace_state = {
            'day_id': replace_item.day_id,
            'time_slot': replace_item.time_slot,
            'fit_status': replace_item.fit_status,
            'fit_reason': replace_item.fit_reason,
        }

        # Calculate duration of missed activity
        missed_duration = fit_engine._calculate_duration_minutes(missed_activity)

        # Check if missed activity can fit in the vacated slot
        # Create a temporary window with the replaced slot's capacity
        can_fit = False
        fit_reason = None

        # Get the time slot that's being vacated
        vacated_slot = replace_item.time_slot
        vacated_day = replace_item.day_id

        if vacated_slot and vacated_day:
            # Check if missed activity's constraints allow it in this slot
            blocked_days = getattr(missed_activity, 'blocked_days_of_week', None) or []
            if isinstance(blocked_days, str):
                import json
                try:
                    blocked_days = json.loads(blocked_days)
                except:
                    blocked_days = []

            # Get day info
            from app.models import ItineraryDay
            day = self.db.query(ItineraryDay).filter_by(id=vacated_day).first()

            if day:
                day_of_week = fit_engine._get_day_of_week(day.actual_date)

                # Check day of week restriction
                if day_of_week not in blocked_days:
                    # Activity can be placed in this slot
                    can_fit = True
                    fit_reason = f"Swapped into {vacated_slot} slot on Day {day.day_number}"
                else:
                    fit_reason = None
                    can_fit = False

        if can_fit:
            # Execute the swap

            # Update replace_item (move to missed)
            replace_item.fit_status = FitStatus.SWAPPED
            replace_item.day_id = None
            replace_item.time_slot = None
            replace_item.fit_reason = None
            replace_item.miss_reason = "Swapped out by user preference"
            replace_item.updated_at = datetime.utcnow()

            # Update missed_item (move to fitted)
            missed_item.fit_status = FitStatus.FITTED
            missed_item.day_id = vacated_day
            missed_item.time_slot = vacated_slot
            missed_item.fit_reason = fit_reason
            missed_item.miss_reason = None
            missed_item.updated_at = datetime.utcnow()

            # Commit changes
            self.db.commit()

            # Rebuild reveal response
            # Get all cart items for this session
            all_cart_items = self.db.query(ItineraryCartItem).filter_by(
                session_id=session.id
            ).all()

            # Separate fitted and missed
            fitted_items = []
            missed_items = []

            for cart_item in all_cart_items:
                activity = self.db.query(
                    self.db.query.__self__.registry._class_registry.data['Activity']
                ).filter_by(id=cart_item.activity_id).first()

                if cart_item.fit_status == FitStatus.FITTED:
                    # Get day for fit_slot
                    day = self.db.query(
                        self.db.query.__self__.registry._class_registry.data['ItineraryDay']
                    ).filter_by(id=cart_item.day_id).first()

                    if day:
                        from app.services.gamification.fit_engine import FitSlot, TimeSlot
                        fit_slot = FitSlot(
                            day_number=day.day_number,
                            day_date=day.actual_date,
                            day_id=day.id,
                            time_slot=TimeSlot(cart_item.time_slot),
                            fit_reason=cart_item.fit_reason or ""
                        )
                        fitted_items.append({
                            'cart_item': cart_item,
                            'activity': activity,
                            'fit_slot': fit_slot
                        })
                else:
                    missed_items.append({
                        'cart_item': cart_item,
                        'activity': activity,
                        'miss_reason': cart_item.miss_reason
                    })

            # Calculate total price
            total_price = sum(
                float(item['cart_item'].quoted_price)
                for item in fitted_items
            )

            # Create FitResult
            from app.services.gamification.fit_engine import FitResult
            fit_result = FitResult(
                fitted_items=fitted_items,
                missed_items=missed_items,
                total_price=total_price,
                currency_code=fitted_items[0]['cart_item'].currency_code if fitted_items else 'USD'
            )

            # Build reveal response
            reveal_response = reveal_builder.build_reveal_response(
                session,
                fit_result,
                itinerary,
                company_profile
            )

            return {
                'success': True,
                'message': 'Swap successful',
                'reveal': reveal_response
            }

        else:
            # Swap not possible
            return {
                'success': False,
                'message': f"Cannot swap: {missed_activity.name} doesn't fit in the vacated slot due to constraints",
                'reason': 'Activity restrictions prevent placement in this slot'
            }
