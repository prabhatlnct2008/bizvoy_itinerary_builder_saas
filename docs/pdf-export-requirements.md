# Module: PDF Export – Client Itinerary

**Owner:** Bizvoy Itinerary Builder
**Scope:** Generate a professional, print-ready PDF that mirrors the shared itinerary page design.

---

## 1. Problem & Goal

### Problem

Agents need a shareable, printable version of the itinerary that:
- Looks as polished as the web shared itinerary
- Can be emailed / printed / WhatsApp'd as a single file
- Keeps branding + pricing + QR consistent across channels

### Goal / Definition of Done
- From an itinerary, agent clicks "Export PDF" → gets a multi-page A4 PDF.
- PDF visually matches the client shared itinerary design:
  - Dark hero, trip stats, day cards, activity cards, price summary, company card, QR.
- Handles 1–14+ days gracefully (no broken cards, sensible page breaks).
- Looks good in print and on screen.

---

## 2. Users & Flows

### Primary User
- Travel agency staff creating and sharing itineraries with clients.

### Main Flow
1. Agent opens an itinerary in Itinerary Editor.
2. Clicks "Share & Export" → "Generate PDF".
3. Backend:
   - Fetches the same data used for the public/shared itinerary view.
   - Renders HTML using the layout below.
   - Converts HTML → A4 PDF via renderer.
4. Agent can:
   - Download PDF directly, or
   - Access a stored PDF URL (if you choose to persist files).

---

## 3. Technical Envelope (High-Level)

- **Format:** A4, portrait (primary).
- **Renderer:** HTML → PDF (headless Chrome / wkhtmltopdf / WeasyPrint – implementation detail).
- **Margins:**
  - Top / bottom: 20–24 mm
  - Left / right: 18–20 mm
- **Images:**
  - Effective 150–300 DPI, compressed.
  - Rounded corners consistent with web UI.
- **Fonts:**
  - Primary: Inter / System UI (or Helvetica / Arial fallback).
  - Embed fonts if supported so the PDF looks consistent for all users.

Implementation is HTML-first:
- Build a dedicated PDF HTML template that mirrors the public itinerary visual style.
- CSS uses print-friendly rules + page-break-* control.

---

## 4. Data Inputs

Use the same shape as PublicItineraryResponse plus CompanyProfile.

### Trip-Level Data
- `trip_name`
- `client_name`
- `destination`
- `start_date`, `end_date`
- `total_days`, `total_nights`
- `travellers_count`
- `stats`:
  - `accommodations_count`
  - `activities_count`
  - `meals_count`
  - `transfers_count`
- Optional: `hero_image_url`

### Company Profile
- `company_name`
- `tagline`
- `description`
- `logo_url` (optional)
- `email`, `phone`, `website`
- `office_location` (optional)
- `payment_qr_url` (optional)
- `payment_note` / `bank_details` (free text block)

### Pricing
- `base_package_price`
- `taxes_and_fees`
- `discount_code` (optional)
- `discount_amount` (optional)
- `total_price`
- `currency`

### Itinerary Structure

**For each day:**
- `day_number`
- `date`
- `title`
- `subtitle` / `summary`
- `activities_count`
- Optional: 1–4 `thumbnail_urls` for overview.

**For each activity:**
- `time` (HH:MM or free text like "Morning")
- `title`
- `category_label` (sightseeing, dining, stay, transfer, etc.)
- `duration_text` (e.g. 2 hours)
- `location_text` (e.g. Tegallalang, Ubud)
- `description` (client-facing)
- Images:
  - `hero_image_url`
  - `extra_images` [0–3]
- Metrics:
  - `rating`
  - `group_size_text`
  - `cost_label` (e.g. Included, ₹10,000 pp)
- `highlights` (tags list)

---

## 5. Page Architecture & Layout

### 5.1 Page 1 – Hero & Trip Overview

#### Hero Block (top ~60% of page)
- Full-width dark gradient card with large rounded corners.
- Small label at top-left:
  - `WELCOME ABOARD` (all caps, letter-spaced, amber accent).
- Main heading:
  - `Hello, {client_name}` – large, bold.
- Subheading:
  - `Your journey to {destination} awaits. Here's everything you need for an unforgettable adventure.`

#### Stats Row Inside Hero

Four small stat cards in a row:
1. **Duration** – 7 Days / 6 Nights
2. **Destination** – Bali, Indonesia
3. **Travellers** – 2 Guests
4. **Travel Dates** – Dec 15, 2024 – Dec 21, 2024

Each stat card:
- Slightly lighter dark background (rgba(15,23,42,0.6)).
- Rounded corners (same radius as web cards).
- Icon (optional) + label + value.

#### Trip Overview Cards (below hero)

Section label: `TRIP OVERVIEW` (small uppercase).

Row of 4 white cards:
- Accommodations
- Activities
- Meals Included
- Transfers

Each card:
- White background, rounded-2xl.
- Subtle grey border, minimal or no shadow (print friendly).
- Icon + big number + label.

#### Optional Mini Day List

If space allows on Page 1, add at bottom:
- Simple list:
  - Day 1 – Arrival & Welcome to Goa
  - Day 2 – Beaches & Sunsets
  - etc.

If not enough room, start daily pages from Page 2.

---

### 5.2 Pages 2+ – Daily Itinerary

Each day uses a consistent pattern similar to the web shared view.

#### Day Header
- **Left block:**
  - Day pill: rounded square/rectangle with `DAY {n}`.
  - Background amber; text dark.
- To the right of pill:
  - Date line: `Monday, December 16`.
  - Day title: `Ubud Cultural Immersion` (bold).
  - Subtitle: `{activities_count} activities planned` (muted text).
- Optional (space permitting): 3–4 small circular thumbnails for the day's activities on the right side.

#### Timeline Rail
A visual spine on the left side of activities:
- Vertical light-grey line running next to the activity cards.
- Each activity has a time circle anchored to this line:
  - Circle: light grey fill, small, with time inside (08:00).

#### Activity Card Layout (Core Pattern)
Each activity renders as a stacked card.

**Card container**
- White background.
- Rounded-2xl corners.
- Thin grey border.
- Vertical spacing between cards.

**1. Top Meta Row**
- Category chip (small pill):
  - E.g. Sightseeing, Dining, Stay.
  - Soft, category-specific color fill.
- Activity title – bold.
- Meta line: `2 hours · Tegallalang, Ubud` (muted text).

**2. Image Strip**
- Left: 1 large hero image (~2/3 card width).
- Right: 2–3 smaller images stacked vertically (~1/3 width).
- All images have rounded corners and a 3–4 mm gap.
- If only 1 image is available → use full card width.

**3. Description**
- Long description paragraph below images.
- Aim for 3–5 lines, but allow longer if necessary.

**4. Metrics Row**

Row of 3 equal columns:
- **Rating** – star icon + value
- **Group Size** – 2–8 or similar
- **Cost** – Included or ₹10,000 pp

Each metric:
- Label: small, muted text.
- Value: darker, semi-bold.

**5. Highlights / Tags**
- Row of pill chips at bottom of card:
  - E.g. `Photo Opportunities`, `Local Guide`, `Coffee Tasting`.
- Style:
  - Bordered pills with very light fill (e.g. soft amber or grey) to stay printer-friendly.

#### Page Break Rules
- Never split an activity card across pages.
- Use `break-inside: avoid` or equivalent.
- Allowed page breaks:
  - Between activities.
  - Between days.
- If a day continues on the next page:
  - Repeat Day header at top with small `(continued)` label in muted text.

---

### 5.3 Final Page – Price Summary & Company Info

This page mirrors the dark bottom section of the shared itinerary.

#### Layout
- Large dark gradient card occupying most of the page, with generous padding and rounded corners.
- Inside: two main columns (stacked on very narrow print if needed):
  1. **Company Info** (left)
  2. **Price Summary + Payment** (right)

#### Company Info Block (Left)
- Optional logo at top (square or circular).
- Company name: big, white text.
- Tagline: smaller, in accent amber.
- Short description: 2–3 lines in lighter grey.
- Contact details list:
  - Email
  - Phone
  - Website
  - Optional address
- Payment details (if provided):
  - Subheading: `Payment Details` (small caps).
  - White or very light inner box for:
    - Account name
    - Bank name
    - Account number / IFSC / SWIFT
    - Reference note

#### Price Summary Block (Right)
- Title: `Price Summary` (white text).
- Inner card (slightly lighter dark background):
  - Row: Base Package – amount.
  - Row: Taxes & Fees – amount.
  - Divider line.
  - Row: Total – highlighted (larger font, amber text or accent).
- Discount UI (visual only, no functionality in PDF):
  - Light rectangular input-like box with label: `Have a discount code?`.

#### Payment Confirmation & QR
- Heading: `Ready to Confirm?` (white text).
- Short reassuring text, e.g.:
  - `Scan the QR code to complete your payment securely. Your booking will be confirmed instantly.`
- QR code image:
  - White background, black code, thin border, rounded corners.
- Text below QR:
  - `Scan to Pay {currency}{total_price}` (amber accent).

---

## 6. Visual System & Tokens

Use the same design language as the web shared itinerary.

### Color Tokens (Examples)
- **Dark background gradient:** `#020617` → `#0B1220`
- **Accent amber:** `#FBBF24` / `#F59E0B`
- **Text colors:**
  - Primary: `#0F172A`
  - Muted: `#6B7280`
  - On dark: `#E5E7EB`
- **Cards:** `#FFFFFF`
- **Borders:** `#E5E7EB`
- **Tag chips:** soft backgrounds like `#FFFBEB` with amber border.

### Typography
- Cover hero title: 26–30 pt.
- Section headings (e.g. "TRIP OVERVIEW", day titles): 14–18 pt.
- Body text: 10–11 pt.
- Meta / label text: 8–9 pt.
- Line height: ~1.3–1.4 for body text.

Maintain a clear hierarchy similar to the web design.

---

## 7. Backend Interface (High-Level)

### Endpoint

```
POST /itineraries/{id}/export-pdf
```

### Request
- **Path param:** `id` – itinerary ID.
- **Body (optional for future):**
  - `format`: e.g. "A4"
  - `include_pricing`: bool (default true)

### Processing Flow
1. Load itinerary via existing services to produce `PublicItineraryResponse`.
2. Load `CompanyProfile` for the agency.
3. Populate a dedicated PDF HTML template using this spec.
4. Invoke HTML → PDF renderer with A4, margins, print CSS.
5. Return one of:
   - Raw PDF (`application/pdf`) for immediate download, or
   - JSON: `{ pdf_url, generated_at }` if you store the PDF and serve from object storage.

---

## 8. Behaviour & Edge Cases

- **Missing images**
  - Show grey rectangle placeholders with text: `Image coming soon`.
- **No pricing data**
  - Hide Price Summary and Payment sections.
  - Show a neutral info box: `Pricing to be confirmed`.
- **Very long titles / names**
  - Allow wrapping to maximum 2 lines; truncate with ellipsis if needed.
- **Short trips (1–2 days)**
  - If layout allows, Page 1 can include hero + overview + first day.
  - Do not shrink images or text below readable sizes just to fit.
- **Long trips (10–14+ days)**
  - Many day pages; ensure page breaks are clean.
  - Do not compromise card readability; allow more pages instead.

---

## 9. Acceptance Criteria

1. From Itinerary Editor, user can click Export PDF and receive a PDF.
2. PDF includes:
   - Hero, trip stats, overview cards.
   - All days with activities in a timeline/card layout.
   - Final page with company info + price summary (+ QR if available).
3. No activity card is ever split across pages.
4. Visual style (colors, typography hierarchy, shape language) is clearly aligned with the shared itinerary page.
5. PDF prints cleanly on A4 without clipping important content.
