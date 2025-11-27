# Travel SaaS – Activities, Templates, Itineraries & Shared Client View

End‑to‑end functional + UX spec for:
- Activities module (library + rich activity cards)
- Templates module (day-by-day reusable itineraries)
- Itinerary creation/editing (backoffice)
- Shared client itinerary page (public URL)
- Company profile (agency brand block)

Styling follows earlier global system (dark hero, soft cards, rounded corners, chips, etc.).

---

## 1. Activities Module

### 1.1 Epic – Activity Library

**Goal**  
Provide a reusable, searchable catalog of all “building blocks” (stays, meals, experiences, transfers, etc.) that can be plugged into templates and itineraries, with rich content (images, highlights, meta) that powers the client-facing itinerary cards.

**Why it matters**
- Avoid rewriting the same hotel/experience details for every itinerary.
- Keep visuals and wording consistent across the agency.
- Make natural-language search and filtering useful for creators.

---

### 1.2 User Stories (Activities)

**ACT-1 – Manage Activity Types**  
As an Admin, I want to define and manage activity types (Stay, Meal, Experience, Transfer, etc.) so that activities are categorized consistently and easy to filter/search.

**ACT-2 – Create & Edit Activities**  
As an Admin or Itinerary Creator (with permission), I want to create and edit activities with full details (description, images, location, pricing/meta, tags) so that these can be reused across multiple templates and itineraries.

**ACT-3 – Search & Filter Activities**  
As an Itinerary Creator, I want to search and filter activities in a simple way so that I can quickly find suitable options when building itineraries and templates.

**ACT-4 – Use Activities in Templates & Itineraries**  
As an Itinerary Creator, I want to pick activities from the library inside the Template Builder and Itinerary Editor so that I don’t have to recreate them manually in those screens.

---

### 1.3 Screens – Activities

#### A1. Activity Types

**Primary user:** Admin  
**Purpose:** Define the categories available when creating activities.

**Key sections**
- Header
  - Title: `Activity Types`
  - Button: `+ Add Type`
- Types table
  - Columns: Type Name, Description, (optional) Used Count, Actions (Edit/Delete)
- Empty state
  - Text: “No activity types yet.”
  - CTA: “Create your first type”.

**Main interactions**
- Add Type → small modal with Name (required) + Description (optional).  
- Edit Type → same modal pre-filled.  
- Delete Type → confirm dialog.

---

#### A2. Activities Library (List)

**Primary users:** Admin, Itinerary Creator  
**Purpose:** Show all reusable activities; allow search, filter, and quick access to details.

**Layout**
- Page header
  - Title: `Activities Library`
  - Subtitle: “Reusable stays, experiences and services for your itineraries.”
  - Right: `+ Add Activity` (primary button)

- Filters row
  - Search input – placeholder: “Search by name, location or keyword…”
  - Dropdown: Activity Type (All, Stay, Meal, Experience, Transfer…)
  - Dropdown/chips: Location/Region (optional)
  - Optional filter: Status (Active / Inactive / All)

- Content area – **card grid (recommended)**
  - Each card includes:
    - Top: Hero thumbnail (primary image) or placeholder
    - Middle:
      - Name (e.g., “Airport Arrival & Private Transfer”)
      - Type chip (Stay / Meal / Experience / Transfer)
      - Location text (e.g., “Ngurah Rai International Airport”)
    - Bottom:
      - Small line: e.g. “45 mins · Seminyak Beach” or “From ₹4,500 / night”
      - Muted text: “Last updated on …”
      - Link/button: “View details” / “Edit”

**States**
- Empty: illustration + “No activities yet” + `+ Add Activity` button.  
- No results: “No activities match your search” + `Clear filters`.

**Interactions**
- Typing search + changing filters updates list.  
- Clicking a card opens **Activity Detail**.  
- `+ Add Activity` → empty Activity Detail.

---

#### A3. Activity Detail / Edit (with rich UI)

**Primary users:** Admin, Itinerary Creator (if allowed)  
**Purpose:** Create or edit a reusable activity with all the information needed to render the rich client-facing card.

**Layout**

- Top bar
  - Left: Title – `New Activity` or the activity name.  
  - Right:
    - Toggle: `Active / Inactive`  
    - Buttons: `Cancel` (secondary), `Save` (primary)

- Sections

1. **Basic Information**
   - Activity Name (required) – “Airport Arrival & Private Transfer”.
   - Activity Type (dropdown) – Stay / Meal / Experience / Transfer / Other.
   - Category label (chip text) – e.g., `transfer`, `relaxation`, `dining` (short word shown as chip in cards).
   - Location display – free-text line used in client UI: “Ngurah Rai International Airport”, “Seminyak Beach”.

2. **Descriptions**
   - Short description (1–3 lines) – for lists/teasers.
   - Client-facing description (long text) – full paragraph shown under images on shared itinerary.

3. **Media – Multi-image Gallery**
   - Upload area:
     - Drag & drop or `Upload images` button.  
     - Helper text: “JPEG/PNG, up to 6 images.”
   - Hero image:
     - One image displayed larger as **Primary**.
     - Any thumbnail can be set as primary (`Set as hero`).
   - Gallery thumbnails:
     - Row/grid of thumbnails under/next to hero.  
     - Drag to reorder; `X` to remove.  
   - If no images uploaded, show simple placeholder.

4. **Timing & Duration**
   - Default duration: numeric + unit dropdown (`45` `minutes`, `2` `hours`).
   - This is used as a default when added to days; specific start time lives on the itinerary-day instance.

5. **Experience Meta Row**
   - Rating (optional) – numeric (0–5, step 0.1).  
   - Group size label – dropdown: `Private`, `Shared`, `Max 10 people`, etc.  
   - Cost display:
     - Radio: `Included in package` / `Extra cost`  
     - If Extra: small text input: “From $120 per person”.

6. **Highlights (Chips)**
   - Multi-chip input: type + Enter to create chips (e.g., `Meet & Greet`, `Welcome Drink`, `WiFi Available`).
   - Chips can be reordered (drag) and removed (`x`).

7. **Tags & Metadata (optional)**
   - Tags input – e.g., `Family-friendly`, `Airport`, `Luxury`.
   - Optional fields: Duration in hours, min/max group size, internal notes (not shown to client).

8. **Optional Live Preview (nice-to-have)**
   - Right-side or bottom preview card: renders how this activity will look inside the shared itinerary day card (hero + thumbnails, chip, title line, duration/location, meta row, highlight chips).

**States & interactions**
- Create mode: empty form; Save disabled until Name + Type + Location at minimum.  
- Edit mode: pre-filled; Inactive shows small banner.  
- Save → validate, then back to Activities Library + toast “Activity saved”.  
- Cancel → back to Activities Library (confirm unsaved changes).  
- Optional delete action with confirm dialog (or rely on Inactive instead).

---

## 2. Templates Module

### 2.1 Epic – Itinerary Templates

**Goal**  
Allow agencies to pre-build their best itineraries as reusable templates with day-by-day structure, so creators can start from a solid base rather than from scratch.

**Why it matters**
- Saves time for common routes (Kerala, Bali, etc.).
- Enforces consistency and quality.
- Lets senior planners design flows while allowing per-client tweaks later.

---

### 2.2 User Stories (Templates)

**TPL-1 – Create Basic Template**  
Create a new template with name, destination(s), duration, description; save as Draft.

**TPL-2 – Add & Manage Days**  
Add, rename, duplicate and reorder days in a template, with optional per-day description.

**TPL-3 – Attach Activities to Days**  
Attach activities from the library to specific days, reorder them within days.

**TPL-4 – Manage Template Lifecycle**  
Mark templates as Draft or Published; only Published show by default when creating itineraries.

**TPL-5 – Use Template to Start Itinerary**  
Start a new itinerary from a chosen template, copying days + activities into an editable itinerary.

---

### 2.3 Screens – Templates

#### T1. Template List

**Primary users:** Admin, Itinerary Creator  
**Purpose:** Browse and manage templates; quickly create itineraries from them.

**Layout**
- Header: Title `Templates`, subtitle, `+ Create Template` button.  
- Grid of template cards (2–3 per row):
  - Name – “Kerala 4N/5D – Premium”.
  - Destinations – “Kochi, Munnar, Alleppey”.
  - Duration – “4 Nights, 5 Days”.
  - Status chip – Draft (grey), Published (green).
  - Meta – “Last updated…”, “Used in 12 itineraries”.
  - Footer buttons – `Edit Template`, `Use Template`.

**States & interactions**
- Empty state with CTA to create first template.  
- Optional search/filter (by name, destination, status).  
- `+ Create Template` → Template Builder (create).  
- `Edit Template` → Template Builder (edit).  
- `Use Template` → Itinerary creation flow pre-selected with this template.

---

#### T2. Template Builder / Editor (Days + Activities)

**Primary users:** Admin, senior Template Creators  
**Purpose:** Define day-by-day structure and attached activities.

**Overall layout – three columns**
1. **Left panel – Template meta**
   - Template name, destinations, duration (or auto from days), short description, approximate price range.
   - Status chip (Draft / Published).  
   - Buttons: `Save Draft`, `Publish`.

2. **Middle panel – Days timeline**
   - Title: `Days`.
   - Vertical list of days:
     - Day number pill + day title (“Day 1 – Arrival in Kochi”).
     - Hover actions:
       - Drag handle (reorder days).
       - Overflow menu: Rename, Duplicate, Delete.
   - Bottom: `+ Add Day` button.
   - Active day highlighted (primary border, soft background).

3. **Right panel – Selected day content**
   - Header: `Day 3 – Munnar Sightseeing` + small description (“Tea gardens, waterfalls and viewpoints”).
   - Badge: `3 activities planned`.
   - List of activity cards for this day:
     - Type icon (bed/plate/compass/car).
     - Activity name.
     - Small line: duration + location (“1 hour · Seminyak Beach”).
     - Drag handle (reorder within day).  
     - Edit (for per-template note/override) & Delete icons.
   - Empty state: message + `+ Add Activity` button.

**Add Activity flow**
- `+ Add Activity` opens Activity Picker (modal/drawer):
  - Search + filters as in Activities Library.
  - Cards with name, type, location, price, small thumbnail.  
  - `Add` button per activity; can select multiple before confirming.  
- On confirm, selected activities appear as cards for the day, in chosen order.

**Nice-to-have UI polish**
- Summary chip: `5 days, 2 stays, 6 experiences, 4 meals` somewhere on screen.  
- Smooth drag animations when reordering days/activities.  
- Toasts: “Template saved”, “Template published…”.

---

## 3. Itinerary Creation & Editing (Backoffice)

### 3.1 Epic – Client Itineraries (Internal)

**Goal**  
Allow creators to generate a client-specific itinerary from templates, capture client details & dates, adjust day-by-day content, and manage all itineraries for the agency.

---

### 3.2 User Stories (Itinerary – Internal)

**IT-1 – Create Itinerary From Template**  
Start a new itinerary by choosing a template; copy its days and activities.

**IT-2 – Capture Client & Trip Info**  
Enter client name, contact details, travel dates, and travellers count; compute duration.

**IT-3 – Edit Itinerary Day-by-Day**  
Reorder days, replace activities, change times and descriptions, with a clear view similar to templates but tied to real dates.

**IT-4 – Manage Itineraries List**  
View all itineraries, filter by status/destination/date, open for editing, see high-level stats.

**IT-5 – Internal Preview & Share**  
Preview the itinerary as the client will see it, and open the Share/Export controls.

---

### 3.3 Screens – Itinerary (Internal)

#### I1. Itinerary List

**Purpose:** Overview & navigation.

- Header: `Itineraries` + `Create New Itinerary` button.
- Filters: search (client/trip), status (Draft, Sent, Confirmed), destination, date range.
- Table: Client name, Trip name, Destination, Dates, Status, Last updated, Actions.
- Row click → Itinerary Editor; `Create New Itinerary` → creation wizard.

---

#### I2. Create Itinerary – Step 1: Select Template

- Step indicator: `1. Select Template → 2. Client & Dates`.
- Template cards (same style as Template List, only Published by default).
- Options: `Use Template` (required for v1; “start from scratch” can be a later feature).
- Next → Client & Dates.

---

#### I3. Create Itinerary – Step 2: Client & Dates

- Fields:
  - Client name, email, phone.  
  - Trip name (optional, else auto from template name).  
  - Destination (pre-filled from template, editable).  
  - Start date + End date (or start date + nights).  
  - Number of travellers (adults / children).
- Summary line: “7 days / 6 nights · 2 guests”.
- Buttons: `Back`, `Create Itinerary`.
- On success: create itinerary + days based on dates; open **Itinerary Editor**.

---

#### I4. Itinerary Editor (Internal)

**Purpose:** Edit the concrete itinerary before sending.

**Layout (similar to Template Builder, but date-aware)**

- Top bar
  - Trip name, client name.  
  - Destination, dates, travellers badge.  
  - Status chip (Draft / Sent / Confirmed).  
  - Buttons: `Preview`, `Share & Export`.

- Left/middle: Day list with real dates
  - Rows: `Day 1 – Sun, Dec 15 · Arrival & Welcome to Paradise` (3 activities planned).  
  - Selecting a day shows its details on the right.

- Right: Selected day timeline editor
  - Same card layout as Template day content, but now with **time selectors** for each activity:
    - Time picker next to each card (“14:00”, “15:30”, “19:00”).
  - Can add/remove/reorder activities (using Activity Picker).  
  - Can edit per-itinerary notes/overrides if needed.

- Auto-save or explicit `Save` button to persist changes.

---

#### I5. Internal Preview Screen

- Read-only render using the **same layout** as the public shared itinerary (hero, overview, days list, day cards).  
- Label at top: `Internal Preview`.  
- Buttons: `Back to Editing`, `Share & Export`.

---

## 4. Shared Client Itinerary Page (Public URL)

Based closely on the screenshots you provided.

### 4.1 Epic – Client Itinerary Experience

**Goal**  
Provide clients with a beautiful, mobile-friendly itinerary page summarizing their trip, day-by-day activities, pricing, and agency contact/payment details.

---

### 4.2 User Stories (Client – Shared View)

**CI-1 – View Trip Summary**  
As a Client, I want to see a friendly summary of my trip (destination, dates, duration, travellers) so I instantly understand what this page is about.

**CI-2 – See Trip Overview Stats**  
As a Client, I want to see how many accommodations, activities, meals, and transfers are included so I feel the trip is well-organized and worth the price.

**CI-3 – Browse Day-by-Day Plan**  
As a Client, I want to scroll a clean list of days (Day 1, Day 2…) with titles and activity counts so I can quickly understand the flow of the trip.

**CI-4 – Inspect Detailed Day View**  
As a Client, I want to expand each day to see a timeline of activities with times, images, descriptions, and highlights so I know exactly what will happen.

**CI-5 – See Price Summary & Pay**  
As a Client, I want a clear price breakdown and an easy payment CTA (e.g., QR code) so I can confirm the booking securely.

**CI-6 – Contact the Agency Easily**  
As a Client, I want clear agency contact information near the price so I can ask questions or request changes.

---

### 4.3 Screen – Shared Itinerary Page

**Access:** Public URL, no login required (read-only).

#### Section 1 – Hero “Welcome” Block

- Dark gradient card, centered.
- Elements:
  - Small text: `WELCOME ABOARD`.
  - Big greeting: `Hello, Sarah Mitchell`.
  - Subline: `Your journey to Bali, Indonesia awaits. Here’s everything you need for an unforgettable adventure.`
  - Stat chips row:
    - `Duration – 7 Days / 6 Nights`.
    - `Destination – Bali, Indonesia`.
    - `Travellers – 2 Guests`.
    - `Travel Dates – Dec 15, 2024 – Dec 21, 2024`.
  - Optional icon on the right (plane).

**Data source:** Itinerary (client_name, destination_main, start/end dates, travellers, computed duration).

---

#### Section 2 – Trip Overview Cards

Row of white cards under the hero, e.g.:

- `3` – `Accommodations`
- `12` – `Activities`
- `18` – `Meals Included`
- `6` – `Transfers`

**Data source:** count ItineraryDayActivities grouped by Activity Type.

---

#### Section 3 – Day List (“Your Itinerary”)

- Heading: `YOUR ITINERARY`.
- For each ItineraryDay:
  - Card row with:
    - Left: `DAY 1` pill.  
    - Text: date + title (“Sunday, December 15 – Arrival & Welcome to Paradise”).
    - Subtext: `3 activities planned`.
    - Right: round thumbnails of some activities’ images (+ `+1` bubble if more).
    - Chevron to expand/collapse.

Clicking row expands Day Detail below (accordion style).

---

#### Section 4 – Day Detail Timeline (Expanded Day)

When a day is expanded:

- Top sub-hero bar for the day:
  - `DAY 1` badge + date + title.
  - Line: `3 activities planned`.
  - Optional small circle image stack on the right.

- Under that, vertical timeline:
  - Left column: time markers (`14:00`, `15:30`, `19:00`).
  - Right column: activity cards stacked vertically.

**Activity card structure** (uses Activity master + itinerary overrides):

- Small top chip: category (`transfer`, `relaxation`, `dining`) – colored.
- Title: e.g., `Airport Arrival & Private Transfer`.
- Meta line under title:
  - Duration (“45 mins”).
  - Location (“Ngurah Rai International Airport”).
- Image row:
  - Big hero image on the left.  
  - 2–3 smaller images stacked on the right.
- Long description paragraph.
- Meta strip:
  - Rating (e.g., ⭐ 4.9 Rating).  
  - Group size (e.g., `Private`).  
  - Cost (e.g., `$ Included`).
- Highlights chip row:
  - `Meet & Greet`, `Welcome Drink`, `WiFi Available`.

All content is read-only for the client.

---

#### Section 5 – Company Info & Price Summary

Side-by-side or stacked (depending on screen size) dark cards.

**Company card**
- Agency logo.
- Company name – e.g., `Wanderlust Travels`.
- Small tagline – `Your Travel Partner`.
- Short description (1–3 lines).
- Contact details list:
  - Email
  - Phone
  - Website URL

**Price Summary card**
- Title: `Price Summary`.
- Lines:
  - Base Package – `$4,850`.
  - Taxes & Fees – `$450`.
  - Total – `$5,300` (highlighted).
- Discount code input (optional): field + `Apply` button.

**Payment area**
- Heading: `Ready to Confirm?`.
- Text: “Scan the QR code to complete your payment securely. Your booking will be confirmed instantly.”
- QR code image.
- Small text: “Secure payment powered by Stripe” (or similar).

**Data sources:**
- Company card: CompanyProfile entity (per agency).
- Price summary amounts: ItineraryPricing entity (base package, taxes/fees, total).
- Payment QR / bank details: CompanyProfile entity (configured once per agency, reused across all itineraries).

---

## 5. Company Profile (New Entity & Screens)

### 5.1 Epic – Agency Brand & Contact

**Goal**  
Allow each travel agency (tenant) to configure their brand (logo, name, description) and contact/payment info once, so it appears consistently on all shared itineraries.

---

### 5.2 User Stories (Company)

**CP-1 – Maintain Company Profile**  
As an Agency Admin, I want to set our company name, logo, tagline, description, and contact details so that clients always see accurate information.

**CP-2 – Control What Appears on Shared Pages**  
As an Agency Admin, I want to choose which fields appear on the shared itinerary (phone, email, website, WhatsApp) so the page matches how we prefer to be contacted.

**CP-3 – Multi-tenant Isolation**  
As the System, I must ensure each agency only sees and edits its own profile and that client pages only show their agency information.

---

### 5.3 Screens – Company Profile

#### C1. Company Profile (Settings)

**Primary user:** Agency Admin  
**Purpose:** Configure brand & contact details once per tenant.

**Layout**
- Header: `Company Profile`.
- Sections:

1. **Branding**
   - Company logo upload (circle/square preview).  
   - Company name.  
   - Tagline (“Your Travel Partner”).

2. **About**
   - Short description (2–4 lines) shown on shared page.

3. **Contact Details**
   - Email address.
   - Phone number.
   - Website URL.  
   - Optional: WhatsApp number.

4. **Shared Page Options (optional)**
   - Toggles: show/hide phone, email, website on shared itinerary.

5. **Payment Info (display-only)**
   - Upload field for default payment QR code image (UPI/Stripe/etc.).
   - Optional bank transfer details fields (e.g., Account name, Bank name, Account number/IBAN, IFSC/SWIFT, reference note).
   - Text field for payment note (e.g., “Secure payment powered by Stripe” or UPI/bank instructions).
   - These settings are defined once per agency and are reused on all shared itineraries (no configuration needed while creating an itinerary).

