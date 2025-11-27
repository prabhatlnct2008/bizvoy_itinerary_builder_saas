# Templates List + Builder v2 – Stories & Screens

This spec refines the Templates module with:
- List view with search & actions
- Create itinerary directly from a template
- Copy/clone templates
- Safe day handling (no data loss when changing duration)
- Reordering days & activities
- Responsive, clean Edit Template UI

---

## 1. User Stories

### Story T1 – List & Search Templates (List View)

**As an agent**, I want to see all my templates in a searchable list with quick actions so I can easily find, reuse, copy, or archive them.

**Acceptance criteria**
- I see a list (table) of templates, not just cards:
  - Columns: Template Name, Destination(s), Duration (N days / N nights), Status (Draft/Published/Archived), Last Updated, Used in X itineraries.
- A search bar filters by:
  - Template name (contains),
  - Destination (contains).
- Filters:
  - Status filter (Draft / Published / Archived / All).
  - Optional: Destination filter (dropdown or free-text).
- Each row has an actions menu (3-dot "more"):
  - View – opens template in editor/view.
  - Copy – clones template into a new Draft.
  - Create Itinerary – opens itinerary flow with this template pre-selected.
  - Delete – soft delete: mark as archived or is_deleted = true.
- Archived templates:
  - Hidden from default view.
  - Visible only when filter includes Archived.

---

### Story T2 – Create Itinerary from Template Page

**As an agent**, I want to create an itinerary directly from the template list so I don't have to navigate to a separate template selection page.

**Acceptance criteria**
- In the templates list view, each row's actions include "Create Itinerary".
- Clicking "Create Itinerary":
  - Opens the Itinerary Wizard.
  - Step 1 (Select Template) is pre-filled with this template (or skipped if you prefer).
  - The wizard goes to Step 2: Client & Dates.
- After completion, user lands in Itinerary Editor for the newly created itinerary.

---

### Story T3 – Copy Template (Clone)

**As an agent**, I want to quickly copy a template so I can tweak it for a variation without starting from scratch.

**Acceptance criteria**
- From the template list, "Copy" in the row actions:
  - Creates a new template record.
  - Copies: metadata, days, day activities.
  - Sets status = Draft.
  - Sets name to `Original Name (Copy)` (user can edit later).
  - Redirects to the Edit Template screen for the new draft.
- Copied template is independent:
  - Future edits to original or copy do not affect the other.

---

### Story T4 – Add & Reorder Days Without Losing Data

**As an agent**, I want to freely add and reorder days in a template without accidentally losing my final day when changing duration.

**Acceptance criteria**
- Days are managed as explicit day rows, not auto-derived from duration:
  - Adding/removing days is done via "+ Add Day" and a delete action on each day.
  - Editing Duration: X days / Y nights does not auto-delete days.
- If duration_days is less than actual number of days:
  - System does not remove any day.
  - Optionally show an info banner: `Template has 7 days but duration is set to 5. You can update duration or adjust days.`
  - Or auto-sync duration up to #days (but never silently delete).
- User can:
  - `+ Add Day` to append a new day at the end.
  - Reorder days via drag-and-drop.

---

### Story T5 – Reorder Activities Within a Day

**As an agent**, I want to reorder activities inside each day so I can control the flow of the program.

**Acceptance criteria**
- On the Edit Template screen, inside the selected day panel:
  - Each activity row has a drag handle.
  - Agent can drag activities up/down to change order.
- On drop:
  - UI updates activity order.
  - Backend persists new `display_order`.
- New itineraries created from this template reflect this activity order.

---

### Story T6 – Responsive & Usable Edit Template Screen

**As an agent**, I want the Edit Template page to feel clean and usable on both desktop and smaller screens so I can update templates comfortably anytime.

**Acceptance criteria**
- Desktop layout has 3 clear zones:
  1. Template metadata (left).
  2. Days list / timeline (middle).
  3. Selected day activities (right).
- Tablet/mobile layout:
  - Zones stack or use tabs: for example Template Info / Days / Activities.
  - All main actions remain visible: add day, reorder, add activity, save.
  - No key controls hidden behind hover-only states on mobile.

---

## 2. Screen A – Templates List (Updated)

**Purpose**: Search, filter, and act on templates + launch itineraries.

### Layout

#### Page Header
- Title: **Templates**
- Primary button: **+ New Template**

#### Top Toolbar
- **Search input**:
  - Placeholder: `Search by template name or destination…`
  - Debounced text search.
- **Filters**:
  - Status dropdown: All / Draft / Published / Archived
  - Optional destination filter.

#### List / Table

**Columns:**
1. Template Name
2. Destination(s)
3. Duration (e.g. 7 days / 6 nights)
4. Status (pill chip)
5. Last Updated (date/time or date only)
6. Used In (e.g. 3 itineraries)
7. Actions (3-dot menu)

#### Row Actions Menu
- **View** → open Template Builder for that template.
- **Copy** → clone template and navigate to new Draft.
- **Create Itinerary** → open Itinerary Wizard with this template preselected.
- **Delete** → soft delete / archive:
  - Confirmation dialog: `Archive this template? It won't be available for new itineraries, but existing itineraries are unaffected.`
  - Status set to Archived or flag `is_deleted=true`.
  - Row disappears from default view (still accessible via Archived filter).

---

## 3. Screen B – Edit Template (Template Builder v2)

**Purpose**: Build and refine templates with flexible days and activity ordering.

### Desktop Layout

Three main columns:
1. **Left**: Template Info
2. **Middle**: Days Timeline
3. **Right**: Selected Day Activities

---

### 3.1 Left Panel – Template Info

**Card: Template Details**

**Fields:**
- Template Name (text input)
- Destinations (chip/multi-input: Goa, Kerala, etc.)
- Duration:
  - Days (number)
  - Nights (number)
  - *This is informational; does not auto-create or delete day rows.*
- Description (textarea)
- Approximate Price (optional input)

**Status pill:**
- Draft / Published / Archived (color-coded chip).

**Buttons:**
- Save Draft
- Publish (enabled when valid, and not already Published)

**Optional info banner:**
- If `duration_days != #days_in_timeline`:
  > This template has 7 days but duration is set to 5. You can update duration or adjust days.

---

### 3.2 Middle Panel – Days Timeline

**Card: Days**
- Vertical stack of Day Cards.

**For each Day Card:**
- Left side: `DAY {n}` pill.
- Main text: Day title (e.g. Arrival & Check-in).
- Subtext: `{X activities}` or `No activities yet`.
- Visual selection state:
  - Highlighted background/border when selected.

**Interactions:**
- **Click** → select this day, load into right panel.
- **Drag handle** → reorder days up/down.
- **3-dot menu per day**:
  - Rename Day (inline edit or modal).
  - Duplicate Day (clone all activities to new day appended at bottom or next position).
  - Delete Day (with confirmation).

**At the bottom:**
- **+ Add Day** button:
  - Adds new day at the end with default title: `Day {n}`.
  - Does not remove any existing day.

---

### 3.3 Right Panel – Selected Day Activities

**Header:**
- Title: `Day {n} – [Title]`.
- Subtext: `{X activities planned}`.

**Activity list:**
- Vertical list of Activity Rows.

**Each Activity Row:**
- Drag handle on the left.
- Icon + category chip (Stay / Meal / Experience / Transfer).
- Title.
- Meta line: duration + location (e.g. `2 hours · Ubud, Bali`).
- Optional small badges for rating, group size.
- Action buttons/icons:
  - **Edit** (open Activity detail or inline panel).
  - **Remove** (from this day; does not delete global Activity library item).

**Interactions:**
- **Reorder**: drag rows up/down.
- On drop, reflect new order immediately and send reorder request to backend.
- **Add Activity**: button `+ Add Activity`:
  - Opens Activity Picker modal.
  - User can search + filter activities.
  - Select one or multiple; click Add to attach in batch.

**Empty state:**
- If no activities:
  > No activities added yet.
  > Button: `+ Add Activity`.

---

### 3.4 Responsive Behaviour (Tablet & Mobile)

- Switch from 3-column layout to stacked/tabs.

**Example:**
- Top: Template Details card.
- Next: Days list.
- Tap a day → navigate to a sub-view: Day Activities with a back button.

**Alternative: Tabbed navigation**
- Tabs: Details | Days | Activities.
- Under Days: list and manage days.
- Under Activities: show selected day's activities with a day selector at top.

**Drag-and-drop fallback on mobile:**
- If drag is hard on touch, add up/down arrow buttons to change order or long-press to drag.

---

## 4. Behaviour Summary

1. **Create itinerary from template page**
   - Templates list row action Create Itinerary → open itinerary creation with this template pre-picked.

2. **Template list UX**
   - Table/list view with search & status filters.
   - 3-dot row menu: View / Copy / Create Itinerary / Delete (Archive).

3. **Day / Duration link**
   - Duration fields are descriptive, not destructive.
   - Days are not auto-removed when duration decreases.

4. **Reordering**
   - Days: drag-and-drop in timeline.
   - Activities: drag-and-drop within a day.

5. **Responsive design**
   - Clear tri-pane layout on desktop.
   - Stacked or tabbed UX on smaller screens, with all core actions preserved.

---

*This spec should be enough to brief design + frontend + backend on the updated Template flow and UX.*
