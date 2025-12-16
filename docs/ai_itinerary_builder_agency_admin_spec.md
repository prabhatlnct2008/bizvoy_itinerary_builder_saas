# AI Itinerary Builder – Agency Admin Spec

AI-powered flow that lets an **agency admin paste a trip description** (from email/Word/WhatsApp/etc.), auto-creates **Activities** from it, and then **generates a full Template** from those activities – with reuse of existing Activities wherever possible.

The experience must feel **guided and fun**, not "developer tooling". Think of it as a friendly assistant that turns messy trip notes into a clean, reusable template.

---

## 1. Module Overview & Goals

**Goal:** Let agency admins turn any existing trip plan (PDF, email, Word, chat transcript) into a structured Bizvoy Template in < 5 minutes.

**Key outcomes:**
- Reduce manual activity and template creation time by 70%+.
- Encourage agencies to import their **best-selling trips** into Bizvoy quickly.
- Maintain data quality by:
  - Reusing existing Activities where possible.
  - Highlighting missing pieces (images, prices) as "Next Steps" instead of blocking.

**Who can use it:**
- Only **Agency Admin** users of agencies that have been **granted access** by Bizvoy Admin.

---

## 2. Permissions & Entry Points

### 2.1 Bizvoy Admin – Agency Permissions

**Location:** In the Bizvoy Admin > Agencies > Agency Detail view (same screen as *Deactivate* button in your screenshot).

Add a new card on the right side under/near the Deactivate area:

- **Card title:** `AI Modules`
- **Row:** `AI Itinerary Builder`
  - Toggle: `Enabled / Disabled` (default: Disabled)
  - Badge when enabled: `Active` (pill with soft green background)
  - Helper text (small, muted): `Allows this agency to turn pasted trip content into reusable templates.`

**Behavior:**
- Only Bizvoy Admin users can see and change this toggle.
- When turned **ON**, the corresponding Agency Admin(s) will see a new nav item in their dashboard.

---

### 2.2 Agency Admin – Navigation Entry

In the **Agency Admin** app (left sidebar):

Add a new navigation item under the Itineraries section:

- Label: `AI Itinerary Builder`
- Icon: Small magic wand / sparkle icon ✨
- Visible only when:
  - User role = `agency_admin`
  - `AI Itinerary Builder` permission = enabled by Bizvoy Admin.

Hover tooltip: `Paste a trip and let AI build activities + templates for you.`

Clicking opens the **AI Itinerary Builder Home / Step 1**.

---

## 3. User Journey (Agency Admin)

High-level steps:

1. Access AI Builder from sidebar.
2. Paste trip content + basic metadata.
3. Watch AI parse progress.
4. Review & clean up suggested Activities (with reuse suggestions).
5. Confirm Template creation.
6. See success screen with **Next Steps checklist** (images, prices, etc.).

Each step is shown in a **4-step progress header** at the top of the page:

`1. Paste Trip` → `2. AI Breakdown` → `3. Review Activities` → `4. Create Template`

Current step is highlighted with a filled pill and progress bar.

---

## 4. Screen Specs

### Screen 1: Paste Trip Content

**Route:** `/ai-itinerary-builder` (default)

**Layout:**
- Two-column layout on desktop, stacked on mobile.

**Left panel – Instructions**
- Title: `Turn messy trip notes into a reusable template`
- Subtext (muted): `Paste your existing itinerary, email, or WhatsApp chat. We’ll detect days, stays, meals, and experiences for you.`
- Mini checklist (bulleted):
  - `✓ Include dates or "Day 1/Day 2" markers if possible`
  - `✓ Mention hotel names, meal plans, and key experiences`
  - `✓ Remove personal names or sensitive info before pasting`

**Right panel – Input form**

- **Field 1: Destination**
  - Label: `Destination`
  - Placeholder: `e.g., Goa`

- **Field 2: Trip title (optional)**
  - Label: `Internal trip name`
  - Placeholder: `Goa 4D3N – Beach & Nightlife`
  - Helper text: `We’ll use this as the base for your template name.`

- **Field 3: Number of days (optional)**
  - Small numeric input with stepper.
  - Helper: `If left blank, we’ll infer days from your content.`

- **Field 4: Raw Trip Content**
  - Large multi-line text area.
  - Placeholder text (grey):
    > Paste any email, Word doc text, or WhatsApp conversation that describes the trip.

- **Primary CTA button:**
  - Label: `Let AI read this` (full width on mobile)

- **Secondary CTA (text link):**
  - `See a sample input` (opens a small modal with example trip text).

**Progress & Feedback**
- When user clicks `Let AI read this`, show inline validation:
  - Ensure Raw Trip Content is not empty.
  - Optional: warn if it looks very short (e.g., `< 200 chars`).

On submit, transition to **Screen 2** with a loading state.

---

### Screen 2: AI Breakdown & Progress

**Objective:** Show that AI is working, and then give a **preview** of the structured data before full review.

**Layout:**
- Top: Progress header (Step 2 highlighted).
- Main card with two sections stacked vertically.

**Section A – Live Progress**

Card header: `AI is turning your notes into activities…`

Inside card, show a vertical checklist timeline with icons:

1. `Reading your content` – spinner → checkmark when done
2. `Detecting days & dates` – spinner → checkmark when done
3. `Finding stays, meals & experiences` – spinner → checkmark when done
4. `Grouping by day` – spinner → checkmark when done
5. `Drafting activity cards` – spinner → checkmark when done

Each completed step fades into a softer color with a small green check icon.

**Section B – Quick Preview**

Once steps 1–5 are done, a preview pane fades in:

- Title: `Preview`
- Example:
  - `Trip to Goa · 4 days`
  - `Detected: 1 stay · 3 breakfasts · 2 outdoor sports · 1 local experience`

Small text: `You’ll be able to edit everything in the next step.`

**CTA:**
- Primary button: `Review activities` (moves to Screen 3)
- Secondary link: `Start over` (takes back to Screen 1 with previous text preserved in local state).

Error state:
- If AI cannot parse any activities:
  - Show friendly message: `We couldn't detect any activities.`
  - Buttons: `Go back & edit text` / `Contact support`.

---

### Screen 3: Review & Reuse Activities

**Objective:** Let the agency admin **review, tweak, and decide reuse vs new** for each suggested activity.

**Layout:**
- Top: Progress header (Step 3 highlighted).
- Left: Day timeline filter.
- Right: Activity list/cards.

**Left – Day Filter Panel**

Small vertical list:
- `All days`
- `Day 1 – Arrival & Check-in`
- `Day 2 – Beaches & Water Sports`
- `Day 3 – Local Experiences`
- … (labels auto-generated from AI where possible)

Clicking a day filters the activity list on the right.

**Right – Activity Review List**

Each row/card (for a suggested activity) shows:

- **Badge chips:** `Stay`, `Breakfast`, `Lunch`, `Wine and Dine`, `Local Experience`, `Outdoor Sports` (from `activity_type_id` mapping).
- **Title input:** Text input prefilled (editable).
- **Location display:** Text input (editable).
- **Short description:** Multi-line textarea (editable).
- **Default duration:** [numeric input] + [unit dropdown hours/days].
- **Price (optional):** Numeric + currency (INR prefilled).
- **Match suggestion box (if any):**
  - Line: `Looks similar to: Sunset Cruise on Mandovi (92% match)`
  - Buttons:
    - `Reuse existing` (primary outline)
    - `Create new activity` (ghost button)

Status pill on the right side of the row:
- `New` (blue) or `Reusing existing` (green).

**Bulk Actions Bar (top of list):**
- `Accept all as new`
- `Auto-reuse best matches` (e.g., any match score > 85%)
- `Clear all decisions`

**Scroll behavior:**
- Infinite scroll or pages of 10–20 activities max.

**CTA area (bottom sticky bar):**
- Summary line: `8 activities will be created · 3 will reuse existing`.
- Primary button: `Create template from these`
- Secondary text link: `Back to AI breakdown`.

---

### Screen 4: Template Creation & Next Steps

**Objective:** Confirm template creation, give a short summary, and clearly show what the user needs to do next (images, prices, etc.).

**Layout:**
- Top: Progress header (Step 4 highlighted, all steps checked).
- Main layout: Two stacked cards.

**Card 1 – Template Summary**

- Title: `Your template is ready`
- Subtext: `We’ve created a reusable template from this trip.`
- Fields (read-only with edit icon for some):
  - `Template name`: `Goa 4D3N – Beach & Nightlife` (editable inline via pencil icon).
  - `Destination`: `Goa`
  - `Days`: `4`
  - `Activities`: `11 total · 4 stay/meals · 7 experiences`
  - `New vs reused`: `7 new activities · 4 reused from your library`

Buttons:
- Primary: `Open template editor`
- Secondary: `View all created activities`

**Card 2 – Next Steps Checklist**

Title: `Next steps to make this client-ready`

Checklist items (each with a progress pill on the right):

1. `Add images to activities`
   - Detail: `4 activities don’t have any images yet.`
   - Action button: `Show me` → opens a filtered Activities view ("Missing images from last import").

2. `Confirm prices`
   - Detail: `3 activities have estimated prices.`
   - Action: `Review price estimates`.

3. `Fine-tune the day flow`
   - Detail: `Open the template to adjust timings and notes for each day.`
   - Action: `Open template editor`.

Each checklist row has a status:
- `To do`, `In progress`, or `Done`.
- Updating status is manual via a small dropdown on the right.

Footer microcopy:
> "You can reuse this template for any future clients. We’ll remember which activities came from this trip."

---

## 5. Visual Design & Microcopy

### General Look & Feel

- Follow existing Bizvoy admin aesthetic (from your screenshots):
  - Clean white background.
  - Light grey sidebars.
  - Primary accent: mid-blue for buttons and links.
- Make AI builder slightly more playful using:
  - Small sparkle / magic wand icons.
  - Friendly microcopy (`"Nice! We found 9 experiences"`).

### Typography

- Heading font size: 22–24px for page titles.
- Section titles: 18px, medium weight.
- Body: 14–15px.
- Helper text: 12–13px, muted grey.

### Progress Tracking

Use a **horizontal stepper** at the top of all AI builder screens:

- Each step label plus a small circle.
- Completed steps: filled circle + connecting line.
- Current step: larger circle in primary color.

Additionally, on Screen 2 use the vertical checklist timeline for inner AI progress.

---

## 6. Backend / Application Behavior (High-level)

### 6.1 AI Parsing Flow

1. Agency admin submits form from Screen 1.
2. Backend enqueues a job:
   - Extract days & day order.
   - Detect stays, meals, transfers, and experiences.
   - Map each item to an `activity_type` (Stay, Breakfast, Lunch, Wine and Dine, Local Experience, Outdoor Sports).
3. Backend returns a `session_id` for the AI builder run.
4. Frontend polls (or uses websockets) to update the progress checklist until done.
5. When complete, backend returns structured draft activities grouped by day for Screen 3.

### 6.2 Reuse Detection Logic (simplified)

For each draft activity:
- Search existing Activities for this agency by:
  - Destination/location
  - Name similarity (fuzzy match)
  - Same `activity_type` and similar duration
- Attach top match and `match_score` to the draft.

When user picks `Reuse existing`, link to that `activity_id` instead of creating a new one.

### 6.3 Template Creation

On `Create template from these`:

1. Create a new Template with:
   - `name` (AI suggested or user-edited)
   - `destination` (from form or AI inference)
   - `days` based on grouped day count
2. For each day:
   - Create `template_day` records.
   - Attach activities either as new Activities or references to existing ones.
3. Store a link between this `template_id` and the AI builder `session_id` for analytics.

---

## 7. User Stories

### Epic: AI Itinerary Builder for Agencies

#### Story 1 – Bizvoy admin enables AI builder for an agency

As a Bizvoy admin, I want to toggle AI Itinerary Builder access for each agency so that only selected agencies can use this feature.

**Acceptance Criteria**
- New `AI Modules` card visible on agency detail page.
- Toggling `AI Itinerary Builder` ON immediately makes the nav item appear for that agency’s admins.
- Toggling OFF hides the nav item and prevents new AI sessions (existing templates remain).

---

#### Story 2 – Agency admin sees AI Itinerary Builder entry

As an agency admin, I want to see a clear entry point for the AI Itinerary Builder in my sidebar so I can discover and use it easily.

**Acceptance Criteria**
- `AI Itinerary Builder` nav item visible only to agency admins with permission.
- Clicking opens Screen 1.

---

#### Story 3 – Agency admin pastes trip content

As an agency admin, I want to paste trip content and add basic trip info so that AI can understand what itinerary to create.

**Acceptance Criteria**
- Form validates that raw content is present.
- Destination and day count are optional but accepted when provided.
- On submit, user is taken to Screen 2 with a visible progress state.

---

#### Story 4 – AI progress is visible and reassuring

As an agency admin, I want to see clear progress indicators while AI is working so I know something is happening and what stage it’s in.

**Acceptance Criteria**
- Progress checklist shows each phase changing from spinner → success.
- If processing fails, a helpful error message is shown with options to retry or go back.
- A preview summary of detected structure is shown before continuing.

---

#### Story 5 – Admin reviews suggested activities

As an agency admin, I want to review and edit the activities AI has extracted so I can correct names, descriptions, and durations.

**Acceptance Criteria**
- Activities are grouped by day and type.
- Admin can edit title, description, location, duration, and price.
- Admin can filter by day.

---

#### Story 6 – Admin chooses to reuse or create new activities

As an agency admin, I want to decide whether each suggested activity should reuse an existing activity or create a new one so my activity library stays clean and consistent.

**Acceptance Criteria**
- For activities with good matches, a `Reuse existing` suggestion is shown with match score.
- Selecting `Reuse existing` changes the status pill to `Reusing existing`.
- Selecting `Create new activity` marks it as `New`.
- Summary bar shows totals for new vs reused activities.

---

#### Story 7 – Template is created from reviewed activities

As an agency admin, I want the system to create a template from my reviewed activities so I can reuse this trip for future clients.

**Acceptance Criteria**
- Clicking `Create template from these` creates a new Template in the database.
- Template has correct destination, number of days, and attached day activities.
- User is taken to Screen 4 with a success message and template details.

---

#### Story 8 – Next steps are clearly visible

As an agency admin, I want a clear list of next steps (like adding images or confirming prices) so I know exactly what to do to make the template client-ready.

**Acceptance Criteria**
- Next Steps checklist shows counts for missing images and estimated prices.
- Each checklist item links to filtered views ("show activities created in last AI run with missing images", etc.).
- User can open the Template Editor directly from this screen.

---

#### Story 9 – Activities can be found and edited later

As an agency admin, I want to easily find all activities created from a particular AI import so I can refine them later.

**Acceptance Criteria**
- From Screen 4, `View all created activities` opens the Activities list filtered to `Created via AI builder` for that session.
- Each such activity shows a small tag: `Created via AI`

---

## 8. Fun & Delight Elements

- Use a small mascot / sparkle icon on the header with copy like: `"AI helper"`.
- Add small celebratory message on success: `"Nice! You just turned a messy email into a reusable template."`
- Subtle confetti burst animation on Screen 4 when template is created (respecting B2B tone: light, not cartoonish).

---

End of Spec.

