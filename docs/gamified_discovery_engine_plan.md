# Implementation Plan: Gamified Discovery Engine

## 1. System Overview

Transform the shared itinerary viewer into an interactive "Tinder for Travel" experience. Users can rapidly swipe through activity cards to personalize their trip, with a bin-packing algorithm fitting selections into available time slots.

**Core User Journey:**
1. User clicks "Personalize Trip" on shared itinerary
2. Selects 1-3 vibe categories (Vibe Check)
3. Swipes through 15-20 curated activity cards
4. System fits liked activities into itinerary gaps (Magic Crunch)
5. User reviews personalized timeline and confirms (Reveal)
6. Payment via existing company QR/bank details

---

## 2. Key Decisions (Confirmed)

| Area | Decision | Details |
|------|----------|---------|
| **Vibe Categories** | Agency-configurable with global defaults | Global library of 10 vibes; agencies can enable/disable, rename, add custom vibes; auto-suggestions from Activity.tags and ActivityType |
| **Payment Flow** | Use existing Company Profile | Display company QR code, bank details, payment note from profile |
| **Multi-User** | Independent sessions per user | Each visitor gets own session (share_link_token + device_id); Group Mode as premium feature later |
| **Data Migration** | Auto-default + eligibility gating | Parse cost_display→price_numeric; prioritize complete activities; show readiness warnings |
| **Time-Slot Model** | Full precision fields, window logic in v1 | Store start_time/end_time, use Morning/Afternoon/Evening windows in fit algorithm |
| **Agency Controls** | Full controls from Day 1 | Global + itinerary-level settings; personalization policy modes |
| **Deck Source** | Template context + Agency library | Use template for locked slots & pacing; pull from all agency activities ranked by relevance |

---

## 3. Architecture Specification

### 3.1 Database Schema Changes

#### A. New Table: `agency_vibes` (Vibe Configuration)

```sql
CREATE TABLE IF NOT EXISTS "agency_vibes" (
    "id" VARCHAR(36) PRIMARY KEY,
    "agency_id" VARCHAR(36) NOT NULL,
    "vibe_key" VARCHAR(50) NOT NULL,           -- 'history', 'wine_dine', 'custom_xyz'
    "display_name" VARCHAR(100) NOT NULL,       -- Agency's custom name: "Heritage Walks"
    "emoji" VARCHAR(10) DEFAULT '✨',
    "color_hex" VARCHAR(7) DEFAULT '#6366F1',
    "is_global" BOOLEAN DEFAULT 0,              -- True for system defaults
    "is_enabled" BOOLEAN DEFAULT 1,
    "display_order" INTEGER DEFAULT 0,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE,
    UNIQUE("agency_id", "vibe_key")
);

-- Seed global defaults (copied to each agency on creation)
-- history, wine_dine, slow_paced, insta_spots, adrenaline, romantic, family, luxury, cultural, adventure
```

#### B. New Table: `agency_personalization_settings` (Agency Controls)

```sql
CREATE TABLE IF NOT EXISTS "agency_personalization_settings" (
    "id" VARCHAR(36) PRIMARY KEY,
    "agency_id" VARCHAR(36) NOT NULL UNIQUE,
    "is_enabled" BOOLEAN DEFAULT 1,
    "default_deck_size" INTEGER DEFAULT 20,     -- 15, 20, or 25
    "personalization_policy" VARCHAR(20) DEFAULT 'BALANCED',  -- 'STRICT', 'BALANCED', 'AGGRESSIVE'
    "max_price_per_traveler" DECIMAL(10, 2),    -- Optional cap
    "max_price_per_day" DECIMAL(10, 2),         -- Optional cap
    "default_currency" VARCHAR(3) DEFAULT 'USD',
    "allowed_activity_type_ids" JSON,           -- Filter by activity types
    "show_readiness_warnings" BOOLEAN DEFAULT 1,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE
);
```

**Personalization Policy Modes:**
- `STRICT`: Only add-ons to empty slots, no replacements
- `BALANCED`: Can replace flexible (non-locked) blocks
- `AGGRESSIVE`: Suggests bigger restructures, more swaps

#### C. Extend `activities` Table

```sql
-- Visuals & Marketing (The "Menu Card" Data)
ALTER TABLE activities ADD COLUMN price_numeric DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE activities ADD COLUMN currency_code VARCHAR(3) DEFAULT 'USD';
ALTER TABLE activities ADD COLUMN marketing_badge VARCHAR(50);  -- 'POPULAR', 'SELLING_FAST', 'SMALL_GROUP'
ALTER TABLE activities ADD COLUMN review_count INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN review_rating DECIMAL(3, 2);  -- 4.85 (more precise than existing rating)

-- Algorithm Logic (The "Bin Packing" Constraints)
ALTER TABLE activities ADD COLUMN optimal_time_of_day VARCHAR(20);  -- 'MORNING', 'AFTERNOON', 'EVENING', 'ANY'
ALTER TABLE activities ADD COLUMN blocked_days_of_week JSON;  -- e.g., [0, 6] for weekends (0=Sunday)
ALTER TABLE activities ADD COLUMN latitude DECIMAL(9, 6);
ALTER TABLE activities ADD COLUMN longitude DECIMAL(9, 6);
ALTER TABLE activities ADD COLUMN vibe_tags JSON;  -- ["history", "active", "romantic"] - references agency_vibes.vibe_key

-- Gamification Readiness Score (computed fields for display)
ALTER TABLE activities ADD COLUMN gamification_readiness_score INTEGER DEFAULT 0;  -- 0-100%
ALTER TABLE activities ADD COLUMN gamification_readiness_issues JSON;  -- ["missing_hero_image", "no_price"]
```

**Gamification Readiness Score Calculation:**
| Field | Weight |
|-------|--------|
| Has hero image | 25% |
| Has price_numeric > 0 | 25% |
| Has at least 1 vibe_tag | 20% |
| Has highlights (non-empty) | 15% |
| Has duration set | 10% |
| Has location coordinates | 5% |

Activities with score < 60% are excluded from deck or shown in "low quality tier".

#### D. Extend `template_day_activities` Table

```sql
ALTER TABLE template_day_activities ADD COLUMN start_time TIME;
ALTER TABLE template_day_activities ADD COLUMN end_time TIME;
ALTER TABLE template_day_activities ADD COLUMN is_locked_by_agency BOOLEAN DEFAULT 1;
ALTER TABLE template_day_activities ADD COLUMN time_slot VARCHAR(20) DEFAULT 'ANY';  -- 'MORNING', 'AFTERNOON', 'EVENING', 'ANY'
```

#### E. Extend `itinerary_day_activities` Table

```sql
ALTER TABLE itinerary_day_activities ADD COLUMN start_time TIME;
ALTER TABLE itinerary_day_activities ADD COLUMN end_time TIME;
ALTER TABLE itinerary_day_activities ADD COLUMN is_locked_by_agency BOOLEAN DEFAULT 0;
ALTER TABLE itinerary_day_activities ADD COLUMN time_slot VARCHAR(20) DEFAULT 'ANY';
ALTER TABLE itinerary_day_activities ADD COLUMN source_cart_item_id VARCHAR(36);  -- Traceability to cart
ALTER TABLE itinerary_day_activities ADD COLUMN added_by_personalization BOOLEAN DEFAULT 0;
```

#### F. Extend `itineraries` Table

```sql
ALTER TABLE itineraries ADD COLUMN personalization_enabled BOOLEAN DEFAULT 0;
ALTER TABLE itineraries ADD COLUMN personalization_policy VARCHAR(20);  -- Override agency default
ALTER TABLE itineraries ADD COLUMN personalization_lock_policy VARCHAR(20) DEFAULT 'RELAXED';  -- 'STRICT', 'RELAXED'
ALTER TABLE itineraries ADD COLUMN personalization_completed BOOLEAN DEFAULT 0;
ALTER TABLE itineraries ADD COLUMN personalization_completed_at DATETIME;
ALTER TABLE itineraries ADD COLUMN personalization_session_id VARCHAR(36);  -- Active/last session
```

#### G. New Table: `personalization_sessions`

```sql
CREATE TABLE IF NOT EXISTS "personalization_sessions" (
    "id" VARCHAR(36) PRIMARY KEY,
    "itinerary_id" VARCHAR(36) NOT NULL,
    "share_link_id" VARCHAR(36),              -- Which share link was used
    "device_id" VARCHAR(100),                  -- Browser fingerprint for multi-user tracking
    "selected_vibes" JSON,                    -- ["history", "wine_dine"]
    "deck_size" INTEGER DEFAULT 20,
    "cards_viewed" INTEGER DEFAULT 0,
    "cards_liked" INTEGER DEFAULT 0,
    "cards_passed" INTEGER DEFAULT 0,
    "cards_saved" INTEGER DEFAULT 0,
    "total_time_seconds" INTEGER DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'CONFIRMED', 'ABANDONED'
    "started_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "confirmed_at" DATETIME,
    "user_agent" TEXT,
    "ip_hash" VARCHAR(64),                    -- Anonymized for analytics
    FOREIGN KEY("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE,
    FOREIGN KEY("share_link_id") REFERENCES "share_links"("id") ON DELETE SET NULL
);

CREATE INDEX idx_sessions_itinerary ON personalization_sessions(itinerary_id);
CREATE INDEX idx_sessions_device ON personalization_sessions(device_id);
```

#### H. New Table: `user_deck_interactions`

```sql
CREATE TABLE IF NOT EXISTS "user_deck_interactions" (
    "id" VARCHAR(36) PRIMARY KEY,
    "session_id" VARCHAR(36) NOT NULL,
    "itinerary_id" VARCHAR(36) NOT NULL,
    "activity_id" VARCHAR(36) NOT NULL,
    "action" VARCHAR(10) NOT NULL,            -- 'LIKED', 'PASSED', 'SAVED'
    "seconds_viewed" INTEGER DEFAULT 0,
    "card_position" INTEGER,                  -- Position in deck (1-20)
    "swipe_velocity" DECIMAL(5, 2),           -- For analytics: fast vs deliberate
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("session_id") REFERENCES "personalization_sessions"("id") ON DELETE CASCADE,
    FOREIGN KEY("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE,
    FOREIGN KEY("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE
);

CREATE INDEX idx_deck_interactions_session ON user_deck_interactions(session_id);
CREATE INDEX idx_deck_interactions_itinerary ON user_deck_interactions(itinerary_id);
```

#### I. New Table: `itinerary_cart_items`

```sql
CREATE TABLE IF NOT EXISTS "itinerary_cart_items" (
    "id" VARCHAR(36) PRIMARY KEY,
    "session_id" VARCHAR(36) NOT NULL,
    "itinerary_id" VARCHAR(36) NOT NULL,
    "activity_id" VARCHAR(36) NOT NULL,
    "day_id" VARCHAR(36),                     -- Which day it was fitted into
    "quoted_price" DECIMAL(10, 2) NOT NULL,
    "currency_code" VARCHAR(3) DEFAULT 'USD',
    "time_slot" VARCHAR(20),                  -- 'MORNING', 'AFTERNOON', 'EVENING'
    "fit_status" VARCHAR(20) DEFAULT 'FITTED', -- 'FITTED', 'MISSED', 'SWAPPED'
    "fit_reason" VARCHAR(200),                -- Why it was fitted here
    "miss_reason" VARCHAR(200),               -- Why it didn't fit
    "swap_suggestion_activity_id" VARCHAR(36), -- Suggested swap target
    "status" VARCHAR(20) DEFAULT 'PENDING',   -- 'PENDING', 'CONFIRMED', 'CANCELLED'
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("session_id") REFERENCES "personalization_sessions"("id") ON DELETE CASCADE,
    FOREIGN KEY("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE,
    FOREIGN KEY("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE,
    FOREIGN KEY("day_id") REFERENCES "itinerary_days"("id") ON DELETE SET NULL
);

CREATE INDEX idx_cart_items_session ON itinerary_cart_items(session_id);
CREATE INDEX idx_cart_items_itinerary ON itinerary_cart_items(itinerary_id);
```

---

### 3.2 SQLAlchemy Models

#### New Model: `AgencyVibe`

```python
# backend/app/models/agency_vibe.py

class AgencyVibe(Base):
    __tablename__ = "agency_vibes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)
    vibe_key = Column(String(50), nullable=False)
    display_name = Column(String(100), nullable=False)
    emoji = Column(String(10), default="✨")
    color_hex = Column(String(7), default="#6366F1")
    is_global = Column(Boolean, default=False)
    is_enabled = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    agency = relationship("Agency", back_populates="vibes")

    __table_args__ = (
        UniqueConstraint('agency_id', 'vibe_key', name='uq_agency_vibe_key'),
    )
```

#### New Model: `AgencyPersonalizationSettings`

```python
# backend/app/models/agency_personalization_settings.py

class PersonalizationPolicy(str, Enum):
    STRICT = "STRICT"      # Add-ons only
    BALANCED = "BALANCED"  # Can replace flexible blocks
    AGGRESSIVE = "AGGRESSIVE"  # Bigger restructures

class AgencyPersonalizationSettings(Base):
    __tablename__ = "agency_personalization_settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, unique=True)
    is_enabled = Column(Boolean, default=True)
    default_deck_size = Column(Integer, default=20)
    personalization_policy = Column(String(20), default=PersonalizationPolicy.BALANCED)
    max_price_per_traveler = Column(Numeric(10, 2))
    max_price_per_day = Column(Numeric(10, 2))
    default_currency = Column(String(3), default="USD")
    allowed_activity_type_ids = Column(JSON)
    show_readiness_warnings = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    agency = relationship("Agency", back_populates="personalization_settings")
```

#### New Model: `PersonalizationSession`

```python
# backend/app/models/personalization_session.py

class SessionStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CONFIRMED = "CONFIRMED"
    ABANDONED = "ABANDONED"

class PersonalizationSession(Base):
    __tablename__ = "personalization_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    share_link_id = Column(String(36), ForeignKey("share_links.id", ondelete="SET NULL"))
    device_id = Column(String(100))
    selected_vibes = Column(JSON)
    deck_size = Column(Integer, default=20)
    cards_viewed = Column(Integer, default=0)
    cards_liked = Column(Integer, default=0)
    cards_passed = Column(Integer, default=0)
    cards_saved = Column(Integer, default=0)
    total_time_seconds = Column(Integer, default=0)
    status = Column(String(20), default=SessionStatus.IN_PROGRESS)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    confirmed_at = Column(DateTime)
    user_agent = Column(Text)
    ip_hash = Column(String(64))

    # Relationships
    itinerary = relationship("Itinerary", back_populates="personalization_sessions")
    share_link = relationship("ShareLink")
    interactions = relationship("UserDeckInteraction", back_populates="session", cascade="all, delete-orphan")
    cart_items = relationship("ItineraryCartItem", back_populates="session", cascade="all, delete-orphan")
```

#### New Model: `UserDeckInteraction`

```python
# backend/app/models/user_deck_interaction.py

class InteractionAction(str, Enum):
    LIKED = "LIKED"
    PASSED = "PASSED"
    SAVED = "SAVED"

class UserDeckInteraction(Base):
    __tablename__ = "user_deck_interactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("personalization_sessions.id", ondelete="CASCADE"), nullable=False)
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(10), nullable=False)
    seconds_viewed = Column(Integer, default=0)
    card_position = Column(Integer)
    swipe_velocity = Column(Numeric(5, 2))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("PersonalizationSession", back_populates="interactions")
    itinerary = relationship("Itinerary", back_populates="deck_interactions")
    activity = relationship("Activity", back_populates="deck_interactions")
```

#### New Model: `ItineraryCartItem`

```python
# backend/app/models/itinerary_cart_item.py

class CartItemStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"

class FitStatus(str, Enum):
    FITTED = "FITTED"
    MISSED = "MISSED"
    SWAPPED = "SWAPPED"

class ItineraryCartItem(Base):
    __tablename__ = "itinerary_cart_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("personalization_sessions.id", ondelete="CASCADE"), nullable=False)
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    day_id = Column(String(36), ForeignKey("itinerary_days.id", ondelete="SET NULL"))
    quoted_price = Column(Numeric(10, 2), nullable=False)
    currency_code = Column(String(3), default="USD")
    time_slot = Column(String(20))
    fit_status = Column(String(20), default=FitStatus.FITTED)
    fit_reason = Column(String(200))
    miss_reason = Column(String(200))
    swap_suggestion_activity_id = Column(String(36))
    status = Column(String(20), default=CartItemStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    session = relationship("PersonalizationSession", back_populates="cart_items")
    itinerary = relationship("Itinerary", back_populates="cart_items")
    activity = relationship("Activity")
    day = relationship("ItineraryDay")
```

---

### 3.3 API Contract (FastAPI)

#### Public Gamification Endpoints (No Auth Required)

| Method | Endpoint | Request Schema | Response Schema | Description |
|--------|----------|----------------|-----------------|-------------|
| GET | `/public/itinerary/{token}/personalization/status` | - | `PersonalizationStatusResponse` | Check if enabled, get vibes, check existing sessions |
| POST | `/public/itinerary/{token}/personalization/start` | `StartSessionRequest` | `SessionResponse` | Start session with vibes; includes device_id |
| GET | `/public/itinerary/{token}/personalization/deck` | `?session_id=` | `DeckResponse` | Get curated deck of 15-25 cards |
| POST | `/public/itinerary/{token}/personalization/swipe` | `SwipeRequest` | `SwipeResponse` | Record like/pass/save interaction |
| POST | `/public/itinerary/{token}/personalization/complete` | `CompleteRequest` | `RevealResponse` | Run fit algorithm, return results |
| POST | `/public/itinerary/{token}/personalization/confirm` | `ConfirmRequest` | `ConfirmResponse` | Confirm selections, update itinerary |
| POST | `/public/itinerary/{token}/personalization/swap` | `SwapRequest` | `SwapResponse` | Swap a missed item with a fitted one |
| GET | `/public/itinerary/{token}/personalization/resume` | `?device_id=` | `ResumeResponse` | Resume abandoned session (within 24h) |

#### Agency Endpoints (Auth Required)

| Method | Endpoint | Request Schema | Response Schema | Description |
|--------|----------|----------------|-----------------|-------------|
| **Personalization Settings** |
| GET | `/agency/personalization/settings` | - | `AgencyPersonalizationSettingsResponse` | Get agency's global settings |
| PUT | `/agency/personalization/settings` | `AgencyPersonalizationSettingsUpdate` | `AgencyPersonalizationSettingsResponse` | Update global settings |
| **Vibes Management** |
| GET | `/agency/personalization/vibes` | - | `List[AgencyVibeResponse]` | Get all vibes (enabled + disabled) |
| POST | `/agency/personalization/vibes` | `AgencyVibeCreate` | `AgencyVibeResponse` | Create custom vibe |
| PUT | `/agency/personalization/vibes/{id}` | `AgencyVibeUpdate` | `AgencyVibeResponse` | Update vibe (rename, color, enable/disable) |
| DELETE | `/agency/personalization/vibes/{id}` | - | - | Delete custom vibe (not global) |
| POST | `/agency/personalization/vibes/reorder` | `VibeReorderRequest` | `List[AgencyVibeResponse]` | Reorder vibes |
| **Itinerary Controls** |
| PUT | `/itineraries/{id}/personalization` | `ItineraryPersonalizationUpdate` | `ItineraryResponse` | Enable/configure for specific itinerary |
| GET | `/itineraries/{id}/personalization/analytics` | - | `PersonalizationAnalytics` | View session analytics for itinerary |
| **Activity Gamification** |
| PUT | `/activities/{id}/gamification` | `ActivityGamificationUpdate` | `ActivityResponse` | Update gamification fields |
| POST | `/activities/{id}/gamification/validate` | - | `GamificationValidationResponse` | Check readiness score |
| GET | `/agency/activities/gamification-status` | - | `GamificationStatusOverview` | Overview: X% of activities game-ready |

---

### 3.4 Pydantic Schemas

```python
# backend/app/schemas/gamification.py

from decimal import Decimal
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import date, datetime

# === Agency Vibes ===
class AgencyVibeCreate(BaseModel):
    vibe_key: str = Field(..., min_length=2, max_length=50, pattern="^[a-z_]+$")
    display_name: str = Field(..., min_length=2, max_length=100)
    emoji: str = Field(default="✨", max_length=10)
    color_hex: str = Field(default="#6366F1", pattern="^#[0-9A-Fa-f]{6}$")

class AgencyVibeUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=100)
    emoji: Optional[str] = Field(None, max_length=10)
    color_hex: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    is_enabled: Optional[bool] = None

class AgencyVibeResponse(BaseModel):
    id: str
    vibe_key: str
    display_name: str
    emoji: str
    color_hex: str
    is_global: bool
    is_enabled: bool
    display_order: int

# === Agency Settings ===
class AgencyPersonalizationSettingsUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    default_deck_size: Optional[int] = Field(None, ge=10, le=30)
    personalization_policy: Optional[Literal["STRICT", "BALANCED", "AGGRESSIVE"]] = None
    max_price_per_traveler: Optional[Decimal] = None
    max_price_per_day: Optional[Decimal] = None
    default_currency: Optional[str] = Field(None, min_length=3, max_length=3)
    allowed_activity_type_ids: Optional[List[str]] = None
    show_readiness_warnings: Optional[bool] = None

class AgencyPersonalizationSettingsResponse(BaseModel):
    is_enabled: bool
    default_deck_size: int
    personalization_policy: str
    max_price_per_traveler: Optional[Decimal]
    max_price_per_day: Optional[Decimal]
    default_currency: str
    allowed_activity_type_ids: Optional[List[str]]
    show_readiness_warnings: bool
    game_ready_activity_count: int
    total_activity_count: int
    readiness_percentage: int

# === Session ===
class StartSessionRequest(BaseModel):
    selected_vibes: List[str] = Field(..., min_items=1, max_items=3)
    device_id: Optional[str] = None  # Browser fingerprint

class SessionResponse(BaseModel):
    session_id: str
    deck_size: int
    itinerary_destination: str
    available_vibes: List[AgencyVibeResponse]

class PersonalizationStatusResponse(BaseModel):
    personalization_enabled: bool
    personalization_completed: bool
    available_vibes: List[AgencyVibeResponse]
    existing_session_id: Optional[str]  # For resume
    company_payment_info: Optional[dict]  # QR code, bank details

# === Deck ===
class DeckCard(BaseModel):
    activity_id: str
    name: str
    location_display: str
    short_description: str
    hero_image_url: Optional[str]
    price_numeric: Decimal
    currency_code: str
    duration_display: str
    rating: Optional[float]
    review_count: int
    marketing_badge: Optional[str]
    highlights: List[str]
    vibe_tags: List[str]
    vibe_display_names: List[str]  # Resolved from agency vibes
    card_position: int
    gamification_score: int

class DeckResponse(BaseModel):
    session_id: str
    cards: List[DeckCard]
    total_cards: int
    deck_built_from: str  # "template_context" or "agency_library"

# === Swipe ===
class SwipeRequest(BaseModel):
    session_id: str
    activity_id: str
    action: Literal["LIKED", "PASSED", "SAVED"]
    seconds_viewed: int = 0
    swipe_velocity: Optional[float] = None

class SwipeResponse(BaseModel):
    cards_remaining: int
    liked_count: int
    saved_count: int
    running_total: Decimal
    currency_code: str

# === Complete/Reveal ===
class FittedItem(BaseModel):
    cart_item_id: str
    activity_id: str
    activity_name: str
    day_number: int
    day_date: date
    time_slot: str
    time_slot_display: str  # "Morning (9AM-12PM)"
    price: Decimal
    duration_display: str
    hero_image_url: Optional[str]
    fit_reason: str  # "Best match for evening slot on Day 2"

class MissedItem(BaseModel):
    activity_id: str
    activity_name: str
    price: Decimal
    hero_image_url: Optional[str]
    reason: str
    swap_suggestion: Optional[str]
    swap_target_activity_id: Optional[str]

class RevealResponse(BaseModel):
    session_id: str
    personalization_policy: str
    fitted_items: List[FittedItem]
    missed_items: List[MissedItem]
    saved_items: List[DeckCard]  # Items marked "Save for Later"
    total_fitted: int
    total_liked: int
    added_price: Decimal
    currency_code: str
    company_payment_info: dict  # QR, bank details, payment note

# === Confirm ===
class ConfirmRequest(BaseModel):
    session_id: str

class ConfirmResponse(BaseModel):
    success: bool
    itinerary_id: str
    items_added: int
    new_total_price: Decimal
    payment_instructions: str
    company_qr_code_url: Optional[str]
    company_bank_details: Optional[dict]

# === Swap ===
class SwapRequest(BaseModel):
    session_id: str
    missed_activity_id: str
    replace_activity_id: str

class SwapResponse(BaseModel):
    success: bool
    updated_fitted_items: List[FittedItem]
    updated_missed_items: List[MissedItem]
    new_added_price: Decimal

# === Activity Gamification ===
class ActivityGamificationUpdate(BaseModel):
    price_numeric: Optional[Decimal] = None
    currency_code: Optional[str] = None
    marketing_badge: Optional[str] = None
    review_count: Optional[int] = None
    review_rating: Optional[float] = Field(None, ge=0, le=5)
    optimal_time_of_day: Optional[Literal["MORNING", "AFTERNOON", "EVENING", "ANY"]] = None
    blocked_days_of_week: Optional[List[int]] = None  # 0=Sunday, 6=Saturday
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    vibe_tags: Optional[List[str]] = None

class GamificationValidationResponse(BaseModel):
    activity_id: str
    readiness_score: int  # 0-100
    is_game_ready: bool  # score >= 60
    issues: List[str]  # ["missing_hero_image", "no_vibe_tags"]
    suggestions: List[str]  # ["Add a hero image for best card presentation"]

class GamificationStatusOverview(BaseModel):
    total_activities: int
    game_ready_count: int
    readiness_percentage: int
    top_issues: List[dict]  # [{"issue": "missing_hero_image", "count": 15}]

# === Analytics ===
class PersonalizationAnalytics(BaseModel):
    itinerary_id: str
    total_sessions: int
    completed_sessions: int
    confirmed_sessions: int
    abandoned_sessions: int
    completion_rate: float
    confirmation_rate: float
    avg_cards_liked: float
    avg_time_seconds: float
    total_revenue_added: Decimal
    most_liked_activities: List[dict]
    most_passed_activities: List[dict]
    vibe_popularity: List[dict]
```

---

### 3.5 Frontend Components

```
frontend/src/features/personalization/
├── components/
│   ├── PersonalizationEntry.tsx      # CTA button on shared itinerary
│   ├── VibeCheck.tsx                 # Floating bubble selection screen
│   ├── VibeBubble.tsx                # Individual bubble with animation
│   ├── SwipeDeck.tsx                 # Main card stack container
│   ├── SwipeCard.tsx                 # Individual activity card
│   ├── CardFlip.tsx                  # Flip animation for card details
│   ├── SwipeOverlay.tsx              # YES/NOPE overlay during swipe
│   ├── ProgressBar.tsx               # Deck progress indicator
│   ├── MagicCrunch.tsx               # Loading animation with map/pins
│   ├── RevealTimeline.tsx            # Result screen with timeline
│   ├── TimelineDay.tsx               # Single day in timeline
│   ├── TimelineActivity.tsx          # Activity block (locked vs flexible)
│   ├── MissedConnections.tsx         # Bottom sheet for missed items
│   ├── SwapModal.tsx                 # Confirm swap dialog
│   ├── ConfirmFooter.tsx             # Sticky footer with total + CTA
│   ├── PaymentInfo.tsx               # Company QR/bank details display
│   └── SavedForLater.tsx             # Expandable saved items section
├── hooks/
│   ├── useSwipeGesture.ts            # Touch/mouse swipe detection
│   ├── usePersonalization.ts         # API calls and state management
│   ├── useHaptics.ts                 # Vibration feedback
│   ├── useDeviceId.ts                # Browser fingerprint for sessions
│   └── useDeckPrefetch.ts            # Image prefetching
├── animations/
│   ├── cardAnimations.ts             # Framer Motion variants
│   ├── bubbleAnimations.ts           # Vibe bubble animations
│   └── confetti.ts                   # Confetti effect on reveal
├── pages/
│   ├── PersonalizationFlow.tsx       # Main flow container/router
│   └── PersonalizationComplete.tsx   # Post-confirmation page
├── types/
│   └── personalization.ts            # TypeScript interfaces
└── utils/
    └── readinessCalculator.ts        # Client-side score helper
```

#### Agency-Side Components

```
frontend/src/features/agency-settings/
├── PersonalizationSettings.tsx       # Global agency settings page
├── VibesManager.tsx                  # Manage vibes (CRUD)
├── VibeEditor.tsx                    # Edit single vibe
├── ReadinessOverview.tsx             # Activity readiness dashboard
└── PersonalizationAnalyticsDashboard.tsx

frontend/src/features/activities/
├── ActivityGamificationFields.tsx    # Gamification fields in edit form
└── GamificationScoreBadge.tsx        # Readiness score indicator

frontend/src/features/itineraries/
├── PersonalizationToggle.tsx         # Enable/configure per itinerary
└── PersonalizationStats.tsx          # Session stats on itinerary detail
```

---

### 3.6 Service Layer Architecture

```
backend/app/services/gamification/
├── __init__.py
├── vibe_service.py               # Manage agency vibes
├── settings_service.py           # Agency personalization settings
├── deck_builder.py               # Curate activity deck
├── readiness_calculator.py       # Calculate gamification scores
├── interaction_recorder.py       # Persist swipe actions
├── fit_engine.py                 # Bin-packing algorithm
├── reveal_builder.py             # Construct reveal payload
└── analytics_service.py          # Session analytics
```

#### Deck Builder Service

```python
# deck_builder.py

class DeckBuilder:
    """Curates a deck of activities based on user preferences and template context."""

    def build_deck(
        self,
        db: Session,
        itinerary: Itinerary,
        session: PersonalizationSession,
        agency_settings: AgencyPersonalizationSettings
    ) -> List[Activity]:
        """
        Algorithm:
        1. Get template context (destination, locked activities, pacing)
        2. Get all agency activities with gamification_readiness_score >= 60
        3. Filter by:
           - Matching destination (fuzzy)
           - Not already in itinerary
           - Allowed activity types (if configured)
           - Price within caps (if configured)
        4. Score each activity:
           - Vibe tag overlap with session.selected_vibes (+40 max)
           - Review rating * 5 (+25 max)
           - Gamification readiness score / 5 (+20 max)
           - Recency boost (+10 if added recently)
           - Variety penalty (-10 if 3+ of same type already in deck)
        5. Sort by score descending
        6. Return top N (agency_settings.default_deck_size)
        """
        pass

    def _calculate_activity_score(
        self,
        activity: Activity,
        selected_vibes: List[str],
        existing_types: Dict[str, int]
    ) -> float:
        pass
```

#### Fit Engine Service

```python
# fit_engine.py

class FitEngine:
    """Fits liked activities into itinerary time slots using bin-packing."""

    TIME_WINDOWS = {
        "MORNING": {"start": time(9, 0), "end": time(12, 0), "minutes": 180},
        "AFTERNOON": {"start": time(12, 0), "end": time(16, 0), "minutes": 240},
        "EVENING": {"start": time(16, 0), "end": time(20, 0), "minutes": 240},
    }

    def fit_activities(
        self,
        db: Session,
        itinerary: Itinerary,
        session: PersonalizationSession,
        policy: str  # STRICT, BALANCED, AGGRESSIVE
    ) -> FitResult:
        """
        Algorithm:
        1. Load itinerary days with existing activities
        2. For each day, calculate available windows:
           - STRICT: Only truly empty slots
           - BALANCED: Empty slots + can replace non-locked items
           - AGGRESSIVE: All slots except locked
        3. Get liked activities from session interactions
        4. Sort by priority: price (high→low), then duration (long→short)
        5. For each activity:
           a. Check optimal_time_of_day preference
           b. Check blocked_days_of_week against itinerary dates
           c. Find best available window (closest to preferred time)
           d. If fit: create cart item with fit_reason
           e. If no fit: add to missed with miss_reason + swap suggestion
        6. Return FitResult with all details
        """
        pass

    def _find_best_window(
        self,
        activity: Activity,
        day: ItineraryDay,
        available_windows: List[TimeWindow],
        policy: str
    ) -> Optional[FitSlot]:
        pass

    def _generate_swap_suggestion(
        self,
        missed_activity: Activity,
        fitted_items: List[ItineraryCartItem]
    ) -> Optional[str]:
        """Find a fitted item that could be swapped for this missed one."""
        pass
```

#### Readiness Calculator Service

```python
# readiness_calculator.py

class ReadinessCalculator:
    """Calculates gamification readiness score for activities."""

    WEIGHTS = {
        "has_hero_image": 25,
        "has_price": 25,
        "has_vibe_tags": 20,
        "has_highlights": 15,
        "has_duration": 10,
        "has_coordinates": 5,
    }

    def calculate_score(self, activity: Activity) -> Tuple[int, List[str]]:
        """Returns (score 0-100, list of issues)."""
        score = 0
        issues = []

        # Check hero image
        hero = next((img for img in activity.images if img.is_hero), None)
        if hero:
            score += self.WEIGHTS["has_hero_image"]
        else:
            issues.append("missing_hero_image")

        # Check price
        if activity.price_numeric and activity.price_numeric > 0:
            score += self.WEIGHTS["has_price"]
        else:
            issues.append("no_price")

        # ... etc

        return score, issues

    def batch_calculate(self, activities: List[Activity]) -> Dict[str, Tuple[int, List[str]]]:
        """Calculate scores for multiple activities efficiently."""
        pass
```

---

## 4. Implementation Details

### 4.1 Auto-Migration Logic

When the feature launches, existing data needs smart defaults:

```python
# Migration script for existing activities

def migrate_activity_gamification_data(db: Session):
    """Auto-populate gamification fields from existing data."""

    activities = db.query(Activity).all()

    for activity in activities:
        # 1. Parse price from cost_display
        if activity.cost_display and not activity.price_numeric:
            parsed = parse_price(activity.cost_display)  # "$85" -> 85.00
            if parsed:
                activity.price_numeric = parsed
                activity.currency_code = detect_currency(activity.cost_display)

        # 2. Inherit currency from agency
        if not activity.currency_code:
            activity.currency_code = activity.agency.default_currency or "USD"

        # 3. Auto-derive vibe_tags from existing tags
        if activity.tags and not activity.vibe_tags:
            activity.vibe_tags = derive_vibes_from_tags(activity.tags)

        # 4. Set optimal_time_of_day from activity_type
        if not activity.optimal_time_of_day:
            activity.optimal_time_of_day = infer_time_from_type(activity.activity_type)

        # 5. Calculate readiness score
        score, issues = ReadinessCalculator().calculate_score(activity)
        activity.gamification_readiness_score = score
        activity.gamification_readiness_issues = issues

    db.commit()
```

### 4.2 Device ID for Multi-User Tracking

```typescript
// useDeviceId.ts

import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const getDeviceId = async () => {
      // Check localStorage first
      let stored = localStorage.getItem('bizvoy_device_id');
      if (stored) {
        setDeviceId(stored);
        return;
      }

      // Generate new fingerprint
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      stored = result.visitorId;
      localStorage.setItem('bizvoy_device_id', stored);
      setDeviceId(stored);
    };

    getDeviceId();
  }, []);

  return deviceId;
};
```

### 4.3 Swipe Gesture with Framer Motion

```typescript
// useSwipeGesture.ts

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 15;

export const useSwipeGesture = (onSwipe: (direction: 'left' | 'right') => void) => {
  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-ROTATION_FACTOR, 0, ROTATION_FACTOR]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const velocity = Math.abs(info.velocity.x);

    if (info.offset.x > SWIPE_THRESHOLD) {
      controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
      setTimeout(() => onSwipe('right'), 300);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
      setTimeout(() => onSwipe('left'), 300);
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 500 } });
    }

    return velocity; // For analytics
  };

  return { controls, x, rotate, opacity, handleDragEnd };
};
```

### 4.4 Design System Extensions

```javascript
// tailwind.config.js additions

module.exports = {
  theme: {
    extend: {
      colors: {
        'game': {
          'bg': '#1a1a1a',
          'card': '#2d2d2d',
          'accent-green': '#00E676',
          'accent-coral': '#FF4081',
          'discard': '#FF5252',
          'save': '#FFC107',
        },
      },
      backdropBlur: {
        'glass': '20px',
      },
      borderRadius: {
        'card': '24px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 230, 118, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 230, 118, 0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
};
```

---

## 5. Integration Points

### 5.1 Shared Itinerary Viewer Changes

Location: `frontend/src/features/public/PublicItinerary.tsx`

Add personalization entry after Trip Overview:

```tsx
{/* Personalization CTA */}
{itinerary.personalization_enabled && !itinerary.personalization_completed && (
  <section className="mt-8 px-4">
    <PersonalizationEntry
      token={token}
      destination={itinerary.destination}
      timeEstimate="~60 seconds"
      onStart={() => navigate(`/trip/${token}/personalize`)}
    />
  </section>
)}

{/* Personalized Badge */}
{itinerary.personalization_completed && (
  <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
    <CheckCircle className="text-green-600 w-5 h-5" />
    <span className="text-green-800 text-sm font-medium">
      This trip has been personalized for you!
    </span>
  </div>
)}
```

### 5.2 Agency Activity Edit Form

Add gamification fields section:

```tsx
{/* Gamification Section */}
<div className="border-t pt-6 mt-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">Gamification Settings</h3>
    <GamificationScoreBadge score={activity.gamification_readiness_score} />
  </div>

  <ActivityGamificationFields
    activity={activity}
    vibes={agencyVibes}
    onChange={handleGamificationChange}
  />
</div>
```

### 5.3 WebSocket Updates

Extend existing WebSocket for personalization events:

```python
# When personalization session status changes
async def notify_personalization_update(
    itinerary_id: str,
    event_type: str,  # "SESSION_STARTED", "SESSION_COMPLETED", "SESSION_CONFIRMED"
    data: dict
):
    await broadcast_to_itinerary(
        itinerary_id,
        {
            "type": f"PERSONALIZATION_{event_type}",
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

---

## 6. Testing Strategy

### Unit Tests
- Readiness score calculation
- Deck building algorithm (scoring, variety, limits)
- Fit engine bin-packing
- Price parsing from cost_display
- Vibe auto-derivation from tags

### Integration Tests
- Full personalization flow via API
- Session resume within 24h
- Cart item persistence
- Itinerary updates after confirmation
- Multi-user same itinerary

### E2E Tests
- Complete swipe journey (mobile)
- Missed item swap flow
- Agency settings changes
- Vibe management CRUD
- Responsive design (320px - 1920px)

### Performance Tests
- Deck building < 500ms
- Fit algorithm < 2s
- Image prefetch effectiveness

---

## 7. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Low activity image quality | High | Gamification readiness score gates deck entry; show warnings to agency |
| Complex fit algorithm bugs | Medium | Extensive unit tests; simple windows in v1; detailed logging |
| Session data loss | Medium | Persist to DB on each swipe; allow 24h resume |
| Mobile performance | Medium | Lazy load images; limit deck size; prefetch next 2 cards |
| Agency adoption resistance | Medium | Readiness dashboard shows "38% game-ready"; clear onboarding |
| Multi-user conflicts | Low | Independent sessions by device_id; no shared state until confirm |

---

## 8. Future Enhancements

### Near-Term (Post-Launch)
- Session analytics email reports for agencies
- A/B testing framework for deck ordering
- "Share my picks" social feature
- Undo last swipe button

### Long-Term
- **Group Mode**: Collaborative personalization with weighted merging
- **AI Recommendations**: ML-based card ordering from interaction patterns
- **Dynamic Pricing**: Adjust displayed prices based on demand/season
- **Payment Integration**: Stripe/PayPal checkout flow
- **Offline Mode**: PWA with local storage for poor connectivity
