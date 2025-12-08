from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


# ============================================================
# ENUMS
# ============================================================

class PersonalizationPolicy(str):
    flexible = "flexible"
    additive = "additive"
    strict = "strict"


class SessionStatus(str):
    active = "active"
    completed = "completed"
    abandoned = "abandoned"


class InteractionAction(str):
    like = "like"
    pass_ = "pass"
    save = "save"


class CartItemStatus(str):
    pending = "pending"
    fitted = "fitted"
    missed = "missed"
    confirmed = "confirmed"
    rejected = "rejected"


class FitStatus(str):
    pending = "pending"
    fit = "fit"
    miss = "miss"


class TimeSlot(str):
    early_morning = "early_morning"
    morning = "morning"
    afternoon = "afternoon"
    evening = "evening"
    night = "night"


# ============================================================
# AGENCY VIBE SCHEMAS
# ============================================================

class AgencyVibeCreate(BaseModel):
    vibe_key: str = Field(..., min_length=1, max_length=50)
    display_name: str = Field(..., min_length=1, max_length=100)
    emoji: Optional[str] = Field(None, max_length=10)
    color_hex: Optional[str] = Field(None, max_length=7)
    is_enabled: bool = True
    display_order: int = 0


class AgencyVibeUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    emoji: Optional[str] = Field(None, max_length=10)
    color_hex: Optional[str] = Field(None, max_length=7)
    is_enabled: Optional[bool] = None
    display_order: Optional[int] = None


class AgencyVibeResponse(BaseModel):
    id: str
    agency_id: str
    vibe_key: str
    display_name: str
    emoji: Optional[str]
    color_hex: Optional[str]
    is_global: bool
    is_enabled: bool
    display_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# AGENCY PERSONALIZATION SETTINGS SCHEMAS
# ============================================================

class AgencyPersonalizationSettingsUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    default_deck_size: Optional[int] = Field(None, ge=5, le=50)
    personalization_policy: Optional[str] = None
    max_price_per_traveler: Optional[Decimal] = None
    max_price_per_day: Optional[Decimal] = None
    default_currency: Optional[str] = Field(None, max_length=10)
    allowed_activity_type_ids: Optional[List[str]] = None
    show_readiness_warnings: Optional[bool] = None


class AgencyPersonalizationSettingsResponse(BaseModel):
    id: str
    agency_id: str
    is_enabled: bool
    default_deck_size: int
    personalization_policy: str
    max_price_per_traveler: Optional[Decimal]
    max_price_per_day: Optional[Decimal]
    default_currency: str
    allowed_activity_type_ids: Optional[List[str]]
    show_readiness_warnings: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# PERSONALIZATION SESSION SCHEMAS
# ============================================================

class StartSessionRequest(BaseModel):
    selected_vibes: List[str] = Field(default_factory=list)
    device_id: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    itinerary_id: str
    selected_vibes: Optional[List[str]]
    deck_size: int
    cards_viewed: int
    cards_liked: int
    cards_passed: int
    cards_saved: int
    total_time_seconds: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    last_interaction_at: datetime

    class Config:
        from_attributes = True


class PersonalizationStatusResponse(BaseModel):
    enabled: bool
    has_active_session: bool
    session: Optional[SessionResponse]
    available_vibes: List[AgencyVibeResponse]
    policy: str


# ============================================================
# DECK SCHEMAS
# ============================================================

class DeckCard(BaseModel):
    activity_id: str
    name: str
    category_label: Optional[str]
    location_display: Optional[str]
    short_description: Optional[str]
    client_description: Optional[str]
    price_display: Optional[str]
    price_numeric: Optional[Decimal]
    currency_code: Optional[str]
    rating: Optional[Decimal]
    review_count: int
    marketing_badge: Optional[str]
    vibe_tags: Optional[List[str]]
    optimal_time_of_day: Optional[str]
    hero_image_url: Optional[str]
    highlights: Optional[List[str]]
    gamification_readiness_score: Decimal
    card_position: int


class DeckResponse(BaseModel):
    session_id: str
    cards: List[DeckCard]
    total_cards: int
    cards_remaining: int


# ============================================================
# SWIPE SCHEMAS
# ============================================================

class SwipeRequest(BaseModel):
    activity_id: str
    action: str  # "like", "pass", "save"
    seconds_viewed: Optional[Decimal] = 0
    card_position: Optional[int] = None
    swipe_velocity: Optional[Decimal] = None


class SwipeResponse(BaseModel):
    success: bool
    message: str
    cards_remaining: int
    cards_liked: int


# ============================================================
# REVEAL (COMPLETE) SCHEMAS
# ============================================================

class FittedItem(BaseModel):
    cart_item_id: str
    activity_id: str
    activity_name: str
    day_number: int
    day_date: str
    time_slot: Optional[str]
    fit_reason: Optional[str]
    quoted_price: Optional[Decimal]
    currency_code: str


class MissedItem(BaseModel):
    cart_item_id: str
    activity_id: str
    activity_name: str
    miss_reason: str
    swap_suggestion_activity_id: Optional[str]
    swap_suggestion_name: Optional[str]


class RevealResponse(BaseModel):
    session_id: str
    fitted_items: List[FittedItem]
    missed_items: List[MissedItem]
    total_liked: int
    total_fitted: int
    total_missed: int
    message: str


# ============================================================
# CONFIRM SCHEMAS
# ============================================================

class ConfirmRequest(BaseModel):
    cart_item_ids: List[str]  # IDs of items to confirm and add to itinerary


class ConfirmResponse(BaseModel):
    success: bool
    message: str
    added_count: int
    itinerary_id: str


# ============================================================
# SWAP SCHEMAS
# ============================================================

class SwapRequest(BaseModel):
    cart_item_id: str
    new_activity_id: str


class SwapResponse(BaseModel):
    success: bool
    message: str
    new_cart_item_id: Optional[str]
    fit_status: str
    fit_reason: Optional[str]


# ============================================================
# ACTIVITY GAMIFICATION UPDATE SCHEMAS
# ============================================================

class ActivityGamificationUpdate(BaseModel):
    price_numeric: Optional[Decimal] = None
    currency_code: Optional[str] = Field(None, max_length=10)
    marketing_badge: Optional[str] = Field(None, max_length=50)
    review_count: Optional[int] = Field(None, ge=0)
    review_rating: Optional[Decimal] = Field(None, ge=0, le=5)
    optimal_time_of_day: Optional[str] = Field(None, max_length=50)
    blocked_days_of_week: Optional[List[int]] = None  # 0-6
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    vibe_tags: Optional[List[str]] = None


class GamificationValidationResponse(BaseModel):
    activity_id: str
    activity_name: str
    readiness_score: Decimal
    is_ready: bool
    issues: List[str]


class GamificationStatusOverview(BaseModel):
    total_activities: int
    ready_activities: int
    not_ready_activities: int
    average_readiness_score: Decimal
    common_issues: Dict[str, int]


# ============================================================
# ANALYTICS SCHEMAS
# ============================================================

class PersonalizationAnalytics(BaseModel):
    total_sessions: int
    completed_sessions: int
    average_completion_rate: Decimal
    average_cards_viewed: Decimal
    average_cards_liked: Decimal
    average_session_duration: int  # seconds
    popular_vibes: List[Dict[str, Any]]
    popular_activities: List[Dict[str, Any]]
