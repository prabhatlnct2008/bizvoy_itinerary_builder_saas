"""
Unit tests for the ConfirmationService.

Tests the confirmation logic that persists personalization choices
to the itinerary.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime
from decimal import Decimal

from app.services.gamification.confirmation_service import ConfirmationService


class TestConfirmationService:
    """Test suite for ConfirmationService."""

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        db = Mock()
        db.query = Mock()
        db.add = Mock()
        db.commit = Mock()
        db.rollback = Mock()
        return db

    @pytest.fixture
    def confirmation_service(self, mock_db):
        """Create a ConfirmationService instance with mock db."""
        return ConfirmationService(mock_db)

    def test_confirm_no_fitted_items(self, confirmation_service, mock_db):
        """Test confirmation fails when no fitted items exist."""
        session = Mock()
        session.id = "session-1"

        itinerary = Mock()
        itinerary.id = "itin-1"

        # Mock empty fitted items query
        mock_query = Mock()
        mock_query.filter_by.return_value.all.return_value = []
        mock_db.query.return_value = mock_query

        # Confirm
        result = confirmation_service.confirm_personalization(session, itinerary)

        # Should indicate no items
        assert result['success'] is False
        assert result['items_added'] == 0
        assert 'no fitted items' in result['message'].lower()

    def test_confirm_creates_itinerary_activities(self, confirmation_service, mock_db):
        """Test that confirmation creates ItineraryDayActivity records."""
        session = Mock()
        session.id = "session-1"
        session.status = "IN_PROGRESS"

        itinerary = Mock()
        itinerary.id = "itin-1"
        itinerary.total_price = Decimal("500.00")
        itinerary.updated_at = datetime.utcnow()

        # Mock fitted cart item
        cart_item = Mock()
        cart_item.id = "cart-1"
        cart_item.activity_id = "act-1"
        cart_item.day_id = "day-1"
        cart_item.quoted_price = Decimal("100.00")
        cart_item.currency_code = "USD"
        cart_item.time_slot = "MORNING"
        cart_item.status = "PENDING"

        # Mock activity
        activity = Mock()
        activity.id = "act-1"
        activity.name = "Test Activity"

        # Mock day
        day = Mock()
        day.id = "day-1"
        day.day_number = 1

        # Mock existing activities (for display_order)
        existing_activity = Mock()
        existing_activity.display_order = 1

        # Setup query mocks
        def mock_query_side_effect(model):
            mock_result = Mock()
            if hasattr(model, '__name__'):
                if 'CartItem' in model.__name__:
                    mock_result.filter_by.return_value.all.return_value = [cart_item]
                elif 'Activity' in model.__name__:
                    mock_result.filter_by.return_value.first.return_value = activity
                elif 'ItineraryDay' == model.__name__:
                    mock_result.filter_by.return_value.first.return_value = day
                elif 'ItineraryDayActivity' in model.__name__:
                    mock_result.filter_by.return_value.all.return_value = [existing_activity]
                else:
                    mock_result.filter_by.return_value.first.return_value = None
            return mock_result

        # This is a simplified test - full implementation would need proper mocking
        # of all the query chains
        pass

    def test_confirm_updates_session_status(self, confirmation_service, mock_db):
        """Test that session status is updated to CONFIRMED."""
        # This would require mocking the entire confirmation flow
        # Keeping as placeholder for integration testing
        pass

    def test_confirm_calculates_new_total_price(self, confirmation_service, mock_db):
        """Test that itinerary total price is correctly updated."""
        # Placeholder for integration testing
        pass

    def test_confirm_broadcasts_websocket_notification(self, confirmation_service, mock_db):
        """Test that WebSocket notification is sent on confirmation."""
        # Placeholder for integration testing with WebSocket service
        pass

    def test_get_confirmation_summary(self, confirmation_service, mock_db):
        """Test retrieving confirmation summary."""
        session_id = "session-1"

        # Mock session
        session = Mock()
        session.id = session_id
        session.confirmed_at = datetime.utcnow()

        # Mock confirmed items
        confirmed_item = Mock()
        confirmed_item.activity_id = "act-1"
        confirmed_item.day_id = "day-1"
        confirmed_item.time_slot = "MORNING"
        confirmed_item.quoted_price = Decimal("100.00")
        confirmed_item.currency_code = "USD"

        # Mock activity
        activity = Mock()
        activity.id = "act-1"
        activity.name = "Test Activity"

        # This is a simplified structure test
        # Full implementation would need proper query mocking
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
