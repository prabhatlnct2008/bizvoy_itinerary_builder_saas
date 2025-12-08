# Project Status: Gamified Discovery Engine

## Current Phase: Phase 1 (Not Started)

## Overview

| Phase | Focus | Tasks |
|-------|-------|-------|
| Phase 1 | Database, Models & Agency Settings | ~35 tasks |
| Phase 2 | Client-Facing Game UI | ~30 tasks |
| Phase 3 | Fit Engine, Reveal & Confirm | ~20 tasks |
| Phase 4 | Agency Controls, Analytics & Polish | ~20 tasks |

**Total Estimated Tasks: ~105**

---

## Phase 1: Database, Models & Agency Settings

### 1.1 Database Schema - New Tables
- [ ] Create `agency_vibes` table
  - [ ] Define columns: id, agency_id, vibe_key, display_name, emoji, color_hex, is_global, is_enabled, display_order
  - [ ] Add unique constraint on (agency_id, vibe_key)
  - [ ] Add foreign key to agencies
- [ ] Create `agency_personalization_settings` table
  - [ ] Define columns: id, agency_id, is_enabled, default_deck_size, personalization_policy, price caps, currency, activity type filters
  - [ ] Add unique constraint on agency_id
- [ ] Create `personalization_sessions` table
  - [ ] Define columns: id, itinerary_id, share_link_id, device_id, selected_vibes, stats, status, timestamps
  - [ ] Add indexes on itinerary_id and device_id
- [ ] Create `user_deck_interactions` table
  - [ ] Define columns: id, session_id, itinerary_id, activity_id, action, seconds_viewed, card_position, swipe_velocity
  - [ ] Add indexes on session_id and itinerary_id
- [ ] Create `itinerary_cart_items` table
  - [ ] Define columns: id, session_id, itinerary_id, activity_id, day_id, price, fit_status, reasons, status
  - [ ] Add indexes on session_id and itinerary_id

### 1.2 Database Schema - Table Extensions
- [ ] Extend `activities` table
  - [ ] Add price_numeric (DECIMAL 10,2)
  - [ ] Add currency_code (VARCHAR 3)
  - [ ] Add marketing_badge (VARCHAR 50)
  - [ ] Add review_count (INTEGER)
  - [ ] Add review_rating (DECIMAL 3,2)
  - [ ] Add optimal_time_of_day (VARCHAR 20)
  - [ ] Add blocked_days_of_week (JSON)
  - [ ] Add latitude, longitude (DECIMAL 9,6)
  - [ ] Add vibe_tags (JSON)
  - [ ] Add gamification_readiness_score (INTEGER)
  - [ ] Add gamification_readiness_issues (JSON)
- [ ] Extend `template_day_activities` table
  - [ ] Add start_time, end_time (TIME)
  - [ ] Add is_locked_by_agency (BOOLEAN, default 1)
  - [ ] Add time_slot (VARCHAR 20)
- [ ] Extend `itinerary_day_activities` table
  - [ ] Add start_time, end_time (TIME)
  - [ ] Add is_locked_by_agency (BOOLEAN, default 0)
  - [ ] Add time_slot (VARCHAR 20)
  - [ ] Add source_cart_item_id (VARCHAR 36)
  - [ ] Add added_by_personalization (BOOLEAN)
- [ ] Extend `itineraries` table
  - [ ] Add personalization_enabled (BOOLEAN)
  - [ ] Add personalization_policy (VARCHAR 20)
  - [ ] Add personalization_lock_policy (VARCHAR 20)
  - [ ] Add personalization_completed (BOOLEAN)
  - [ ] Add personalization_completed_at (DATETIME)
  - [ ] Add personalization_session_id (VARCHAR 36)

### 1.3 SQLAlchemy Models
- [ ] Create `AgencyVibe` model with relationships
- [ ] Create `AgencyPersonalizationSettings` model with relationships
- [ ] Create `PersonalizationSession` model with relationships
- [ ] Create `UserDeckInteraction` model with relationships
- [ ] Create `ItineraryCartItem` model with relationships
- [ ] Add enums: PersonalizationPolicy, SessionStatus, InteractionAction, CartItemStatus, FitStatus, TimeSlot
- [ ] Update `Activity` model with new columns
- [ ] Update `TemplateDayActivity` model with new columns
- [ ] Update `ItineraryDayActivity` model with new columns
- [ ] Update `Itinerary` model with new columns
- [ ] Update `Agency` model with vibes and settings relationships
- [ ] Add all new model imports to models/__init__.py

### 1.4 Pydantic Schemas
- [ ] Create `schemas/gamification.py` file
- [ ] Define Agency Vibe schemas (Create, Update, Response)
- [ ] Define Agency Settings schemas (Update, Response)
- [ ] Define Session schemas (Start, Response, Status, Resume)
- [ ] Define Deck schemas (Card, Response)
- [ ] Define Swipe schemas (Request, Response)
- [ ] Define Reveal schemas (FittedItem, MissedItem, Response)
- [ ] Define Confirm schemas (Request, Response)
- [ ] Define Swap schemas (Request, Response)
- [ ] Define Activity Gamification schemas (Update, Validation)
- [ ] Define Analytics schema
- [ ] Update existing Activity schemas with new fields

### 1.5 Service Layer - Foundation
- [ ] Create `services/gamification/` directory
- [ ] Implement `ReadinessCalculator` service
  - [ ] `calculate_score()` - returns score 0-100 and issues list
  - [ ] `batch_calculate()` - efficient bulk calculation
- [ ] Implement `VibeService`
  - [ ] `get_agency_vibes()` - list all vibes for agency
  - [ ] `create_vibe()` - create custom vibe
  - [ ] `update_vibe()` - update vibe properties
  - [ ] `delete_vibe()` - delete custom vibe (not global)
  - [ ] `seed_global_vibes()` - copy defaults to new agency
- [ ] Implement `SettingsService`
  - [ ] `get_settings()` - get agency personalization settings
  - [ ] `update_settings()` - update settings
  - [ ] `create_default_settings()` - initialize for new agency
- [ ] Implement `DeckBuilder` service (basic structure)
  - [ ] `build_deck()` - curate activities by vibe + destination
  - [ ] `_score_activity()` - calculate relevance score
  - [ ] `_ensure_variety()` - limit per-category count
- [ ] Implement `InteractionRecorder` service
  - [ ] `record_swipe()` - persist interaction
  - [ ] `update_session_stats()` - increment counters

### 1.6 API Endpoints - Agency Side
- [ ] Create `endpoints/gamification.py` for agency routes
- [ ] Implement `GET /agency/personalization/settings`
- [ ] Implement `PUT /agency/personalization/settings`
- [ ] Implement `GET /agency/personalization/vibes`
- [ ] Implement `POST /agency/personalization/vibes`
- [ ] Implement `PUT /agency/personalization/vibes/{id}`
- [ ] Implement `DELETE /agency/personalization/vibes/{id}`
- [ ] Implement `POST /agency/personalization/vibes/reorder`
- [ ] Implement `PUT /activities/{id}/gamification`
- [ ] Implement `POST /activities/{id}/gamification/validate`
- [ ] Implement `GET /agency/activities/gamification-status`
- [ ] Add routes to agency router

### 1.7 API Endpoints - Public Side
- [ ] Add gamification routes to `endpoints/public.py`
- [ ] Implement `GET /public/itinerary/{token}/personalization/status`
- [ ] Implement `POST /public/itinerary/{token}/personalization/start`
- [ ] Implement `GET /public/itinerary/{token}/personalization/deck`
- [ ] Implement `POST /public/itinerary/{token}/personalization/swipe`
- [ ] Implement stub `POST /public/itinerary/{token}/personalization/complete` (full in Phase 3)
- [ ] Implement `GET /public/itinerary/{token}/personalization/resume`

### 1.8 Data Migration
- [ ] Create migration script for existing activities
  - [ ] Parse cost_display to price_numeric
  - [ ] Detect currency from cost_display
  - [ ] Derive vibe_tags from existing tags
  - [ ] Infer optimal_time_of_day from activity_type
  - [ ] Calculate initial readiness scores
- [ ] Create seed data for global vibes (10 defaults)
- [ ] Create default personalization settings for existing agencies

### 1.9 Testing Phase 1
- [ ] Unit tests for ReadinessCalculator
- [ ] Unit tests for VibeService
- [ ] Unit tests for SettingsService
- [ ] Unit tests for DeckBuilder scoring
- [ ] API tests for agency endpoints
- [ ] API tests for public status/start/deck endpoints
- [ ] Test database migrations (up and down)

---

## Phase 2: Client-Facing Game UI

### 2.1 Project Setup
- [ ] Install dependencies: `framer-motion`, `@fingerprintjs/fingerprintjs`, `canvas-confetti`
- [ ] Create `features/personalization/` directory structure
- [ ] Add gamification colors to Tailwind config
- [ ] Add custom animations to Tailwind config
- [ ] Create TypeScript interfaces in `types/personalization.ts`

### 2.2 API Integration
- [ ] Create `api/personalization.ts` with client functions
  - [ ] `getPersonalizationStatus(token)`
  - [ ] `startSession(token, vibes, deviceId)`
  - [ ] `getDeck(token, sessionId)`
  - [ ] `recordSwipe(token, data)`
  - [ ] `completePersonalization(token, sessionId)`
  - [ ] `confirmSelections(token, sessionId)`
  - [ ] `swapActivity(token, data)`
  - [ ] `resumeSession(token, deviceId)`
- [ ] Create `hooks/usePersonalization.ts` for state management
- [ ] Create `hooks/useDeviceId.ts` for browser fingerprinting

### 2.3 Entry Point
- [ ] Create `PersonalizationEntry.tsx` CTA component
  - [ ] Gradient/glow styling
  - [ ] Pulsing animation
  - [ ] "20 quick choices • ~60 seconds" subtext
- [ ] Integrate into `PublicItinerary.tsx`
- [ ] Add personalization completed badge
- [ ] Add route `/trip/:token/personalize`

### 2.4 Vibe Check Screen
- [ ] Create `VibeCheck.tsx` main component
- [ ] Create `VibeBubble.tsx` individual bubble
  - [ ] Floating animation
  - [ ] Tap glow + scale effect
  - [ ] Selected state styling
- [ ] Implement bubble layout (floating positions)
- [ ] Track selected vibes (1-3 max)
- [ ] Show "Build My Deck" button after 1+ selection
- [ ] Add background particle animation
- [ ] Mobile-first responsive design

### 2.5 Swipe Deck Screen
- [ ] Create `SwipeDeck.tsx` container component
- [ ] Create `ProgressBar.tsx` (thin line, "1 of 15")
- [ ] Create `SwipeCard.tsx` component
  - [ ] Full-screen hero image
  - [ ] Gradient overlay (bottom 35%)
  - [ ] Marketing badge (top left, pill shape)
  - [ ] Title, location, duration info
  - [ ] Rating with yellow stars
  - [ ] Price display (electric green)
- [ ] Create `SwipeOverlay.tsx` (YES/NOPE indicators)
- [ ] Create `CardFlip.tsx` for detail view
  - [ ] Flip animation on tap
  - [ ] Full description
  - [ ] Highlights list
  - [ ] "Save for Later" action
- [ ] Create `hooks/useSwipeGesture.ts`
  - [ ] Drag tracking
  - [ ] Rotation transform (15deg)
  - [ ] Threshold detection
  - [ ] Snap-back animation
- [ ] Create `hooks/useHaptics.ts` for vibration
- [ ] Add control buttons (X, Heart, Info) in thumb zone
- [ ] Create `hooks/useDeckPrefetch.ts` for image preloading
- [ ] Add micro-reward pulse every 3-5 swipes

### 2.6 Flow Container
- [ ] Create `PersonalizationFlow.tsx` main router
- [ ] Handle step navigation (Vibe → Deck → Loading → Reveal)
- [ ] Persist state across steps
- [ ] Handle session resume

### 2.7 Animations
- [ ] Create `animations/cardAnimations.ts` Framer variants
  - [ ] Card entry (scale from 0.9)
  - [ ] Swipe left exit
  - [ ] Swipe right exit
  - [ ] Flip animation
- [ ] Create `animations/bubbleAnimations.ts`
  - [ ] Float animation
  - [ ] Selection pulse
- [ ] Create `animations/confetti.ts` for reveal

### 2.8 Testing Phase 2
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test touch gestures accuracy
- [ ] Test keyboard navigation
- [ ] Performance test (60fps animations)
- [ ] Test responsive design (320px - 768px)

---

## Phase 3: Fit Engine, Reveal & Confirm

### 3.1 Fit Engine Implementation
- [ ] Complete `FitEngine` service
- [ ] Define TIME_WINDOWS constants
- [ ] Implement `get_available_windows()`
  - [ ] Parse existing activities into time slots
  - [ ] Calculate remaining capacity per slot
- [ ] Implement `fit_activities()` main algorithm
  - [ ] Load itinerary with locked activities
  - [ ] Get liked activities from session
  - [ ] Sort by priority (price, duration)
  - [ ] Apply policy rules (STRICT/BALANCED/AGGRESSIVE)
  - [ ] Match activity preferences to windows
  - [ ] Track fitted and missed items
- [ ] Implement `_find_best_window()`
- [ ] Implement `_generate_swap_suggestion()`
- [ ] Handle edge cases (empty days, all-day activities)

### 3.2 Reveal Builder Implementation
- [ ] Complete `RevealBuilder` service
- [ ] Build fitted items list with day/time details
- [ ] Build missed items list with reasons
- [ ] Generate swap suggestions for missed items
- [ ] Include saved-for-later items
- [ ] Calculate total added price
- [ ] Include company payment info

### 3.3 API Completion
- [ ] Complete `POST .../personalization/complete` endpoint
- [ ] Implement `POST .../personalization/confirm` endpoint
  - [ ] Create ItineraryDayActivity records for fitted items
  - [ ] Mark cart items as CONFIRMED
  - [ ] Update itinerary total price
  - [ ] Set personalization_completed = True
  - [ ] Trigger WebSocket notification
- [ ] Implement `POST .../personalization/swap` endpoint
  - [ ] Validate swap is allowed
  - [ ] Remove fitted item
  - [ ] Add missed item in its place
  - [ ] Recalculate totals
  - [ ] Update cart item statuses

### 3.4 Magic Crunch Screen
- [ ] Create `MagicCrunch.tsx` component
- [ ] Design stylized map background (SVG or CSS)
- [ ] Implement pin drop animation
  - [ ] Grey pins for locked items
  - [ ] Green pins for liked items
- [ ] Add polyline drawing animation
- [ ] Create rotating copy messages array
- [ ] Ensure max 3 second display (or progress indicator)

### 3.5 Reveal Timeline Screen
- [ ] Create `RevealTimeline.tsx` container
- [ ] Create `TimelineDay.tsx` component
  - [ ] Day header with date
  - [ ] Expandable/collapsible
- [ ] Create `TimelineActivity.tsx` component
  - [ ] Locked style (grey, lock icon)
  - [ ] Flexible style (green, user-added badge)
  - [ ] Time slot indicator
  - [ ] Fit reason tooltip
- [ ] Trigger confetti on load
- [ ] Create `MissedConnections.tsx` bottom sheet
  - [ ] Collapsible by default
  - [ ] List missed items with reasons
  - [ ] "Swap with X?" action buttons
- [ ] Create `SwapModal.tsx` confirmation dialog
- [ ] Create `SavedForLater.tsx` expandable section
- [ ] Create `ConfirmFooter.tsx` sticky component
  - [ ] Added total (left side)
  - [ ] "Confirm & Pay" button (right side)
- [ ] Create `PaymentInfo.tsx`
  - [ ] Company QR code display
  - [ ] Bank details section
  - [ ] Payment notes

### 3.6 Testing Phase 3
- [ ] Unit tests for FitEngine algorithm
- [ ] Unit tests for time window calculations
- [ ] Unit tests for swap logic
- [ ] Integration tests for complete flow
- [ ] Test edge cases (0 likes, all fits, no fits)
- [ ] E2E test full journey
- [ ] Test WebSocket notifications

---

## Phase 4: Agency Controls, Analytics & Polish

### 4.1 Agency Settings UI
- [ ] Create `PersonalizationSettings.tsx` page
  - [ ] Enable/disable toggle
  - [ ] Default deck size selector (15/20/25)
  - [ ] Policy selector (Strict/Balanced/Aggressive)
  - [ ] Price caps inputs
  - [ ] Currency selector
  - [ ] Activity type filters
- [ ] Create `ReadinessOverview.tsx` dashboard
  - [ ] Game-ready percentage display
  - [ ] Top issues breakdown
  - [ ] Quick fix suggestions
- [ ] Add settings link to agency navigation

### 4.2 Vibes Manager UI
- [ ] Create `VibesManager.tsx` page
  - [ ] List all vibes (global + custom)
  - [ ] Enable/disable toggles
  - [ ] Drag-to-reorder
- [ ] Create `VibeEditor.tsx` modal
  - [ ] Name input
  - [ ] Emoji picker
  - [ ] Color picker
- [ ] Add create custom vibe button
- [ ] Add delete for custom vibes (with confirmation)

### 4.3 Activity Gamification UI
- [ ] Create `ActivityGamificationFields.tsx` form section
  - [ ] Price numeric input with currency
  - [ ] Vibe tags multi-select
  - [ ] Marketing badge dropdown
  - [ ] Optimal time selector
  - [ ] Blocked days checkboxes
  - [ ] Coordinates input (optional)
- [ ] Create `GamificationScoreBadge.tsx`
  - [ ] Score display (0-100%)
  - [ ] Color coding (red/yellow/green)
  - [ ] Issues tooltip
- [ ] Integrate into activity edit form

### 4.4 Itinerary Personalization Controls
- [ ] Create `PersonalizationToggle.tsx` component
  - [ ] Enable/disable for this itinerary
  - [ ] Policy override selector
  - [ ] Lock policy selector
- [ ] Create `PersonalizationStats.tsx` for itinerary detail
  - [ ] Sessions count
  - [ ] Completion rate
  - [ ] Revenue added
- [ ] Integrate into itinerary edit/detail pages

### 4.5 Analytics Dashboard
- [ ] Implement `GET /itineraries/{id}/personalization/analytics` fully
- [ ] Create `PersonalizationAnalyticsDashboard.tsx`
  - [ ] Sessions summary cards
  - [ ] Completion/confirmation rates
  - [ ] Average time/cards metrics
  - [ ] Most liked activities chart
  - [ ] Most passed activities chart
  - [ ] Vibe popularity breakdown
  - [ ] Revenue impact

### 4.6 Polish & Performance
- [ ] Add loading skeletons for all async operations
- [ ] Add error boundaries and retry logic
- [ ] Implement session resume (within 24h)
- [ ] Add "Undo last swipe" button
- [ ] Optimize image loading (WebP format check)
- [ ] Add offline detection and handling
- [ ] WebSocket notifications on personalization complete
- [ ] Rate limiting for public endpoints

### 4.7 Documentation & Final Testing
- [ ] Update API documentation
- [ ] Add inline code comments for complex logic
- [ ] Create agency onboarding guide
- [ ] Performance audit
  - [ ] Deck building < 500ms
  - [ ] Fit algorithm < 2s
  - [ ] Animation 60fps
- [ ] Security review
  - [ ] Rate limiting
  - [ ] Input validation
  - [ ] Session hijacking prevention
- [ ] Cross-browser testing
- [ ] Accessibility audit

---

## Completion Checklist

### MVP (End of Phase 3)
- [ ] CTA entry from shared itinerary
- [ ] Vibe Check screen with agency vibes
- [ ] 15-25 card swipe deck
- [ ] Magic Crunch animation
- [ ] Reveal timeline with fitted/missed items
- [ ] Swap functionality
- [ ] Confirm and persist to itinerary
- [ ] Payment info display (QR/bank)
- [ ] Independent sessions per user/device

### Full Version (End of Phase 4)
- [ ] Full agency personalization settings
- [ ] Custom vibes management
- [ ] Activity gamification fields
- [ ] Readiness score dashboard
- [ ] Per-itinerary controls
- [ ] Analytics dashboard
- [ ] Session resume
- [ ] Performance optimized
- [ ] Security hardened

---

## Session Log

| Date | Phase | Tasks Completed | Notes |
|------|-------|-----------------|-------|
| _TBD_ | 1 | - | Project kickoff |

---

## Dependencies

### NPM Packages (Frontend)
- `framer-motion` - Swipe animations
- `@fingerprintjs/fingerprintjs` - Device identification
- `canvas-confetti` - Reveal celebration
- `react-color` or similar - Vibe color picker

### Python Packages (Backend)
- None additional required (using existing stack)

---

## Technical Debt Tracker

| Item | Priority | Phase | Notes |
|------|----------|-------|-------|
| Full time-slot precision | Medium | Post-MVP | Using simple windows in v1, add precise scheduling later |
| Orphaned file cleanup | Low | Post-MVP | Need cleanup job for deleted activity images |
| Group Mode | Low | Future | Collaborative personalization with weighted merging |
| AI Recommendations | Low | Future | ML-based card ordering from interaction patterns |
| Payment Integration | Medium | Future | Stripe/PayPal checkout flow |
| Offline Mode | Low | Future | PWA with local storage |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| Low image quality activities | High | High | Readiness score gates + agency warnings | Phase 1 |
| Complex fit algorithm bugs | Medium | Medium | Extensive unit tests, simple windows v1 | Phase 3 |
| Session data loss | Medium | Medium | Persist on each swipe, 24h resume | Phase 1 |
| Mobile performance issues | Medium | High | Lazy load, prefetch, limit deck size | Phase 2 |
| Agency adoption resistance | Medium | Medium | Readiness dashboard, clear ROI | Phase 4 |
