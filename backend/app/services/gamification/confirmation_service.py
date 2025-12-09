"""
Confirmation Service - Persists personalization choices to itinerary

This module handles the final confirmation step where user selections
are permanently added to the itinerary as scheduled activities.
"""

from typing import Dict, List
from datetime import datetime
from decimal import Decimal


class ConfirmationService:
    """
    Confirms and persists personalization selections to the itinerary.

    When a user confirms their personalization:
    1. Fitted cart items become ItineraryDayActivity records
    2. Cart items are marked as CONFIRMED
    3. Itinerary total price is updated
    4. Session is marked as CONFIRMED
    5. WebSocket notification is sent to agency
    """

    def __init__(self, db_session):
        """
        Initialize confirmation service.

        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session

    def confirm_personalization(self, session, itinerary) -> dict:
        """
        Confirm and persist the personalization choices.

        Algorithm:
        1. Get all FITTED cart items for this session
        2. For each fitted item:
           a. Create ItineraryDayActivity record
           b. Mark cart item as CONFIRMED
        3. Update itinerary:
           a. Recalculate total_price
           b. Set personalization_completed = True (if field exists)
           c. Set personalization_completed_at = now
           d. Set personalization_session_id = session.id
        4. Update session status to CONFIRMED
        5. Broadcast WebSocket notification (if service available)
        6. Return confirmation response

        Args:
            session: PersonalizationSession instance
            itinerary: Itinerary instance

        Returns:
            Dictionary with confirmation response
        """
        from app.models import (
            ItineraryCartItem,
            FitStatus,
            CartItemStatus,
            SessionStatus
        )
        from app.models import Activity, ItineraryDay, ItineraryDayActivity

        # Get all fitted cart items for this session
        fitted_items = self.db.query(ItineraryCartItem).filter_by(
            session_id=session.id,
            fit_status=FitStatus.FITTED,
            status=CartItemStatus.PENDING
        ).all()

        if not fitted_items:
            return {
                'success': False,
                'message': 'No fitted items to confirm',
                'items_added': 0
            }

        items_added = 0
        added_price = Decimal('0.00')
        created_activities = []

        # Process each fitted item
        for cart_item in fitted_items:
            # Get the activity
            activity = self.db.query(Activity).filter_by(id=cart_item.activity_id).first()
            if not activity:
                continue

            # Get the day
            day = self.db.query(ItineraryDay).filter_by(id=cart_item.day_id).first()
            if not day:
                continue

            # Create ItineraryDayActivity record
            itinerary_activity = self._create_itinerary_day_activity(
                cart_item,
                activity,
                day
            )

            if itinerary_activity:
                self.db.add(itinerary_activity)
                created_activities.append(itinerary_activity)
                items_added += 1
                added_price += cart_item.quoted_price

                # Mark cart item as confirmed
                cart_item.status = CartItemStatus.CONFIRMED
                cart_item.updated_at = datetime.utcnow()

        # Update itinerary totals
        current_total = itinerary.total_price or Decimal('0.00')
        new_total = current_total + added_price
        itinerary.total_price = new_total

        # Update personalization tracking fields (if they exist)
        if hasattr(itinerary, 'personalization_completed'):
            itinerary.personalization_completed = True
        if hasattr(itinerary, 'personalization_completed_at'):
            itinerary.personalization_completed_at = datetime.utcnow()
        if hasattr(itinerary, 'personalization_session_id'):
            itinerary.personalization_session_id = session.id

        itinerary.updated_at = datetime.utcnow()

        # Update session status
        session.status = SessionStatus.CONFIRMED
        session.confirmed_at = datetime.utcnow()

        # Commit all changes
        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Failed to confirm personalization: {str(e)}")

        # Build payment info
        payment_info = self._get_payment_info(itinerary)

        # Send WebSocket notification (optional)
        self._broadcast_confirmation_notification(session, itinerary, items_added)

        return {
            'success': True,
            'message': f'Successfully added {items_added} activities to your itinerary',
            'items_added': items_added,
            'added_price': float(added_price),
            'new_total_price': float(new_total),
            'currency_code': fitted_items[0].currency_code if fitted_items else 'USD',
            'session_id': session.id,
            'itinerary_id': itinerary.id,
            'payment_info': payment_info,
            'confirmed_at': session.confirmed_at.isoformat() if session.confirmed_at else None
        }

    def _create_itinerary_day_activity(
        self,
        cart_item,
        activity,
        day
    ) -> object:
        """
        Create an ItineraryDayActivity record for a confirmed cart item.

        Args:
            cart_item: ItineraryCartItem being confirmed
            activity: Activity being added
            day: ItineraryDay where activity is placed

        Returns:
            ItineraryDayActivity instance
        """
        from app.models import ItineraryDayActivity

        # Get the highest display_order for this day
        existing_activities = self.db.query(ItineraryDayActivity).filter_by(
            itinerary_day_id=day.id
        ).all()

        max_order = max(
            (a.display_order for a in existing_activities),
            default=0
        )

        # Create new activity
        itinerary_activity = ItineraryDayActivity(
            itinerary_day_id=day.id,
            activity_id=activity.id,
            item_type='LIBRARY_ACTIVITY',  # Personalization adds library activities
            display_order=max_order + 1,
            time_slot=cart_item.time_slot,
            custom_notes=None,
            custom_price=cart_item.quoted_price
        )

        # Add source tracking if field exists
        if hasattr(itinerary_activity, 'source_cart_item_id'):
            itinerary_activity.source_cart_item_id = cart_item.id
        if hasattr(itinerary_activity, 'added_by_personalization'):
            itinerary_activity.added_by_personalization = True

        # Not locked by agency (user can modify)
        if hasattr(itinerary_activity, 'is_locked_by_agency'):
            itinerary_activity.is_locked_by_agency = 0  # Use 0 for SQLite compatibility

        return itinerary_activity

    def _get_payment_info(self, itinerary) -> dict:
        """
        Get payment information for the itinerary's agency.

        Args:
            itinerary: Itinerary instance

        Returns:
            Dictionary with payment information
        """
        from app.models import CompanyProfile

        # Get company profile for the agency
        company_profile = None
        if hasattr(itinerary, 'agency') and itinerary.agency:
            company_profile = self.db.query(CompanyProfile).filter_by(
                agency_id=itinerary.agency.id
            ).first()

        if not company_profile:
            return {
                'payment_qr_code_url': None,
                'bank_account_details': None,
                'payment_note': 'Please contact the agency for payment details.'
            }

        return {
            'payment_qr_code_url': getattr(company_profile, 'payment_qr_code_url', None),
            'bank_account_details': getattr(company_profile, 'bank_account_details', None),
            'payment_note': getattr(company_profile, 'payment_note', None)
        }

    def _broadcast_confirmation_notification(
        self,
        session,
        itinerary,
        items_added: int
    ):
        """
        Broadcast WebSocket notification about the confirmation.

        This notifies the agency that a client has completed personalization.

        Args:
            session: PersonalizationSession instance
            itinerary: Itinerary instance
            items_added: Number of activities added
        """
        try:
            # Try to import and use websocket service if available
            from app.services.websocket_service import broadcast_to_agency

            message = {
                'type': 'personalization_confirmed',
                'itinerary_id': itinerary.id,
                'itinerary_name': itinerary.trip_name,
                'client_name': itinerary.client_name,
                'items_added': items_added,
                'session_id': session.id,
                'timestamp': datetime.utcnow().isoformat()
            }

            # Broadcast to agency users
            if hasattr(itinerary, 'agency_id'):
                broadcast_to_agency(itinerary.agency_id, message)

        except ImportError:
            # WebSocket service not available, skip notification
            pass
        except Exception as e:
            # Log error but don't fail the confirmation
            print(f"Failed to send WebSocket notification: {str(e)}")

    def get_confirmation_summary(self, session_id: str) -> dict:
        """
        Get a summary of what was confirmed in a session.

        Useful for displaying a confirmation receipt.

        Args:
            session_id: PersonalizationSession ID

        Returns:
            Dictionary with confirmation summary
        """
        from app.models import (
            PersonalizationSession,
            ItineraryCartItem,
            CartItemStatus
        )
        from app.models import Activity

        # Get session
        session = self.db.query(PersonalizationSession).filter_by(id=session_id).first()
        if not session:
            return {'error': 'Session not found'}

        # Get confirmed items
        confirmed_items = self.db.query(ItineraryCartItem).filter_by(
            session_id=session_id,
            status=CartItemStatus.CONFIRMED
        ).all()

        # Build summary
        items_summary = []
        total_price = Decimal('0.00')

        for item in confirmed_items:
            activity = self.db.query(Activity).filter_by(id=item.activity_id).first()
            if activity:
                items_summary.append({
                    'activity_name': activity.name,
                    'day_number': item.day_id,  # Would need to join to get day_number
                    'time_slot': item.time_slot,
                    'price': float(item.quoted_price)
                })
                total_price += item.quoted_price

        return {
            'session_id': session_id,
            'confirmed_at': session.confirmed_at.isoformat() if session.confirmed_at else None,
            'items': items_summary,
            'items_count': len(items_summary),
            'total_price': float(total_price),
            'currency_code': confirmed_items[0].currency_code if confirmed_items else 'USD'
        }
