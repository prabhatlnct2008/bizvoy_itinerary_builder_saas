"""
Mock models for unit testing without database dependencies.

These mocks simulate the database models to allow testing of services
without needing a real database connection.
"""

from datetime import datetime, date, time
from decimal import Decimal
from typing import List, Optional


class MockActivity:
    """Mock Activity model."""

    def __init__(
        self,
        id: str = "activity-1",
        agency_id: str = "agency-1",
        activity_type_id: str = "type-1",
        name: str = "Test Activity",
        category_label: Optional[str] = None,
        location_display: Optional[str] = None,
        short_description: Optional[str] = None,
        client_description: Optional[str] = None,
        default_duration_value: Optional[int] = 2,
        default_duration_unit: Optional[str] = "hours",
        rating: Optional[float] = 4.5,
        group_size_label: Optional[str] = None,
        cost_type: str = "extra",
        cost_display: Optional[str] = None,
        price_numeric: Optional[float] = 100.0,
        currency_code: str = "USD",
        marketing_badge: Optional[str] = None,
        review_count: int = 0,
        review_rating: Optional[float] = None,
        optimal_time_of_day: Optional[str] = None,
        blocked_days_of_week: Optional[List[int]] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        vibe_tags: Optional[List[str]] = None,
        is_active: bool = True,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.id = id
        self.agency_id = agency_id
        self.activity_type_id = activity_type_id
        self.name = name
        self.category_label = category_label
        self.location_display = location_display
        self.short_description = short_description
        self.client_description = client_description
        self.default_duration_value = default_duration_value
        self.default_duration_unit = default_duration_unit
        self.rating = Decimal(str(rating)) if rating else None
        self.group_size_label = group_size_label
        self.cost_type = cost_type
        self.cost_display = cost_display
        self.price_numeric = Decimal(str(price_numeric)) if price_numeric else None
        self.currency_code = currency_code
        self.marketing_badge = marketing_badge
        self.review_count = review_count
        self.review_rating = Decimal(str(review_rating)) if review_rating else None
        self.optimal_time_of_day = optimal_time_of_day
        self.blocked_days_of_week = blocked_days_of_week or []
        self.latitude = latitude
        self.longitude = longitude
        self.vibe_tags = vibe_tags or []
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
        self.images = []


class MockActivityImage:
    """Mock ActivityImage model."""

    def __init__(
        self,
        id: str = "image-1",
        activity_id: str = "activity-1",
        image_url: str = "https://example.com/image.jpg",
        is_hero: bool = False,
        display_order: int = 0,
    ):
        self.id = id
        self.activity_id = activity_id
        self.image_url = image_url
        self.is_hero = is_hero
        self.display_order = display_order


class MockItinerary:
    """Mock Itinerary model."""

    def __init__(
        self,
        id: str = "itinerary-1",
        agency_id: str = "agency-1",
        trip_name: str = "Test Trip",
        client_name: str = "Test Client",
        destination: str = "Rome",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        num_adults: int = 2,
        num_children: int = 0,
        status: str = "draft",
        total_price: Optional[float] = 0.0,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.id = id
        self.agency_id = agency_id
        self.trip_name = trip_name
        self.client_name = client_name
        self.destination = destination
        self.start_date = start_date or date(2025, 6, 15)
        self.end_date = end_date or date(2025, 6, 20)
        self.num_adults = num_adults
        self.num_children = num_children
        self.status = status
        self.total_price = Decimal(str(total_price)) if total_price else None
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
        self.days = []
        self.agency = None


class MockItineraryDay:
    """Mock ItineraryDay model."""

    def __init__(
        self,
        id: str = "day-1",
        itinerary_id: str = "itinerary-1",
        day_number: int = 1,
        actual_date: Optional[date] = None,
        title: Optional[str] = None,
        notes: Optional[str] = None,
    ):
        self.id = id
        self.itinerary_id = itinerary_id
        self.day_number = day_number
        self.actual_date = actual_date or date(2025, 6, 15)
        self.title = title
        self.notes = notes
        self.activities = []
        self.itinerary = None


class MockItineraryDayActivity:
    """Mock ItineraryDayActivity model."""

    def __init__(
        self,
        id: str = "day-activity-1",
        itinerary_day_id: str = "day-1",
        activity_id: str = "activity-1",
        display_order: int = 0,
        time_slot: Optional[str] = None,
        custom_notes: Optional[str] = None,
        custom_price: Optional[float] = None,
        is_locked_by_agency: bool = False,
        source_cart_item_id: Optional[str] = None,
        added_by_personalization: bool = False,
    ):
        self.id = id
        self.itinerary_day_id = itinerary_day_id
        self.activity_id = activity_id
        self.display_order = display_order
        self.time_slot = time_slot
        self.custom_notes = custom_notes
        self.custom_price = Decimal(str(custom_price)) if custom_price else None
        self.is_locked_by_agency = is_locked_by_agency
        self.source_cart_item_id = source_cart_item_id
        self.added_by_personalization = added_by_personalization
        self.activity = None
        self.itinerary_day = None


class MockPersonalizationSession:
    """Mock PersonalizationSession model."""

    def __init__(
        self,
        id: str = "session-1",
        itinerary_id: str = "itinerary-1",
        share_link_id: Optional[str] = None,
        device_id: Optional[str] = None,
        selected_vibes: Optional[List[str]] = None,
        deck_size: int = 20,
        cards_viewed: int = 0,
        cards_liked: int = 0,
        cards_passed: int = 0,
        cards_saved: int = 0,
        total_time_seconds: int = 0,
        status: str = "IN_PROGRESS",
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
        confirmed_at: Optional[datetime] = None,
    ):
        self.id = id
        self.itinerary_id = itinerary_id
        self.share_link_id = share_link_id
        self.device_id = device_id
        self.selected_vibes = selected_vibes or []
        self.deck_size = deck_size
        self.cards_viewed = cards_viewed
        self.cards_liked = cards_liked
        self.cards_passed = cards_passed
        self.cards_saved = cards_saved
        self.total_time_seconds = total_time_seconds
        self.status = status
        self.started_at = started_at or datetime.utcnow()
        self.completed_at = completed_at
        self.confirmed_at = confirmed_at
        self.interactions = []
        self.cart_items = []


class MockUserDeckInteraction:
    """Mock UserDeckInteraction model."""

    def __init__(
        self,
        id: str = "interaction-1",
        session_id: str = "session-1",
        itinerary_id: str = "itinerary-1",
        activity_id: str = "activity-1",
        action: str = "LIKED",
        seconds_viewed: int = 5,
        card_position: int = 1,
        swipe_velocity: Optional[float] = None,
        created_at: Optional[datetime] = None,
    ):
        self.id = id
        self.session_id = session_id
        self.itinerary_id = itinerary_id
        self.activity_id = activity_id
        self.action = action
        self.seconds_viewed = seconds_viewed
        self.card_position = card_position
        self.swipe_velocity = Decimal(str(swipe_velocity)) if swipe_velocity else None
        self.created_at = created_at or datetime.utcnow()
        self.activity = None


class MockItineraryCartItem:
    """Mock ItineraryCartItem model."""

    def __init__(
        self,
        id: str = "cart-1",
        session_id: str = "session-1",
        itinerary_id: str = "itinerary-1",
        activity_id: str = "activity-1",
        day_id: Optional[str] = None,
        quoted_price: float = 100.0,
        currency_code: str = "USD",
        time_slot: Optional[str] = None,
        fit_status: str = "FITTED",
        fit_reason: Optional[str] = None,
        miss_reason: Optional[str] = None,
        swap_suggestion_activity_id: Optional[str] = None,
        status: str = "PENDING",
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.id = id
        self.session_id = session_id
        self.itinerary_id = itinerary_id
        self.activity_id = activity_id
        self.day_id = day_id
        self.quoted_price = Decimal(str(quoted_price))
        self.currency_code = currency_code
        self.time_slot = time_slot
        self.fit_status = fit_status
        self.fit_reason = fit_reason
        self.miss_reason = miss_reason
        self.swap_suggestion_activity_id = swap_suggestion_activity_id
        self.status = status
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
        self.activity = None


class MockCompanyProfile:
    """Mock CompanyProfile model."""

    def __init__(
        self,
        id: str = "profile-1",
        agency_id: str = "agency-1",
        payment_qr_code_url: Optional[str] = None,
        bank_account_details: Optional[str] = None,
        payment_note: Optional[str] = None,
    ):
        self.id = id
        self.agency_id = agency_id
        self.payment_qr_code_url = payment_qr_code_url
        self.bank_account_details = bank_account_details
        self.payment_note = payment_note


class MockAgency:
    """Mock Agency model."""

    def __init__(
        self,
        id: str = "agency-1",
        name: str = "Test Agency",
        subdomain: str = "test",
        is_active: bool = True,
    ):
        self.id = id
        self.name = name
        self.subdomain = subdomain
        self.is_active = is_active
