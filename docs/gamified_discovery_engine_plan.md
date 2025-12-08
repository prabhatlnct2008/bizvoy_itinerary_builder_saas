# Implementation Plan: Gamified Discovery Engine

## 1. System Overview

Transform the shared itinerary viewer into an interactive "Tinder for Travel" experience. Users can rapidly swipe through activity cards to personalize their trip, with a bin-packing algorithm fitting selections into available time slots.

**Core User Journey:**
1. User clicks "Personalize Trip" on shared itinerary
2. Selects 1-3 vibe categories (Vibe Check)
3. Swipes through 15-20 curated activity cards
4. System fits liked activities into itinerary gaps (Magic Crunch)
5. User reviews personalized timeline and confirms (Reveal)

---

## 2. Assumptions & Decisions

Based on spec analysis, the following assumptions are made for MVP:

| Question | Decision | Rationale |
|----------|----------|-----------|
| Vibe Categories | **Global list with agency customization later** | Start simple, extend in Phase 4 |
| Payment Flow | **MVP: Display total only, persist selections** | Defer payment integration to post-MVP |
| Multi-User | **One personalization per itinerary** | Simplest model; collaborative mode deferred |
| Data Migration | **Only show complete activities in deck** | Quality over quantity for first impression |
| Time-Slot Precision | **Implement full fields, use simple windows in logic** | Future-proof schema |
| Agency Controls | **Simple enable/disable for MVP** | Defer advanced controls to Phase 4 |
| Deck Source | **All agency activities filtered by destination + vibe** | Maximize discovery potential |

---

## 3. Architecture Specification

### 3.1 Database Schema Changes

#### A. Extend `activities` Table

```sql
-- Visuals & Marketing (The "Menu Card" Data)
ALTER TABLE activities ADD COLUMN price_numeric DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE activities ADD COLUMN currency_code VARCHAR(3) DEFAULT 'USD';
ALTER TABLE activities ADD COLUMN marketing_badge VARCHAR(50);  -- 'POPULAR', 'SELLING_FAST', 'SMALL_GROUP'
ALTER TABLE activities ADD COLUMN review_count INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN review_rating DECIMAL(3, 2);  -- 4.85 (more precise than existing rating)

-- Algorithm Logic (The "Bin Packing" Constraints)
ALTER TABLE activities ADD COLUMN optimal_time_of_day VARCHAR(20);  -- 'MORNING', 'AFTERNOON', 'EVENING', 'ANY'
ALTER TABLE activities ADD COLUMN blocked_days_of_week JSON;  -- e.g., [0, 6] for weekends
ALTER TABLE activities ADD COLUMN latitude DECIMAL(9, 6);
ALTER TABLE activities ADD COLUMN longitude DECIMAL(9, 6);
ALTER TABLE activities ADD COLUMN vibe_tags JSON;  -- ["history", "active", "romantic"]

-- Gamification Control
ALTER TABLE activities ADD COLUMN is_gamification_ready BOOLEAN DEFAULT 0;
```

**Note on existing fields:**
- `rating` (0-5) exists - keep for display, use `review_rating` for precision
- `tags` exists - keep for general tagging, `vibe_tags` specifically for gamification filtering
- `ActivityImage.is_hero` exists - reuse for cover image (no `cover_image_url` needed)

#### B. Extend `template_day_activities` Table

```sql
ALTER TABLE template_day_activities ADD COLUMN start_time TIME;
ALTER TABLE template_day_activities ADD COLUMN end_time TIME;
ALTER TABLE template_day_activities ADD COLUMN is_locked_by_agency BOOLEAN DEFAULT 1;
ALTER TABLE template_day_activities ADD COLUMN time_slot VARCHAR(20) DEFAULT 'ANY';  -- 'MORNING', 'AFTERNOON', 'EVENING', 'ANY'
```

#### C. Extend `itinerary_day_activities` Table

```sql
ALTER TABLE itinerary_day_activities ADD COLUMN start_time TIME;
ALTER TABLE itinerary_day_activities ADD COLUMN end_time TIME;
ALTER TABLE itinerary_day_activities ADD COLUMN is_locked_by_agency BOOLEAN DEFAULT 0;
ALTER TABLE itinerary_day_activities ADD COLUMN time_slot VARCHAR(20) DEFAULT 'ANY';
ALTER TABLE itinerary_day_activities ADD COLUMN source_cart_item_id VARCHAR(36);  -- Traceability to cart
ALTER TABLE itinerary_day_activities ADD COLUMN added_by_personalization BOOLEAN DEFAULT 0;
```

#### D. Extend `itineraries` Table

```sql
ALTER TABLE itineraries ADD COLUMN personalization_enabled BOOLEAN DEFAULT 0;
ALTER TABLE itineraries ADD COLUMN personalization_completed BOOLEAN DEFAULT 0;
ALTER TABLE itineraries ADD COLUMN personalization_completed_at DATETIME;
```

#### E. New Table: `user_deck_interactions`

```sql
CREATE TABLE IF NOT EXISTS "user_deck_interactions" (
    "id" VARCHAR(36) PRIMARY KEY,
    "session_id" VARCHAR(36) NOT NULL,        -- Groups interactions for one session
    "itinerary_id" VARCHAR(36) NOT NULL,
    "activity_id" VARCHAR(36) NOT NULL,
    "action" VARCHAR(10) NOT NULL,            -- 'LIKED', 'PASSED', 'SAVED'
    "seconds_viewed" INTEGER DEFAULT 0,
    "card_position" INTEGER,                  -- Position in deck (1-20)
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE,
    FOREIGN KEY("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE
);

CREATE INDEX idx_deck_interactions_session ON user_deck_interactions(session_id);
CREATE INDEX idx_deck_interactions_itinerary ON user_deck_interactions(itinerary_id);
```

#### F. New Table: `itinerary_cart_items`

```sql
CREATE TABLE IF NOT EXISTS "itinerary_cart_items" (
    "id" VARCHAR(36) PRIMARY KEY,
    "itinerary_id" VARCHAR(36) NOT NULL,
    "activity_id" VARCHAR(36) NOT NULL,
    "day_id" VARCHAR(36),                     -- Which day it was fitted into
    "quoted_price" DECIMAL(10, 2) NOT NULL,
    "currency_code" VARCHAR(3) DEFAULT 'USD',
    "time_slot" VARCHAR(20),                  -- 'MORNING', 'AFTERNOON', 'EVENING'
    "fit_status" VARCHAR(20) DEFAULT 'FITTED', -- 'FITTED', 'MISSED', 'SWAPPED'
    "miss_reason" VARCHAR(100),               -- e.g., "Time conflict with Lunch"
    "status" VARCHAR(20) DEFAULT 'PENDING',   -- 'PENDING', 'CONFIRMED', 'CANCELLED'
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE,
    FOREIGN KEY("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE,
    FOREIGN KEY("day_id") REFERENCES "itinerary_days"("id") ON DELETE SET NULL
);

CREATE INDEX idx_cart_items_itinerary ON itinerary_cart_items(itinerary_id);
```

#### G. New Table: `personalization_sessions`

```sql
CREATE TABLE IF NOT EXISTS "personalization_sessions" (
    "id" VARCHAR(36) PRIMARY KEY,
    "itinerary_id" VARCHAR(36) NOT NULL,
    "share_link_id" VARCHAR(36),              -- Optional: which share link was used
    "selected_vibes" JSON,                    -- ["history", "wine_dine"]
    "deck_size" INTEGER DEFAULT 20,
    "cards_viewed" INTEGER DEFAULT 0,
    "cards_liked" INTEGER DEFAULT 0,
    "cards_passed" INTEGER DEFAULT 0,
    "total_time_seconds" INTEGER DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'
    "started_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "user_agent" TEXT,                        -- For analytics
    "ip_hash" VARCHAR(64),                    -- Anonymized for analytics
    FOREIGN KEY("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE,
    FOREIGN KEY("share_link_id") REFERENCES "share_links"("id") ON DELETE SET NULL
);

CREATE INDEX idx_sessions_itinerary ON personalization_sessions(itinerary_id);
```

---

### 3.2 SQLAlchemy Models

#### New Model: `UserDeckInteraction`

```python
# backend/app/models/user_deck_interaction.py

class UserDeckInteraction(Base):
    __tablename__ = "user_deck_interactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), nullable=False, index=True)
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(10), nullable=False)  # LIKED, PASSED, SAVED
    seconds_viewed = Column(Integer, default=0)
    card_position = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
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
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    day_id = Column(String(36), ForeignKey("itinerary_days.id", ondelete="SET NULL"))
    quoted_price = Column(Numeric(10, 2), nullable=False)
    currency_code = Column(String(3), default="USD")
    time_slot = Column(String(20))
    fit_status = Column(String(20), default=FitStatus.FITTED)
    miss_reason = Column(String(100))
    status = Column(String(20), default=CartItemStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    itinerary = relationship("Itinerary", back_populates="cart_items")
    activity = relationship("Activity")
    day = relationship("ItineraryDay")
```

#### New Model: `PersonalizationSession`

```python
# backend/app/models/personalization_session.py

class SessionStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"

class PersonalizationSession(Base):
    __tablename__ = "personalization_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    share_link_id = Column(String(36), ForeignKey("share_links.id", ondelete="SET NULL"))
    selected_vibes = Column(JSON)
    deck_size = Column(Integer, default=20)
    cards_viewed = Column(Integer, default=0)
    cards_liked = Column(Integer, default=0)
    cards_passed = Column(Integer, default=0)
    total_time_seconds = Column(Integer, default=0)
    status = Column(String(20), default=SessionStatus.IN_PROGRESS)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    user_agent = Column(Text)
    ip_hash = Column(String(64))

    # Relationships
    itinerary = relationship("Itinerary", back_populates="personalization_sessions")
    share_link = relationship("ShareLink")
    interactions = relationship("UserDeckInteraction", back_populates="session")
```

---

### 3.3 API Contract (FastAPI)

#### Public Gamification Endpoints (No Auth Required)

| Method | Endpoint | Request Schema | Response Schema | Description |
|--------|----------|----------------|-----------------|-------------|
| GET | `/public/itinerary/{token}/personalization/status` | - | `PersonalizationStatusResponse` | Check if personalization is enabled/completed |
| POST | `/public/itinerary/{token}/personalization/start` | `StartSessionRequest` | `SessionResponse` | Start personalization session with vibes |
| GET | `/public/itinerary/{token}/personalization/deck` | - | `DeckResponse` | Get curated deck of 15-20 cards |
| POST | `/public/itinerary/{token}/personalization/swipe` | `SwipeRequest` | `SwipeResponse` | Record like/pass interaction |
| POST | `/public/itinerary/{token}/personalization/complete` | `CompleteRequest` | `RevealResponse` | Run fit algorithm, return results |
| POST | `/public/itinerary/{token}/personalization/confirm` | `ConfirmRequest` | `ConfirmResponse` | Confirm selections, update itinerary |
| POST | `/public/itinerary/{token}/personalization/swap` | `SwapRequest` | `SwapResponse` | Swap a missed item with a fitted one |

#### Agency Endpoints (Auth Required)

| Method | Endpoint | Request Schema | Response Schema | Description |
|--------|----------|----------------|-----------------|-------------|
| PUT | `/itineraries/{id}/personalization` | `PersonalizationSettingsUpdate` | `ItineraryResponse` | Enable/disable personalization |
| GET | `/itineraries/{id}/personalization/analytics` | - | `PersonalizationAnalytics` | View session analytics |
| PUT | `/activities/{id}/gamification` | `ActivityGamificationUpdate` | `ActivityResponse` | Update gamification fields |
| POST | `/activities/{id}/gamification/validate` | - | `ValidationResponse` | Check if activity is gamification-ready |

---

### 3.4 Pydantic Schemas

```python
# backend/app/schemas/gamification.py

# === Vibe Categories ===
class VibeCategory(str, Enum):
    HISTORY = "history"
    WINE_DINE = "wine_dine"
    SLOW_PACED = "slow_paced"
    INSTA_SPOTS = "insta_spots"
    ADRENALINE = "adrenaline"
    ROMANTIC = "romantic"
    FAMILY = "family"
    LUXURY = "luxury"

# === Session ===
class StartSessionRequest(BaseModel):
    selected_vibes: List[VibeCategory] = Field(..., min_items=1, max_items=3)

class SessionResponse(BaseModel):
    session_id: str
    deck_size: int
    itinerary_destination: str

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
    card_position: int

class DeckResponse(BaseModel):
    session_id: str
    cards: List[DeckCard]
    total_cards: int

# === Swipe ===
class SwipeRequest(BaseModel):
    session_id: str
    activity_id: str
    action: Literal["LIKED", "PASSED", "SAVED"]
    seconds_viewed: int = 0

class SwipeResponse(BaseModel):
    cards_remaining: int
    liked_count: int
    running_total: Decimal

# === Complete/Reveal ===
class FittedItem(BaseModel):
    activity_id: str
    activity_name: str
    day_number: int
    day_date: date
    time_slot: str
    price: Decimal
    duration_display: str
    hero_image_url: Optional[str]

class MissedItem(BaseModel):
    activity_id: str
    activity_name: str
    reason: str
    swap_suggestion: Optional[str]  # "Swap with Lunch on Day 2?"

class RevealResponse(BaseModel):
    session_id: str
    fitted_items: List[FittedItem]
    missed_items: List[MissedItem]
    total_fitted: int
    total_liked: int
    added_price: Decimal
    currency_code: str

# === Confirm ===
class ConfirmRequest(BaseModel):
    session_id: str

class ConfirmResponse(BaseModel):
    success: bool
    itinerary_id: str
    items_added: int
    new_total_price: Decimal

# === Swap ===
class SwapRequest(BaseModel):
    session_id: str
    missed_activity_id: str
    replace_activity_id: str  # The fitted activity to remove

class SwapResponse(BaseModel):
    success: bool
    updated_fitted_items: List[FittedItem]
    updated_missed_items: List[MissedItem]
    new_added_price: Decimal
```

---

### 3.5 Frontend Components

```
frontend/src/features/personalization/
├── PersonalizationEntry.tsx      # CTA button on shared itinerary
├── VibeCheck.tsx                 # Floating bubble selection screen
├── SwipeDeck.tsx                 # Main card stack with swipe gestures
├── SwipeCard.tsx                 # Individual activity card
├── CardFlip.tsx                  # Flip animation for card details
├── MagicCrunch.tsx               # Loading animation with map/pins
├── RevealTimeline.tsx            # Result screen with fitted activities
├── MissedConnections.tsx         # Bottom sheet for items that didn't fit
├── ConfirmFooter.tsx             # Sticky footer with total + CTA
├── hooks/
│   ├── useSwipeGesture.ts        # Touch/mouse swipe detection
│   ├── usePersonalization.ts     # API calls and state management
│   └── useHaptics.ts             # Vibration feedback (if supported)
├── animations/
│   ├── cardAnimations.ts         # Framer Motion variants
│   └── confetti.ts               # Confetti effect on reveal
└── types/
    └── personalization.ts        # TypeScript interfaces
```

---

### 3.6 Service Layer Architecture

```
backend/app/services/
├── gamification/
│   ├── __init__.py
│   ├── deck_builder.py           # Curate 15-20 cards based on vibes + destination
│   ├── interaction_recorder.py   # Persist swipe actions
│   ├── fit_engine.py             # Bin-packing algorithm
│   └── reveal_builder.py         # Construct reveal payload
```

#### Deck Builder Service

```python
# deck_builder.py

class DeckBuilder:
    """Curates a deck of 15-20 activities based on user preferences."""

    def build_deck(
        self,
        db: Session,
        itinerary: Itinerary,
        selected_vibes: List[str],
        deck_size: int = 20
    ) -> List[Activity]:
        """
        Algorithm:
        1. Get all agency activities matching destination
        2. Filter by is_gamification_ready = True
        3. Score by vibe_tag overlap
        4. Boost by rating and review_count
        5. Ensure variety (no more than 3 per category)
        6. Return top N sorted by score
        """
        pass
```

#### Fit Engine Service (Bin Packing)

```python
# fit_engine.py

class FitEngine:
    """Fits liked activities into itinerary time slots."""

    TIME_WINDOWS = {
        "MORNING": (time(9, 0), time(12, 0)),
        "AFTERNOON": (time(12, 0), time(16, 0)),
        "EVENING": (time(16, 0), time(20, 0)),
    }

    def fit_activities(
        self,
        db: Session,
        itinerary: Itinerary,
        liked_activity_ids: List[str]
    ) -> FitResult:
        """
        Algorithm (v1 - Simple Windows):
        1. Load itinerary days with locked activities
        2. For each day, calculate available windows
        3. Sort liked activities by priority (price high→low, then duration)
        4. For each activity:
           a. Check optimal_time_of_day preference
           b. Check blocked_days_of_week
           c. Find first available window with enough time
           d. If fit: mark window as used, add to fitted list
           e. If no fit: add to missed list with reason
        5. Return FitResult with fitted, missed, and total price
        """
        pass
```

---

## 4. Implementation Details

### 4.1 Swipe Gesture Implementation

Using **Framer Motion** for React animations:

```typescript
// useSwipeGesture.ts
const SWIPE_THRESHOLD = 100;  // pixels
const ROTATION_FACTOR = 15;   // degrees

const handleDragEnd = (event, info) => {
  if (info.offset.x > SWIPE_THRESHOLD) {
    onSwipeRight();
  } else if (info.offset.x < -SWIPE_THRESHOLD) {
    onSwipeLeft();
  } else {
    // Snap back to center
    controls.start({ x: 0, rotate: 0 });
  }
};
```

### 4.2 Offline-Safe Image Prefetch

```typescript
// Prefetch next 2 cards' hero images
useEffect(() => {
  const prefetchImages = async () => {
    const nextCards = cards.slice(currentIndex + 1, currentIndex + 3);
    nextCards.forEach(card => {
      if (card.hero_image_url) {
        const img = new Image();
        img.src = card.hero_image_url;
      }
    });
  };
  prefetchImages();
}, [currentIndex, cards]);
```

### 4.3 Haptic Feedback

```typescript
// useHaptics.ts
export const useHaptics = () => {
  const vibrate = (pattern: 'light' | 'heavy') => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern === 'light' ? 10 : 50);
    }
  };
  return { vibrate };
};
```

### 4.4 Design System Extensions

```css
/* Add to Tailwind config */
theme: {
  extend: {
    colors: {
      'game-bg': '#1a1a1a',
      'game-accent-green': '#00E676',
      'game-accent-coral': '#FF4081',
      'game-discard': '#FF5252',
    },
    backdropBlur: {
      'glass': '20px',
    },
    borderRadius: {
      'card': '24px',
    }
  }
}
```

---

## 5. Integration Points

### 5.1 Shared Itinerary Viewer Changes

Location: `frontend/src/features/public/PublicItinerary.tsx`

```tsx
// Add after Trip Overview section
{itinerary.personalization_enabled && !itinerary.personalization_completed && (
  <PersonalizationEntry
    token={token}
    destination={itinerary.destination}
    onStart={() => navigate(`/trip/${token}/personalize`)}
  />
)}

{itinerary.personalization_completed && (
  <PersonalizedBadge message="This trip has been personalized!" />
)}
```

### 5.2 Public Router Changes

```tsx
// Add route for personalization flow
<Route
  path="/trip/:token/personalize"
  element={<PersonalizationFlow />}
/>
```

### 5.3 WebSocket Integration

Extend existing WebSocket to notify when personalization completes:

```python
# When personalization confirmed
await broadcast_update(
    itinerary_id,
    {
        "type": "PERSONALIZATION_COMPLETED",
        "items_added": len(fitted_items),
        "new_total": new_total
    }
)
```

---

## 6. Testing Strategy

### Unit Tests
- DeckBuilder scoring algorithm
- FitEngine bin-packing logic
- Time window calculations

### Integration Tests
- Full personalization flow via API
- Cart item persistence
- Itinerary updates after confirmation

### E2E Tests
- Complete swipe journey
- Missed item swap flow
- Multiple device sizes (mobile-first)

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Low activity image quality | Add `is_gamification_ready` validation before showing in deck |
| Complex time logic bugs | Ship v1 with simple windows; add precision in v2 |
| Slow fit algorithm | Cache itinerary structure; optimize queries with eager loading |
| Mobile performance | Lazy load card images; limit deck to 20 cards max |
| Abandoned sessions | Track session status; allow resume within 24 hours |

---

## 8. Future Enhancements (Post-MVP)

- Collaborative personalization (multiple users vote)
- AI-powered recommendations based on interaction patterns
- Agency-defined vibe categories
- Payment gateway integration
- Session analytics dashboard for agencies
- A/B testing framework for card ordering algorithms
