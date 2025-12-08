"""
Reveal Builder - Constructs the reveal response after fit algorithm runs

This module builds the payload shown to users after the fit engine determines
which activities can be fitted into their itinerary and which cannot.
"""

from typing import List, Dict, Optional
from datetime import date, time
from app.services.gamification.fit_engine import TimeSlot, FitResult


class RevealBuilder:
    """
    Builds the reveal response payload shown to users after personalization.

    The reveal includes:
    - Fitted items: Activities successfully placed in the itinerary
    - Missed items: Activities that couldn't be fitted (with reasons and swap suggestions)
    - Saved items: Activities marked "Save for Later"
    - Summary statistics and pricing
    - Payment information from company profile
    """

    def build_reveal_response(
        self,
        session,
        fit_result: FitResult,
        itinerary,
        company_profile
    ) -> dict:
        """
        Build the complete reveal response payload.

        Args:
            session: PersonalizationSession instance
            fit_result: FitResult from the fit engine
            itinerary: Itinerary instance
            company_profile: CompanyProfile instance with payment info

        Returns:
            Dictionary with reveal response data
        """
        from app.models import InteractionAction

        # Build fitted items list
        fitted_items = [
            self._build_fitted_item(item['cart_item'], item['activity'], item['fit_slot'])
            for item in fit_result.fitted_items
        ]

        # Build missed items list
        missed_items = [
            self._build_missed_item(item['cart_item'], item['activity'])
            for item in fit_result.missed_items
        ]

        # Get saved items (activities marked "Save for Later")
        saved_items = []
        if hasattr(session, 'interactions'):
            saved_interactions = [
                i for i in session.interactions
                if i.action == InteractionAction.SAVED
            ]

            # Build saved items from interactions
            for interaction in saved_interactions:
                if hasattr(interaction, 'activity') and interaction.activity:
                    activity = interaction.activity
                    saved_items.append(self._build_deck_card(activity))

        # Build company payment info
        payment_info = None
        if company_profile:
            payment_info = {
                'payment_qr_code_url': getattr(company_profile, 'payment_qr_code_url', None),
                'bank_account_details': getattr(company_profile, 'bank_account_details', None),
                'payment_note': getattr(company_profile, 'payment_note', None),
            }

        return {
            'session_id': session.id,
            'fitted_items': fitted_items,
            'missed_items': missed_items,
            'saved_items': saved_items,
            'total_fitted': len(fitted_items),
            'total_liked': session.cards_liked or 0,
            'total_missed': len(missed_items),
            'added_price': float(fit_result.total_price),
            'currency_code': fit_result.currency_code,
            'itinerary_total_price': float(itinerary.total_price or 0) + float(fit_result.total_price),
            'payment_info': payment_info,
            'status': session.status.value if hasattr(session.status, 'value') else session.status
        }

    def _build_fitted_item(self, cart_item, activity, fit_slot) -> dict:
        """
        Build a FittedItem response object.

        Args:
            cart_item: ItineraryCartItem instance
            activity: Activity instance
            fit_slot: FitSlot where activity was placed

        Returns:
            Dictionary with fitted item details
        """
        return {
            'cart_item_id': cart_item.id,
            'activity_id': activity.id,
            'activity_name': activity.name,
            'activity_short_description': getattr(activity, 'short_description', None),
            'activity_location': getattr(activity, 'location_display', None),
            'activity_category': getattr(activity, 'category_label', None),
            'activity_duration': self._format_duration(activity),
            'activity_image_url': self._get_activity_image_url(activity),
            'activity_rating': float(getattr(activity, 'rating', 0) or 0),
            'day_number': fit_slot.day_number,
            'day_date': fit_slot.day_date.isoformat(),
            'day_id': fit_slot.day_id,
            'time_slot': fit_slot.time_slot.value,
            'time_slot_display': self._get_time_slot_display(fit_slot.time_slot.value),
            'fit_reason': fit_slot.fit_reason,
            'price': float(cart_item.quoted_price),
            'currency_code': cart_item.currency_code,
            'status': cart_item.status.value if hasattr(cart_item.status, 'value') else cart_item.status
        }

    def _build_missed_item(self, cart_item, activity) -> dict:
        """
        Build a MissedItem response object.

        Args:
            cart_item: ItineraryCartItem instance
            activity: Activity instance

        Returns:
            Dictionary with missed item details
        """
        # Build swap suggestion if available
        swap_suggestion = None
        if cart_item.swap_suggestion_activity_id:
            swap_suggestion = {
                'suggested_activity_id': cart_item.swap_suggestion_activity_id,
                'swap_text': f"Try swapping with another activity to make room"
            }

        return {
            'cart_item_id': cart_item.id,
            'activity_id': activity.id,
            'activity_name': activity.name,
            'activity_short_description': getattr(activity, 'short_description', None),
            'activity_location': getattr(activity, 'location_display', None),
            'activity_category': getattr(activity, 'category_label', None),
            'activity_duration': self._format_duration(activity),
            'activity_image_url': self._get_activity_image_url(activity),
            'activity_rating': float(getattr(activity, 'rating', 0) or 0),
            'miss_reason': cart_item.miss_reason,
            'swap_suggestion': swap_suggestion,
            'price': float(cart_item.quoted_price),
            'currency_code': cart_item.currency_code,
            'status': cart_item.status.value if hasattr(cart_item.status, 'value') else cart_item.status
        }

    def _build_deck_card(self, activity) -> dict:
        """
        Build a DeckCard response object for saved items.

        Args:
            activity: Activity instance

        Returns:
            Dictionary with deck card details
        """
        return {
            'activity_id': activity.id,
            'activity_name': activity.name,
            'activity_short_description': getattr(activity, 'short_description', None),
            'activity_location': getattr(activity, 'location_display', None),
            'activity_category': getattr(activity, 'category_label', None),
            'activity_duration': self._format_duration(activity),
            'activity_image_url': self._get_activity_image_url(activity),
            'activity_rating': float(getattr(activity, 'rating', 0) or 0),
            'price': float(getattr(activity, 'price_numeric', 0) or 0),
            'currency_code': getattr(activity, 'currency_code', 'USD'),
            'marketing_badge': getattr(activity, 'marketing_badge', None),
        }

    def _get_time_slot_display(self, slot: str) -> str:
        """
        Convert time slot enum to human-readable format.

        Args:
            slot: TimeSlot value (MORNING, AFTERNOON, EVENING)

        Returns:
            Human-readable time slot like 'Morning (9AM-12PM)'
        """
        slot_displays = {
            'MORNING': 'Morning (9AM-12PM)',
            'AFTERNOON': 'Afternoon (12PM-4PM)',
            'EVENING': 'Evening (4PM-8PM)',
        }
        return slot_displays.get(slot, slot)

    def _format_duration(self, activity) -> str:
        """
        Format activity duration as human-readable string.

        Args:
            activity: Activity instance

        Returns:
            Duration string like "2 hours" or "45 minutes"
        """
        duration_value = getattr(activity, 'default_duration_value', None)
        duration_unit = getattr(activity, 'default_duration_unit', None)

        if not duration_value:
            return "Duration varies"

        if duration_unit == 'minutes':
            if duration_value >= 60:
                hours = duration_value / 60
                return f"{hours:.1f} hours".replace('.0 ', ' ')
            return f"{duration_value} minutes"
        elif duration_unit == 'hours':
            return f"{duration_value} hours" if duration_value != 1 else "1 hour"
        elif duration_unit == 'days':
            return f"{duration_value} days" if duration_value != 1 else "1 day"
        else:
            return "Duration varies"

    def _get_activity_image_url(self, activity) -> Optional[str]:
        """
        Get the hero/cover image URL for an activity.

        Args:
            activity: Activity instance

        Returns:
            Image URL or None
        """
        # Try to get hero image from images relationship
        if hasattr(activity, 'images') and activity.images:
            hero_image = next(
                (img for img in activity.images if getattr(img, 'is_hero', False)),
                None
            )
            if hero_image:
                return getattr(hero_image, 'image_url', None)

            # Fall back to first image
            if activity.images:
                return getattr(activity.images[0], 'image_url', None)

        # Fall back to cover_image_url field if it exists
        cover_url = getattr(activity, 'cover_image_url', None)
        if cover_url:
            return cover_url

        return None
