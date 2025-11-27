# Create Itinerary – Step 1 (Starting Point) – Design Spec

## 1. Purpose of this screen

Help the agent confidently choose how to start an itinerary (from scratch or from a template) and then move forward to Client & Dates.

The user flow should feel like:

Land on page → immediately understand it's Step 1 of 2 → click a starting option → see it marked as selected → hit Next: Client & Dates →.

---

## 2. Layout Overview

Page layout (desktop):
- Left: sidebar navigation (unchanged).
- Main content width: max-width ~960–1080px, centered, with generous white space.
- Vertical structure:
  1. Page Header (title + subtitle)
  2. Stepper (small, under header)
  3. Main Card: "Select a starting point"
  4. Sticky Bottom Action Bar with Next button

Base background: #F8FAFC (Tailwind slate-50) or equivalent light grey.

---

## 3. Page Header & Stepper

### 3.1 Header Block

**Content**
- Title: Create itinerary
- Subtitle: Choose a starting point, then add client details and dates.

**Styling**
- Container: bottom border + spacing
  - `border-b border-slate-100 pb-4 mb-6`
- Title:
  - `text-xl md:text-2xl font-semibold text-slate-900`
- Subtitle:
  - `mt-1 text-sm text-slate-500`

Add a small secondary helper text (optional) under subtitle:
- Step 1 of 2 · You can modify days and activities later – this just sets the starting structure.
- `mt-1 text-xs text-slate-500`

### 3.2 Stepper

Place directly under header, left-aligned.

**Structure**
- Flex row: `flex items-center gap-3 mt-3 text-xs`

Step elements:
- Current step (1 – Starting Point)
  - Badge: `w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-xs font-semibold`
  - Label: `ml-1 text-xs font-medium text-slate-800` (text: Starting point)
- Divider arrow / line: simple chevron or line —
- Next step (2 – Client & Dates)
  - Badge: `w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-semibold`
  - Label: `ml-1 text-xs font-medium text-slate-500` (text: Client & dates)

Optional horizontal rule underneath: `h-px flex-1 bg-slate-200 mt-3`.

---

## 4. Main Card – "Select a starting point"

### 4.1 Card Container

This should feel like a focused step, almost like a wizard card.

**Styling**
- `bg-white rounded-2xl shadow-sm border border-slate-100 px-5 md:px-6 py-5 md:py-6`
- Margin-top from header: `mt-5`

### 4.2 Card Header Row

**Left side:**
- Title: Select a starting point
  - `text-sm md:text-base font-semibold text-slate-900`
- Subtitle: Choose a template or start from scratch. You can edit all details later.
  - `mt-1 text-xs md:text-sm text-slate-500`

**Right side:**
- Secondary action: Skip to client details
  - This is not the primary CTA.
  - Style: `text-xs md:text-sm text-slate-500 hover:text-slate-700 underline-offset-4 hover:underline`

Layout: `flex items-start justify-between gap-3 flex-wrap`

### 4.3 Choices Grid (Start from scratch + Templates)

Below the header, show choices as a responsive grid of cards.

**Grid layout**
- `mt-5 grid gap-4`
- Breakpoints:
  - `grid-cols-1` on small/mobile
  - `md:grid-cols-3` on desktop

Each card uses the same base component with variations.

---

## 5. Choice Card Component

### 5.1 Base Card Styling
- Wrapper: `relative group cursor-pointer h-full`
- Card:
  - `rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-4 flex flex-col justify-between`
- Hover state:
  - `group-hover:border-amber-300 group-hover:bg-amber-50/70 group-hover:shadow-sm transition`

### 5.2 Selected State

When a card is selected (via click):
- Add ring & stronger background:
  - `border-amber-400 bg-amber-50 ring-2 ring-amber-200` (can be conditionally applied)
- Add checkmark badge in top-right:
  - `absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]`

Copy inside check: ✓.

---

## 6. Content – "Start from scratch" Card

**Content structure**
1. Small label:
   - Text: FROM BLANK
   - Style: `text-[11px] font-medium tracking-[0.14em] uppercase text-slate-500`
2. Name:
   - Text: Start from scratch
   - Style: `mt-1 text-sm md:text-base font-semibold text-slate-900`
3. Subtitle:
   - Text: Build a custom itinerary without using a template.
   - Style: `mt-1 text-xs text-slate-500`
4. Benefits row (optional):
   - Layout: `mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500`
   - Pills:
     - Base style: `inline-flex items-center rounded-full bg-white px-2 py-0.5 border border-slate-200`
     - Example text: Full control, Unique trips

---

## 7. Content – Template Cards

Each template card (e.g., Abcd, Yes templeta) uses the same structure.

**Top label row**
- Status chip:
  - Text: Published or Draft
  - Style: `inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2 py-0.5` (for Published)
  - Draft variant: `bg-slate-100 text-slate-600`

**Template name**
- Text: e.g., Abcd
- Style: `mt-2 text-sm md:text-base font-semibold text-slate-900`

**Destination & duration**
- Text: e.g., Goa • 3 days / 0 nights
- Style: `mt-0.5 text-xs text-slate-500`

**Meta pills row**
- Layout: `mt-3 flex flex-wrap gap-2`
- Pill style: `inline-flex items-center rounded-full bg-white px-2 py-0.5 border border-slate-200 text-[11px] text-slate-600`
- Example content:
  - Beach
  - Family
  - Premium

**Preview link (optional)**
- Positioned at bottom right within card:
  - Text: Preview template
  - Style: `mt-2 text-[11px] font-medium text-amber-700 hover:text-amber-800 self-start`

---

## 8. Sticky Bottom Action Bar (Primary CTA)

This bar makes the flow obvious and always keeps Next on screen.

### 8.1 Layout & Position
- Container:
  - `mt-6 border-t border-slate-100 pt-4`
- For sticky behaviour on smaller screens:
  - `sticky bottom-0 bg-slate-50/90 backdrop-blur-md border-t border-slate-200 px-5 md:px-0 py-3`
- Layout: `flex flex-col md:flex-row items-start md:items-center justify-between gap-3`

### 8.2 Left Side – Selection Summary

When a starting point is selected:
- Text example: Starting point selected: Abcd (Goa • 3 days / 0 nights)
- Style: `text-xs md:text-sm text-slate-600`

When nothing is selected (default):
- Text: Please select a starting point to continue.
- Style: `text-xs md:text-sm text-rose-600`

### 8.3 Right Side – Buttons

**Primary button – Next**
- Text: Next: Client & dates →
- Style (enabled):
  - `inline-flex items-center justify-center rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-900 text-sm font-semibold px-5 py-2.5 shadow-sm transition`
- Style (disabled – no selection yet):
  - `bg-slate-200 text-slate-400 cursor-not-allowed shadow-none`

**Secondary text button**
- Text: Back to itineraries
- Style: `ml-0 md:ml-3 text-xs md:text-sm text-slate-500 hover:text-slate-700`

**Logic:**
- Primary button is disabled until a card is selected.
- Clicking a card sets selectedStartingPoint and enables Next.

---

## 9. Responsive Behaviour

- On mobile:
  - Grid becomes single column.
  - Action bar sticks to bottom of viewport so Next is always visible.
  - Header + stepper stack with smaller font sizes.
- On desktop:
  - 2–3 cards per row depending on width.
  - Action bar can be regular (non-sticky) or still sticky for a premium feel.

---

## 10. UX Copy Summary

Key texts to use:
- Page title: Create itinerary
- Subtitle: Choose a starting point, then add client details and dates.
- Helper: Step 1 of 2 · You can modify days and activities later – this just sets the starting structure.
- Card title: Select a starting point
- Card subtitle: Choose a template or start from scratch. You can edit all details later.
- Start from scratch label: FROM BLANK
- Start from scratch title: Start from scratch
- Start from scratch description: Build a custom itinerary without using a template.
- Next button: Next: Client & dates →
- No selection warning: Please select a starting point to continue.

This spec should give your frontend dev enough detail to recreate a clean, modern, responsive "Create Itinerary – Step 1" that feels like a proper wizard rather than a plain list of options.
