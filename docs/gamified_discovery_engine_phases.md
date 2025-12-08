# Project Status: Gamified Discovery Engine

## Current Status: Setup Complete - Ready for Parallel Development

---

## Parallel Development Architecture

This project uses **git worktrees** for parallel phase development, enabling simultaneous work on all phases.

### Worktree Structure

| Worktree | Branch | Focus |
|----------|--------|-------|
| `/home/user/bizvoy-phase1` | `claude/gamified-phase1-01B9scX6fBF4DgEUUxf9gq3W` | Database, Models, Backend APIs |
| `/home/user/bizvoy-phase2` | `claude/gamified-phase2-01B9scX6fBF4DgEUUxf9gq3W` | Frontend Game UI |
| `/home/user/bizvoy-phase3` | `claude/gamified-phase3-01B9scX6fBF4DgEUUxf9gq3W` | Fit Engine & Reveal |
| `/home/user/bizvoy-phase4` | `claude/gamified-phase4-01B9scX6fBF4DgEUUxf9gq3W` | Agency Controls & Analytics |
| `/home/user/bizvoy-integration` | `claude/gamified-integration-01B9scX6fBF4DgEUUxf9gq3W` | Integration & Testing |

### Development Flow

```
Phase 1 (Backend Foundation) ─────┐
                                  │
Phase 2 (Frontend UI) ────────────┼──→ Integration ──→ Main
                                  │       Phase
Phase 3 (Fit Engine) ─────────────┤
                                  │
Phase 4 (Agency Controls) ────────┘
```

### Parallel Development Strategy

| Phase | Can Start | Dependencies | Mocking Strategy |
|-------|-----------|--------------|------------------|
| Phase 1 | Immediately | None | N/A - Foundation |
| Phase 2 | Immediately | Phase 1 APIs | Mock API responses, use TypeScript interfaces |
| Phase 3 | Immediately | Phase 1 Models | Mock models, implement algorithm logic |
| Phase 4 | Immediately | Phase 1 APIs | Mock API responses, build UI components |
| Phase 5 | After all phases | All phases | Merge and integrate |

---

## Overview

| Phase | Focus | Tasks | Status |
|-------|-------|-------|--------|
| Phase 1 | Database, Models & Backend APIs | ~35 | Not Started |
| Phase 2 | Client-Facing Game UI | ~30 | Not Started |
| Phase 3 | Fit Engine, Reveal & Confirm | ~20 | Not Started |
| Phase 4 | Agency Controls, Analytics & Polish | ~20 | Not Started |
| **Phase 5** | **Integration & Testing** | **~25** | Not Started |

**Total Estimated Tasks: ~130**

---

## Phase 1: Database, Models & Backend APIs

**Worktree:** `/home/user/bizvoy-phase1`
**Branch:** `claude/gamified-phase1-01B9scX6fBF4DgEUUxf9gq3W`

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
- [ ] Implement `DeckBuilder` service
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
- [ ] Implement `POST /public/itinerary/{token}/personalization/complete`
- [ ] Implement `POST /public/itinerary/{token}/personalization/confirm`
- [ ] Implement `POST /public/itinerary/{token}/personalization/swap`
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

---

## Phase 2: Client-Facing Game UI

**Worktree:** `/home/user/bizvoy-phase2`
**Branch:** `claude/gamified-phase2-01B9scX6fBF4DgEUUxf9gq3W`

**Mocking Strategy:** Create mock API responses matching Phase 1 schemas. Use TypeScript interfaces from plan.md.

### 2.1 Project Setup
- [ ] Install dependencies: `framer-motion`, `@fingerprintjs/fingerprintjs`, `canvas-confetti`
- [ ] Create `features/personalization/` directory structure
- [ ] Add gamification colors to Tailwind config
- [ ] Add custom animations to Tailwind config
- [ ] Create TypeScript interfaces in `types/personalization.ts`
- [ ] Create mock data for development (`mocks/personalization.ts`)

### 2.2 API Integration Layer
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
- [ ] Add environment flag for mock vs real API

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

### 2.7 Magic Crunch Screen
- [ ] Create `MagicCrunch.tsx` component
- [ ] Design stylized map background (SVG or CSS)
- [ ] Implement pin drop animation
  - [ ] Grey pins for locked items
  - [ ] Green pins for liked items
- [ ] Add polyline drawing animation
- [ ] Create rotating copy messages array
- [ ] Ensure max 3 second display

### 2.8 Reveal Timeline Screen (UI Only)
- [ ] Create `RevealTimeline.tsx` container
- [ ] Create `TimelineDay.tsx` component
- [ ] Create `TimelineActivity.tsx` component (locked vs flexible styles)
- [ ] Trigger confetti on load
- [ ] Create `MissedConnections.tsx` bottom sheet
- [ ] Create `SwapModal.tsx` confirmation dialog
- [ ] Create `SavedForLater.tsx` expandable section
- [ ] Create `ConfirmFooter.tsx` sticky component
- [ ] Create `PaymentInfo.tsx`

### 2.9 Animations
- [ ] Create `animations/cardAnimations.ts` Framer variants
- [ ] Create `animations/bubbleAnimations.ts`
- [ ] Create `animations/confetti.ts` for reveal

---

## Phase 3: Fit Engine, Reveal & Confirm

**Worktree:** `/home/user/bizvoy-phase3`
**Branch:** `claude/gamified-phase3-01B9scX6fBF4DgEUUxf9gq3W`

**Mocking Strategy:** Create mock model classes matching Phase 1 SQLAlchemy models. Focus on algorithm implementation.

### 3.1 Fit Engine Implementation
- [ ] Create mock models for testing (`mocks/models.py`)
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

### 3.3 Swap Logic
- [ ] Implement swap validation
- [ ] Implement `execute_swap()` function
- [ ] Recalculate totals after swap
- [ ] Update cart item statuses

### 3.4 Confirmation Logic
- [ ] Implement `confirm_personalization()` function
- [ ] Create ItineraryDayActivity records for fitted items
- [ ] Mark cart items as CONFIRMED
- [ ] Update itinerary total price
- [ ] Set personalization_completed = True

### 3.5 Unit Tests
- [ ] Test fit algorithm with various scenarios
- [ ] Test time window calculations
- [ ] Test swap logic
- [ ] Test edge cases (0 likes, all fits, no fits)
- [ ] Test policy differences (STRICT/BALANCED/AGGRESSIVE)

---

## Phase 4: Agency Controls, Analytics & UI

**Worktree:** `/home/user/bizvoy-phase4`
**Branch:** `claude/gamified-phase4-01B9scX6fBF4DgEUUxf9gq3W`

**Mocking Strategy:** Create mock API responses. Build UI components independently.

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

### 4.5 Analytics Service & Dashboard
- [ ] Implement `AnalyticsService`
  - [ ] `get_itinerary_analytics()`
  - [ ] `get_agency_analytics()`
- [ ] Create `PersonalizationAnalyticsDashboard.tsx`
  - [ ] Sessions summary cards
  - [ ] Completion/confirmation rates
  - [ ] Average time/cards metrics
  - [ ] Most liked activities chart
  - [ ] Most passed activities chart
  - [ ] Vibe popularity breakdown
  - [ ] Revenue impact

---

## Phase 5: Integration & Testing

**Worktree:** `/home/user/bizvoy-integration`
**Branch:** `claude/gamified-integration-01B9scX6fBF4DgEUUxf9gq3W`

### 5.1 Branch Merging
- [ ] Merge Phase 1 into integration branch
- [ ] Resolve any conflicts
- [ ] Merge Phase 2 into integration branch
- [ ] Resolve any conflicts
- [ ] Merge Phase 3 into integration branch
- [ ] Resolve any conflicts
- [ ] Merge Phase 4 into integration branch
- [ ] Resolve any conflicts

### 5.2 API Integration
- [ ] Remove mock API layer from Phase 2
- [ ] Connect frontend to real backend APIs
- [ ] Test all API endpoints end-to-end
- [ ] Fix any integration issues

### 5.3 Database Integration
- [ ] Run all migrations in sequence
- [ ] Verify data integrity
- [ ] Test data migration scripts on sample data
- [ ] Seed test data for all agencies

### 5.4 End-to-End Testing
- [ ] Test complete personalization flow
  - [ ] Entry from shared itinerary
  - [ ] Vibe Check selection
  - [ ] Swipe deck (like, pass, save)
  - [ ] Magic Crunch animation
  - [ ] Reveal timeline
  - [ ] Swap functionality
  - [ ] Confirm and persist
- [ ] Test agency controls
  - [ ] Settings update
  - [ ] Vibes management
  - [ ] Activity gamification fields
  - [ ] Itinerary personalization toggle
- [ ] Test analytics dashboard
- [ ] Test multi-user scenarios (different devices, same itinerary)
- [ ] Test session resume

### 5.5 Cross-Browser & Device Testing
- [ ] Test on iOS Safari (iPhone)
- [ ] Test on Android Chrome
- [ ] Test on Desktop Chrome
- [ ] Test on Desktop Firefox
- [ ] Test on Desktop Safari
- [ ] Test responsive design (320px - 1920px)

### 5.6 Performance Testing
- [ ] Deck building < 500ms
- [ ] Fit algorithm < 2s
- [ ] Animation 60fps
- [ ] Image loading optimization
- [ ] API response times

### 5.7 Security Review
- [ ] Rate limiting on public endpoints
- [ ] Input validation
- [ ] Session hijacking prevention
- [ ] SQL injection prevention
- [ ] XSS prevention

### 5.8 Final Polish
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Add retry logic for network failures
- [ ] Implement session resume (within 24h)
- [ ] Add "Undo last swipe" button
- [ ] WebSocket notifications on personalization complete

### 5.9 Documentation
- [ ] Update API documentation
- [ ] Add inline code comments
- [ ] Create agency onboarding guide
- [ ] Update README with new features

---

## Completion Checklist

### MVP (End of Integration)
- [ ] CTA entry from shared itinerary
- [ ] Vibe Check screen with agency vibes
- [ ] 15-25 card swipe deck
- [ ] Magic Crunch animation
- [ ] Reveal timeline with fitted/missed items
- [ ] Swap functionality
- [ ] Confirm and persist to itinerary
- [ ] Payment info display (QR/bank)
- [ ] Independent sessions per user/device
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Security review complete

### Full Version
- [ ] Full agency personalization settings
- [ ] Custom vibes management
- [ ] Activity gamification fields
- [ ] Readiness score dashboard
- [ ] Per-itinerary controls
- [ ] Analytics dashboard
- [ ] Session resume
- [ ] Cross-browser tested

---

## Session Log

| Date | Phase | Branch | Tasks Completed | Notes |
|------|-------|--------|-----------------|-------|
| 2025-12-08 | Setup | main | Created plan.md, phases.md | Initial documentation |
| 2025-12-08 | Setup | all | Created worktrees for parallel dev | Ready to start |

---

## Git Commands Reference

### Working with Worktrees

```bash
# List all worktrees
git worktree list

# Switch to a worktree
cd /home/user/bizvoy-phase1

# Push changes from a worktree
cd /home/user/bizvoy-phase1
git add .
git commit -m "Phase 1: message"
git push -u origin claude/gamified-phase1-01B9scX6fBF4DgEUUxf9gq3W

# Merge into integration (from integration worktree)
cd /home/user/bizvoy-integration
git merge claude/gamified-phase1-01B9scX6fBF4DgEUUxf9gq3W
```

### Branch Summary

| Phase | Branch Name |
|-------|-------------|
| Phase 1 | `claude/gamified-phase1-01B9scX6fBF4DgEUUxf9gq3W` |
| Phase 2 | `claude/gamified-phase2-01B9scX6fBF4DgEUUxf9gq3W` |
| Phase 3 | `claude/gamified-phase3-01B9scX6fBF4DgEUUxf9gq3W` |
| Phase 4 | `claude/gamified-phase4-01B9scX6fBF4DgEUUxf9gq3W` |
| Integration | `claude/gamified-integration-01B9scX6fBF4DgEUUxf9gq3W` |

---

## Dependencies

### NPM Packages (Phase 2 Frontend)
- `framer-motion` - Swipe animations
- `@fingerprintjs/fingerprintjs` - Device identification
- `canvas-confetti` - Reveal celebration
- `react-color` or similar - Vibe color picker

### Python Packages (Backend)
- None additional required (using existing stack)

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation | Phase |
|------|------------|--------|------------|-------|
| Merge conflicts | Medium | Medium | Small focused commits, frequent merges | 5 |
| API contract mismatch | Medium | High | Strict TypeScript interfaces from plan.md | 2,5 |
| Mock data divergence | Low | Medium | Generate mocks from schemas | 2,3,4 |
| Performance regression | Low | High | Performance tests in Phase 5 | 5 |
| Mobile gesture issues | Medium | High | Extensive device testing | 2,5 |
