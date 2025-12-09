"""
Interaction Recorder Service
Records and manages user interactions with the deck.
"""
from typing import Optional
from sqlalchemy.orm import Session
from app.models.personalization_session import PersonalizationSession, SessionStatus
from app.models.user_deck_interaction import UserDeckInteraction, InteractionAction
from app.models.itinerary_cart_item import ItineraryCartItem, CartItemStatus
from app.schemas.gamification import SwipeRequest
from datetime import datetime
import uuid


class InteractionRecorder:
    """Record user interactions with the deck"""

    def __init__(self, db: Session):
        self.db = db

    def record_swipe(
        self,
        session: PersonalizationSession,
        swipe_data: SwipeRequest
    ) -> UserDeckInteraction:
        """
        Record a swipe interaction.

        Args:
            session: The personalization session
            swipe_data: Swipe request data

        Returns:
            Created UserDeckInteraction
        """
        # Map action string to enum
        action_map = {
            "like": InteractionAction.like,
            "pass": InteractionAction.pass_,
            "save": InteractionAction.save,
        }
        action_key = str(swipe_data.action or "").lower()
        action = action_map.get(action_key, InteractionAction.pass_)

        # Create interaction record
        interaction = UserDeckInteraction(
            id=str(uuid.uuid4()),
            session_id=session.id,
            itinerary_id=session.itinerary_id,
            activity_id=swipe_data.activity_id,
            action=action,
            seconds_viewed=swipe_data.seconds_viewed or 0,
            card_position=swipe_data.card_position,
            swipe_velocity=swipe_data.swipe_velocity,
        )
        self.db.add(interaction)

        # Update session stats
        session.cards_viewed += 1
        session.last_interaction_at = datetime.utcnow()

        if action == InteractionAction.like:
            session.cards_liked += 1
            # Also add to cart
            self._add_to_cart(session, swipe_data.activity_id)
        elif action == InteractionAction.pass_:
            session.cards_passed += 1
        elif action == InteractionAction.save:
            session.cards_saved += 1
            self._add_to_cart(session, swipe_data.activity_id)

        self.db.commit()
        self.db.refresh(interaction)
        return interaction

    def update_session_stats(
        self,
        session: PersonalizationSession,
        time_delta_seconds: Optional[int] = None
    ) -> None:
        """Update session statistics"""
        if time_delta_seconds:
            session.total_time_seconds += time_delta_seconds

        session.last_interaction_at = datetime.utcnow()
        self.db.commit()

    def complete_session(self, session: PersonalizationSession) -> None:
        """Mark a session as completed"""
        session.status = SessionStatus.completed
        session.completed_at = datetime.utcnow()
        self.db.commit()

    def abandon_session(self, session: PersonalizationSession) -> None:
        """Mark a session as abandoned"""
        session.status = SessionStatus.abandoned
        self.db.commit()

    def _add_to_cart(self, session: PersonalizationSession, activity_id: str) -> None:
        """Add an activity to the cart"""
        # Check if already in cart
        existing = self.db.query(ItineraryCartItem).filter(
            ItineraryCartItem.session_id == session.id,
            ItineraryCartItem.activity_id == activity_id
        ).first()

        if existing:
            return

        # Create cart item
        cart_item = ItineraryCartItem(
            id=str(uuid.uuid4()),
            session_id=session.id,
            itinerary_id=session.itinerary_id,
            activity_id=activity_id,
            status=CartItemStatus.pending,
        )
        self.db.add(cart_item)

    def get_session_stats(self, session_id: str) -> dict:
        """Get statistics for a session"""
        session = self.db.query(PersonalizationSession).filter(
            PersonalizationSession.id == session_id
        ).first()

        if not session:
            return {}

        # Count cart items
        cart_count = self.db.query(ItineraryCartItem).filter(
            ItineraryCartItem.session_id == session_id
        ).count()

        return {
            "cards_viewed": session.cards_viewed,
            "cards_liked": session.cards_liked,
            "cards_passed": session.cards_passed,
            "cards_saved": session.cards_saved,
            "cart_items": cart_count,
            "total_time_seconds": session.total_time_seconds,
            "status": session.status.value,
        }
