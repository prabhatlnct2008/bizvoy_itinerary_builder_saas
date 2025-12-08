# Project Status: Gamified Discovery Engine

## Current Phase: Phase 1 (Not Started)

## Overview

| Phase | Focus | Estimated Tasks |
|-------|-------|-----------------|
| Phase 1 | Database & Backend Foundation | 18 tasks |
| Phase 2 | Client-Facing Game UI | 22 tasks |
| Phase 3 | Fit Engine & Reveal | 14 tasks |
| Phase 4 | Agency Controls & Analytics | 10 tasks |

---

## Phase 1: Database & Backend Foundation

### 1.1 Database Schema Updates
- [ ] Create migration script for `activities` table extensions
  - [ ] Add `price_numeric` (DECIMAL 10,2)
  - [ ] Add `currency_code` (VARCHAR 3, default 'USD')
  - [ ] Add `marketing_badge` (VARCHAR 50)
  - [ ] Add `review_count` (INTEGER)
  - [ ] Add `review_rating` (DECIMAL 3,2)
  - [ ] Add `optimal_time_of_day` (VARCHAR 20)
  - [ ] Add `blocked_days_of_week` (JSON)
  - [ ] Add `latitude` (DECIMAL 9,6)
  - [ ] Add `longitude` (DECIMAL 9,6)
  - [ ] Add `vibe_tags` (JSON)
  - [ ] Add `is_gamification_ready` (BOOLEAN)
- [ ] Create migration for `template_day_activities` extensions
  - [ ] Add `start_time` (TIME)
  - [ ] Add `end_time` (TIME)
  - [ ] Add `is_locked_by_agency` (BOOLEAN, default 1)
  - [ ] Add `time_slot` (VARCHAR 20)
- [ ] Create migration for `itinerary_day_activities` extensions
  - [ ] Add `start_time` (TIME)
  - [ ] Add `end_time` (TIME)
  - [ ] Add `is_locked_by_agency` (BOOLEAN, default 0)
  - [ ] Add `time_slot` (VARCHAR 20)
  - [ ] Add `source_cart_item_id` (VARCHAR 36)
  - [ ] Add `added_by_personalization` (BOOLEAN)
- [ ] Create migration for `itineraries` extensions
  - [ ] Add `personalization_enabled` (BOOLEAN)
  - [ ] Add `personalization_completed` (BOOLEAN)
  - [ ] Add `personalization_completed_at` (DATETIME)
- [ ] Create new table `user_deck_interactions`
- [ ] Create new table `itinerary_cart_items`
- [ ] Create new table `personalization_sessions`
- [ ] Add indexes for new tables

### 1.2 SQLAlchemy Models
- [ ] Create `UserDeckInteraction` model
- [ ] Create `ItineraryCartItem` model
- [ ] Create `PersonalizationSession` model
- [ ] Update `Activity` model with new columns
- [ ] Update `TemplateDayActivity` model with new columns
- [ ] Update `ItineraryDayActivity` model with new columns
- [ ] Update `Itinerary` model with new columns
- [ ] Add relationships between new models
- [ ] Add enums: `VibeCategory`, `TimeSlot`, `FitStatus`, `CartItemStatus`, `SessionStatus`

### 1.3 Pydantic Schemas
- [ ] Create `gamification.py` schemas file
- [ ] Define `VibeCategory` enum
- [ ] Create `StartSessionRequest` / `SessionResponse`
- [ ] Create `DeckCard` / `DeckResponse`
- [ ] Create `SwipeRequest` / `SwipeResponse`
- [ ] Create `FittedItem` / `MissedItem` / `RevealResponse`
- [ ] Create `ConfirmRequest` / `ConfirmResponse`
- [ ] Create `SwapRequest` / `SwapResponse`
- [ ] Create `PersonalizationStatusResponse`
- [ ] Create `ActivityGamificationUpdate` schema
- [ ] Update `ActivityResponse` to include new fields

### 1.4 Service Layer
- [ ] Create `services/gamification/` directory structure
- [ ] Implement `DeckBuilder` service
  - [ ] `build_deck()` - curate activities by vibe + destination
  - [ ] `score_activity()` - calculate relevance score
  - [ ] `ensure_variety()` - limit per-category count
- [ ] Implement `InteractionRecorder` service
  - [ ] `record_swipe()` - persist interaction
  - [ ] `update_session_stats()` - increment counters
- [ ] Implement placeholder `FitEngine` service (full impl in Phase 3)
- [ ] Implement placeholder `RevealBuilder` service (full impl in Phase 3)

### 1.5 API Endpoints
- [ ] Create `endpoints/gamification.py` for public routes
- [ ] Implement `GET /public/itinerary/{token}/personalization/status`
- [ ] Implement `POST /public/itinerary/{token}/personalization/start`
- [ ] Implement `GET /public/itinerary/{token}/personalization/deck`
- [ ] Implement `POST /public/itinerary/{token}/personalization/swipe`
- [ ] Implement stub `POST /public/itinerary/{token}/personalization/complete`
- [ ] Add routes to public router
- [ ] Add activity gamification fields to existing activity endpoints

### 1.6 Testing Phase 1
- [ ] Write unit tests for DeckBuilder scoring
- [ ] Write unit tests for InteractionRecorder
- [ ] Write API tests for new endpoints
- [ ] Test database migrations (up and down)

---

## Phase 2: Client-Facing Game UI

### 2.1 Project Setup
- [ ] Install Framer Motion: `npm install framer-motion`
- [ ] Create `features/personalization/` directory structure
- [ ] Add gamification colors to Tailwind config
- [ ] Create TypeScript types in `types/personalization.ts`

### 2.2 API Integration
- [ ] Create `api/personalization.ts` with API client functions
  - [ ] `getPersonalizationStatus(token)`
  - [ ] `startSession(token, vibes)`
  - [ ] `getDeck(token)`
  - [ ] `recordSwipe(token, data)`
  - [ ] `completePersonalization(token)`
  - [ ] `confirmSelections(token)`
  - [ ] `swapActivity(token, data)`
- [ ] Create `hooks/usePersonalization.ts` state management hook

### 2.3 Entry Point Component
- [ ] Create `PersonalizationEntry.tsx` CTA button component
- [ ] Style with gradient/glow effect
- [ ] Add pulsing animation for attention
- [ ] Integrate into `PublicItinerary.tsx`
- [ ] Show only when `personalization_enabled && !personalization_completed`

### 2.4 Vibe Check Screen
- [ ] Create `VibeCheck.tsx` component
- [ ] Implement floating bubble layout
- [ ] Add bubble tap animation (glow + scale)
- [ ] Track selected vibes (1-3 max)
- [ ] Show "Start" button after 1+ selection
- [ ] Add background animation (slow-moving particles)
- [ ] Mobile-first responsive design

### 2.5 Swipe Deck Screen
- [ ] Create `SwipeDeck.tsx` main container
- [ ] Create `SwipeCard.tsx` individual card component
  - [ ] Full-screen vertical hero image
  - [ ] Gradient overlay (bottom 35%)
  - [ ] Marketing badge (top left)
  - [ ] Title, location, duration (bottom)
  - [ ] Rating with stars
  - [ ] Price display (electric green)
- [ ] Create `CardFlip.tsx` for card detail view
  - [ ] Flip animation on tap
  - [ ] Full description text
  - [ ] Highlights list
  - [ ] "Save for Later" action (optional)
- [ ] Implement swipe gesture handling
  - [ ] Create `hooks/useSwipeGesture.ts`
  - [ ] Track drag direction and distance
  - [ ] Apply rotation transform (15deg)
  - [ ] Show YES/NOPE overlay
  - [ ] Snap back if threshold not met
- [ ] Add progress bar (top of screen)
- [ ] Add control buttons (X, Heart, Info) in thumb zone
- [ ] Implement image prefetch for next 2 cards
- [ ] Create `hooks/useHaptics.ts` for vibration feedback

### 2.6 Routing
- [ ] Add `/trip/:token/personalize` route
- [ ] Create `PersonalizationFlow.tsx` main flow container
- [ ] Handle step navigation (Vibe → Deck → Loading → Reveal)

### 2.7 Animations
- [ ] Create `animations/cardAnimations.ts` Framer variants
  - [ ] Entry animation (scale from 0.8)
  - [ ] Exit left animation
  - [ ] Exit right animation
  - [ ] Flip animation
- [ ] Add micro-reward pulse every 3-5 swipes
- [ ] Add progress bar fill animation

### 2.8 Testing Phase 2
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Test touch gestures
- [ ] Test keyboard accessibility
- [ ] Performance testing (60fps animations)

---

## Phase 3: Fit Engine & Reveal

### 3.1 Fit Engine Implementation
- [ ] Complete `FitEngine` service implementation
- [ ] Define time window constants (MORNING/AFTERNOON/EVENING)
- [ ] Implement `get_available_windows()` - find gaps in schedule
- [ ] Implement `calculate_fit()` - check if activity fits window
- [ ] Implement `fit_activities()` main algorithm
  - [ ] Load itinerary with locked activities
  - [ ] Sort liked activities by priority
  - [ ] Iterate and attempt fits
  - [ ] Track missed items with reasons
- [ ] Implement `generate_swap_suggestions()` for missed items
- [ ] Handle edge cases (empty days, all-day activities)

### 3.2 Reveal Builder Implementation
- [ ] Complete `RevealBuilder` service implementation
- [ ] Build fitted items list with day/time details
- [ ] Build missed items list with swap suggestions
- [ ] Calculate total added price
- [ ] Generate timeline structure for frontend

### 3.3 API Completion
- [ ] Complete `POST .../personalization/complete` endpoint
- [ ] Implement `POST .../personalization/confirm` endpoint
  - [ ] Create `ItineraryDayActivity` records for fitted items
  - [ ] Mark cart items as CONFIRMED
  - [ ] Update itinerary total price
  - [ ] Set `personalization_completed = True`
- [ ] Implement `POST .../personalization/swap` endpoint
  - [ ] Remove one fitted item
  - [ ] Add missed item in its place
  - [ ] Recalculate totals

### 3.4 Magic Crunch Screen
- [ ] Create `MagicCrunch.tsx` loading component
- [ ] Design stylized map background
- [ ] Implement pin drop animation (locked = grey, liked = green)
- [ ] Add connecting polylines animation
- [ ] Create rotating copy messages
- [ ] Ensure max 3 second display time

### 3.5 Reveal Timeline Screen
- [ ] Create `RevealTimeline.tsx` component
- [ ] Implement vertical scrolling timeline
- [ ] Style locked blocks (grey, no delete)
- [ ] Style flexible blocks (green, user-added)
- [ ] Add confetti trigger on load (use canvas-confetti or similar)
- [ ] Create `MissedConnections.tsx` bottom sheet
  - [ ] Collapsed by default
  - [ ] Show missed items with reasons
  - [ ] Add "Swap with X?" action buttons
- [ ] Create `ConfirmFooter.tsx` sticky component
  - [ ] Show added total (left)
  - [ ] "Confirm & Pay" button (right)

### 3.6 Swap Flow
- [ ] Implement swap confirmation modal
- [ ] Update timeline after swap
- [ ] Recalculate totals
- [ ] Handle swap failures gracefully

### 3.7 Testing Phase 3
- [ ] Unit tests for FitEngine algorithm
- [ ] Integration tests for complete flow
- [ ] Test edge cases (0 likes, all fits, no fits)
- [ ] E2E test full journey

---

## Phase 4: Agency Controls & Analytics

### 4.1 Agency Itinerary Controls
- [ ] Add personalization toggle to itinerary edit page
- [ ] Create `PersonalizationSettings` component
  - [ ] Enable/disable toggle
  - [ ] (Future: deck size, category filters, price caps)
- [ ] Update `PUT /itineraries/{id}` to handle personalization settings

### 4.2 Activity Gamification Fields
- [ ] Add gamification fields to activity edit form
  - [ ] Price numeric input
  - [ ] Vibe tags multi-select
  - [ ] Marketing badge dropdown
  - [ ] Location coordinates (lat/lng)
  - [ ] Optimal time of day selector
  - [ ] Blocked days checkboxes
- [ ] Add "Gamification Ready" indicator/badge
- [ ] Implement validation for gamification readiness
  - [ ] Has hero image
  - [ ] Has price_numeric set
  - [ ] Has at least 1 vibe_tag
  - [ ] Has highlights

### 4.3 Analytics Dashboard
- [ ] Create `GET /itineraries/{id}/personalization/analytics` endpoint
- [ ] Return session statistics
  - [ ] Total sessions
  - [ ] Completion rate
  - [ ] Average cards liked
  - [ ] Average time spent
  - [ ] Most liked activities
  - [ ] Most passed activities
- [ ] Create `PersonalizationAnalytics.tsx` component
- [ ] Add to itinerary detail page (agency view)

### 4.4 Polish & Performance
- [ ] Add loading states for all async operations
- [ ] Add error handling and retry logic
- [ ] Implement session resume (within 24h)
- [ ] Add WebSocket notification on personalization complete
- [ ] Optimize image loading (WebP, lazy load)
- [ ] Add analytics event tracking

### 4.5 Documentation & Cleanup
- [ ] Update API documentation
- [ ] Add inline code comments
- [ ] Create user guide for agencies
- [ ] Performance audit and optimization
- [ ] Security review (rate limiting, input validation)

---

## Completion Checklist

### MVP Definition (End of Phase 3)
- [ ] CTA entry from shared itinerary
- [ ] Vibe Check screen functional
- [ ] 15-20 card swipe deck working
- [ ] Magic Crunch animation
- [ ] Reveal timeline with fitted items
- [ ] Persist liked items to itinerary
- [ ] Display added total

### Post-MVP (Phase 4+)
- [ ] Full agency controls
- [ ] Analytics dashboard
- [ ] Payment integration
- [ ] Collaborative personalization
- [ ] AI recommendations

---

## Session Log

| Date | Phase | Tasks Completed | Notes |
|------|-------|-----------------|-------|
| _TBD_ | 1 | - | Project kickoff |

---

## Dependencies & Blockers

| Blocker | Status | Resolution |
|---------|--------|------------|
| None identified | - | - |

---

## Technical Debt Tracker

| Item | Priority | Notes |
|------|----------|-------|
| Add full time-slot precision | Low | Using simple windows for v1 |
| Orphaned file cleanup | Medium | Need cleanup job for deleted activity images |
| Session resume logic | Medium | Allow users to continue abandoned sessions |
