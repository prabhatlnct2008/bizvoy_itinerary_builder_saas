# Gamified Discovery Engine – Full Spec (v2)

This canvas is rebuilt to match **your exact spec text** and extends it with **better stories/screens**, plus **impact analysis**, **model changes**, and **application changes** you said were still pending.

---

## 1. Executive Summary

**The Core concept:** Transform the tedious task of itinerary planning into a rapid, dopamine-driven game of "This or That."\
**The Metaphor:** Tinder for Travel.\
**The Goal:** Allow a user to make 20 decisions in under 60 seconds, resulting in a high-value cart size through impulse micro-commitments.

### What this unlocks for Bizvoy

- Turns the shared itinerary into an **interactive conversion surface**.
- Converts "I’m not sure" into **micro-commitment momentum**.
- Creates a measurable personalization trail for agents.

---

## 2. Visual Design Language (Look & Feel)

**Aesthetics:** "Immersive & Kinetic."\
**Layout:** Mobile-first, full-screen. No traditional headers/footers while in the "Game Loop."\
**Typography:** Large, bold sans-serif (e.g., Inter or Clash Display) for headlines. High contrast.

### Color Palette

- **Background:** Deep Charcoal (**#1a1a1a**) to make photos pop.
- **Accent (Like/Action):** Electric Green (**#00E676**) or Vibrant Coral (**#FF4081**).
- **Accent (Discard):** Muted Red (**#FF5252**).

### UI Components

- **Glassmorphism:** Bottom sheets and text overlays use a blurred, semi-transparent background (`backdrop-filter: blur(20px)`).
- **Cards:** Rounded corners (`border-radius: 24px`).
- **Shadows:** Deep, soft drop shadows to create depth in the card stack.

### Motion rules (add to design system)

- **Tap feedback:** 120–180ms scale + glow.
- **Swipe physics:** 15° rotation + color wash.
- **Progress micro-reward:** subtle pulse every 3–5 swipes.

---

## 3. Application Flow & User Journey

**Entry:** User clicks "Personalize Trip" link.\
**Calibration:** 5-second "Vibe Check" to filter the deck.\
**The Loop:** User swipes through 15-20 curated cards.\
**The Crunch:** System runs "Bin Packing" algorithm to fit "Liked" items into the itinerary gaps.\
**The Reveal:** User sees the generated schedule and pays.

### Where this appears in the shared itinerary

Add a CTA block in the viewer:

- Primary button: **Personalize Trip**
- Subtext: “20 quick choices • \~60 seconds”

Optional secondary entry:

- Inline link inside Day Overview section: “Add experiences you’ll love”.

---

## 4. Screen-by-Screen Functional Spec

### Screen 1: The "Vibe Check" (Calibration)

**Objective:** Filter the massive database down to 20 relevant cards.

**Visuals:**

- Floating "Bubbles" moving slowly on a dark background.

**Headline:** "What's your Rome vibe?"\
**Subtext:** "Select up to 3."

**Interactions:**

- Tap Bubble: It glows and expands slightly with a spring animation.

**Categories:**

- 🏛️ History
- 🍷 Wine & Dine
- 🚶 Slow Paced
- 📸 Insta-Spots
- 🏎️ Adrenaline

**Action:**

- Floating "Start" button appears only after 1 selection.

**Copy:** "Build My Deck >"

**Additional UX improvements (recommended):**

- Show tiny helper line after 2 seconds: “Choose the mood you want more of.”
- Allow “Skip” only after 1 selection (keeps friction low but prevents empty intent).

---

### Screen 2: The Deck (The Game Loop)

**Objective:** Capture Intent using rich data visuals.

**Layout:**

- Progress Bar (Top): Thin line indicating stack depth (e.g., "Reviewing 1 of 15").
- The Card (Center): 90% Screen Height.
- Background: Full-screen Vertical Hero Image (Critical for engagement).
- Overlay (Bottom 35%): A gradient fade-to-black.

**Rich Content Layer:**

- Badge (Top Left): "🔥 Popular" or "💎 Small Group" (Pill shape, blurred bg).
- Title (Bottom): "Colosseum Underground" (H1, Bold).
- Social Proof: "⭐ 4.9 (320 reviews)" (Yellow stars).
- Logistics: "⏳ 3 Hours • 📍 Historic Center".
- Price: "+\$85" (Large, Electric Green font).

**Controls (Thumb Zone):**

- Left (X): Pass.
- Right (♥): Keep.
- Center (Flip/Info): Tap card to flip for full description text.

**Visual Interactions:**

- Swipe Right: Card rotates 15deg clockwise, overlay turns Green with text "YES".
- Swipe Left: Card rotates 15deg counter-clockwise, overlay turns Red with text "NOPE".

**Haptics:** Light vibration on touch, heavy thud on swipe completion.

**Additional UX improvements (recommended):**

- Add “Save for Later” micro-action on info view.
- Add “Not my vibe” reason tags (optional) purely for analytics.
- Ensure **offline-safe image prefetch** for next 2 cards.

---

### Screen 3: The "Magic Crunch" (Loading)

**Objective:** Hide the 2-second algorithm latency and build value.

**Visuals:**

- A stylized map of the city.

**Animation:**

- The Agency's "Locked" items (Hotel, Flight) drop as grey pins. 📌
- The User's "Swiped Right" items drop as green pins. 📍
- Poly-lines draw connection routes between them.

**Copy (Rotating):**

- "Checking opening hours..."
- "Finding travel routes..."
- "Optimizing your schedule..."

**Additional UX improvements (recommended):**

- Show a mini summary chip: “Liked 5 • Skipped 10”.
- Keep this screen ≤ 3 seconds. If longer, show “We’re making it perfect…” with a reassuring loop.

---

### Screen 4: The Result (Conversion)

**Objective:** Show the "Win."

**Header:** "We fit 4 of your 5 favorites!"

**The Timeline (Vertical Scroll):**

**Visual Logic:**

- Grey Blocks (Locked): "Airport Transfer" (Cannot be moved/deleted).
- Green Blocks (Flexible): "Colosseum Tour" (Swiped by user, slotted by algorithm).

**Confetti:** Triggers when the screen loads.

**The "Missed Connections" (Bottom Sheet - Collapsed):**

If an item didn't fit:

- Header: "Couldn't fit these:"
- Item: "Vatican Tour (Time conflict with Lunch)"

Action:

- “Swap with Lunch?”

**Sticky Footer:**

- Left: "Added: +\$340"
- Right (Button): **Confirm & Pay**

**Additional UX improvements (recommended):**

- Let the user **expand a day** to see the exact placement logic.
- Add a “Why this fit?” inline explanation: duration, location proximity, time-of-day match.

---

## 5. Database Schema Requirements (SQLite)

This schema update is critical. It transforms your static content tables into a dynamic "E-commerce" and "Scheduling" engine.

```sql
BEGIN TRANSACTION;

-- ---------------------------------------------------------
-- 1. UPGRADE ACTIVITIES (The Deck Source)
-- We need rich visuals and logic constraints for the "Swipe" cards.
-- ---------------------------------------------------------

-- A. Visuals & Marketing (The "Menu Card" Data)
ALTER TABLE activities ADD COLUMN cover_image_url VARCHAR(500); -- CRITICAL: Fast loading hero image
ALTER TABLE activities ADD COLUMN price_numeric DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE activities ADD COLUMN currency_code VARCHAR(3) DEFAULT 'USD';
ALTER TABLE activities ADD COLUMN marketing_badge VARCHAR(50); -- e.g. "SELLING FAST", "POPULAR"
ALTER TABLE activities ADD COLUMN review_count INTEGER DEFAULT 0; -- e.g. 320
ALTER TABLE activities ADD COLUMN review_rating DECIMAL(3, 2); -- e.g. 4.9

-- B. Algorithm Logic (The "Bin Packing" Constraints)
ALTER TABLE activities ADD COLUMN optimal_time_of_day VARCHAR(20); -- 'MORNING', 'EVENING'
ALTER TABLE activities ADD COLUMN blocked_days_of_week JSON; -- e.g. [1] (Monday)
ALTER TABLE activities ADD COLUMN latitude DECIMAL(9, 6);
ALTER TABLE activities ADD COLUMN longitude DECIMAL(9, 6);
ALTER TABLE activities ADD COLUMN vibe_tags JSON; -- e.g. ["history", "active"]


-- ---------------------------------------------------------
-- 2. UPGRADE TEMPLATES (The Skeleton)
-- Templates must now define Time Slots to create "Gaps".
-- ---------------------------------------------------------

-- A. Time Blocking
ALTER TABLE template_day_activities ADD COLUMN start_time TIME;
ALTER TABLE template_day_activities ADD COLUMN end_time TIME;

-- B. Locking Logic
-- Default = 1 (Locked). Items the agency puts in the template are usually mandatory.
ALTER TABLE template_day_activities ADD COLUMN is_locked_by_agency BOOLEAN DEFAULT 1;


-- ---------------------------------------------------------
-- 3. UPGRADE ITINERARIES (The Instance)
-- The cloned itinerary needs the same time/lock logic to execute the schedule.
-- ---------------------------------------------------------

ALTER TABLE itinerary_day_activities ADD COLUMN start_time TIME;
ALTER TABLE itinerary_day_activities ADD COLUMN end_time TIME;
ALTER TABLE itinerary_day_activities ADD COLUMN is_locked_by_agency BOOLEAN DEFAULT 0;
ALTER TABLE itinerary_day_activities ADD COLUMN source_cart_item_id VARCHAR(36); -- Traceability


-- ---------------------------------------------------------
-- 4. NEW TABLES (The Engine)
-- ---------------------------------------------------------

-- Track the "Swipe" (Reactions)
CREATE TABLE IF NOT EXISTS "user_deck_interactions" (
    "id" VARCHAR(36) PRIMARY KEY,
    "user_id" VARCHAR(36) NOT NULL,
    "itinerary_id" VARCHAR(36) NOT NULL,
    "activity_id" VARCHAR(36) NOT NULL,
    "action" VARCHAR(10) NOT NULL, -- 'LIKED', 'PASSED'
    "seconds_viewed" INTEGER,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE,
    FOREIGN KEY("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE
);

-- Track the "Buy" (Cart)
CREATE TABLE IF NOT EXISTS "itinerary_cart_items" (
    "id" VARCHAR(36) PRIMARY KEY,
    "itinerary_id" VARCHAR(36) NOT NULL,
    "activity_id" VARCHAR(36) NOT NULL,
    "quoted_price" NUMERIC(10, 2) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'PENDING', -- PENDING -> BOOKED
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
```

### Recommended refinements (to avoid duplication with your new multi-image model)

- If you already have `activity_images` with hero support, prefer:
  - **Do NOT rely only on ****cover\_image\_url****.**
  - Treat it as optional fallback for legacy data.
- Add a computed field in responses:
  - `hero_image_url = cover_image_url OR activity_images.hero`.

---

## 6. The "Bin Packing" Logic (Application Layer)

When the user finishes the deck (Screen 3), the backend runs this logic:

**Input:**

- Locked\_Slots (From Agency Template).
- Liked\_Items (From user\_deck\_interactions where action='LIKED').

**Sort:**

- Order Liked\_Items by Priority (Price High -> Low) or Duration (Long -> Short).

**Iterate:**

- Take Item A.
- Find the first available gap in Locked\_Slots > Item A Duration.
- Check Constraints: Is the venue open? Is it the right time of day?

**If Fit:**

- Create itinerary\_cart\_item.
- Temporarily "Fill" that gap in memory.

**If No Fit:**

- Add to Missed\_Connections list.

**Output:**

- A structured JSON object for Screen 4 to render the Timeline.

### Recommended v1 simplification

To ship fast without full time-slot precision:

- Define default day windows:
  - Morning 09:00–12:00
  - Afternoon 12:00–16:00
  - Evening 16:00–20:00
- Treat locked items as consuming the closest window.
- Fit liked items into remaining windows.

---

## 7. New Stories (Improved)

### Epic: Gamified Personalization for Shared Itineraries

#### Story 1: Client starts personalization

As a client, I want to click “Personalize Trip” so I can quickly shape the itinerary to my vibe.

**Acceptance criteria**

- Entry CTA visible on shared itinerary.
- Game opens in full-screen mobile-first mode.

---

#### Story 2: Vibe Check filters the deck

As a client, I want to choose up to 3 vibe categories so the system shows me relevant experiences.

**Acceptance criteria**

- “Start” enabled after at least 1 selection.
- Selected bubbles show glow + scale animation.

---

#### Story 3: Swipe deck captures intent

As a client, I want to rapidly like or pass cards so personalization feels effortless.

**Acceptance criteria**

- 15–20 cards per session.
- Right swipe = Like, left swipe = Pass.
- Info view available without breaking flow.

---

#### Story 4: Crunch explains value

As a client, I want to see a short “Magic Crunch” animation so I trust the system is optimizing the plan.

**Acceptance criteria**

- Loading lasts 1–3 seconds.
- Uses map + pin animation.

---

#### Story 5: Reveal promotes conversion

As a client, I want to see what fit and what didn’t, with swap suggestions, so I can confirm confidently.

**Acceptance criteria**

- Locked vs flexible blocks visually distinct.
- Missed items shown in bottom sheet.
- Sticky footer shows added total + confirm CTA.

---

## 8. Screen Additions to Existing Product

### Shared Itinerary Viewer changes

- Add **Personalize Trip** CTA.
- Show small “This trip supports quick personalization” badge.
- Add section “Make this trip yours” before the day list.

### Agency-side Itinerary Editor changes

- Toggle: Enable/Disable personalization for this itinerary.
- Optional setting:
  - Deck size
  - Allowed categories
  - Price caps

---

## 9. Model / Entity Changes (Product View)

### Existing entities impacted

- Activity
- TemplateDayActivity
- ItineraryDayActivity

### New entities introduced

- UserDeckInteraction
- ItineraryCartItem

### Optional future entity

- PersonalizationSession
  - Useful for analytics, retries, and multi-device continuity.

---

## 10. Application Changes Required (Functional)

### A) Deck Builder Service

- Inputs:
  - Itinerary destination
  - Agency allowed categories
  - Vibe selections
- Output:
  - Ranked list of 15–20 activities.

### B) Interaction Recorder

- Persist Like/Pass with `seconds_viewed`.

### C) Fit Engine v1

- Minimal gap filling + simple constraints.

### D) Reveal Payload Builder

- Returns:
  - What was inserted
  - Why
  - What didn’t fit
  - Swap suggestions
  - Added total value

---

## 11. Risks & Guardrails

- **Over-promising personalization:** keep deck short and precise.
- **Low image quality:** enforce “game-ready” activity quality signals for pilot agencies.
- **Complex time logic:** ship v1 with default windows.
- **Brand trust:** never allow client changes to locked items.

---

## 12. MVP Definition

MVP includes:

1. CTA entry from shared itinerary.
2. Vibe Check.
3. 15–20 card swipe deck.
4. Crunch animation.
5. Reveal timeline with added total.
6. Persist liked items as cart-additions to itinerary instance.

---

## 13. Phase Plan

### Phase 1

- Extend Activity data for deck.
- Create deck interactions + cart tables.

### Phase 2

- Build client-facing game UI.

### Phase 3

- Fit engine v1 + Reveal rendering.

### Phase 4

- Agency controls + analytics.

---

## 14. Notes on Alignment with Your Current System

This spec assumes:

- You already support **multi-image activities**.
- Templates/Itineraries already have day/activity relationships.

This engine becomes a **layer on top of your existing Activities → Templates → Itineraries** architecture rather than a replacement.

---

End of Spec

