# Implementation Plan: Activities, Templates, Itineraries & Shared View

## 1. System Overview

This plan covers the implementation of the core business logic for the Travel SaaS platform:

- **Activities Module**: Reusable library of stays, meals, experiences, and transfers with rich multi-image cards
- **Templates Module**: Pre-built day-by-day itineraries that can be reused across clients
- **Itineraries Module**: Client-specific trips created from templates with real dates and customizations
- **Shared Client View**: Beautiful public-facing itinerary page with company branding and payment
- **Company Profile**: Agency branding, contact info, and payment configuration

All modules maintain strict multi-tenant isolation (agency-scoped) and integrate with the existing RBAC system.

---

## 2. Architecture Specification

### 2.1 Database Models (SQLAlchemy)

#### **ActivityType** (Simple lookup table)
```python
- id: UUID (PK)
- agency_id: UUID (FK → agencies.id)
- name: String(50) (e.g., "Stay", "Meal", "Experience", "Transfer")
- description: Text (optional)
- icon: String(50) (optional, e.g., "bed", "utensils", "compass", "car")
- created_at: DateTime
- updated_at: DateTime
- UNIQUE(agency_id, name)
```

#### **Activity** (Rich reusable building block)
```python
- id: UUID (PK)
- agency_id: UUID (FK → agencies.id)
- activity_type_id: UUID (FK → activity_types.id)
- name: String(200) (e.g., "Airport Arrival & Private Transfer")
- category_label: String(50) (chip text: "transfer", "relaxation", "dining")
- location_display: String(200) (e.g., "Ngurah Rai International Airport")
- short_description: Text (1-3 lines, for lists)
- client_description: Text (full paragraph for shared view)
- default_duration_value: Integer (e.g., 45)
- default_duration_unit: Enum("minutes", "hours", "days")
- rating: Decimal(2,1) (0-5, nullable)
- group_size_label: String(50) ("Private", "Shared", "Max 10 people")
- cost_type: Enum("included", "extra")
- cost_display: String(100) (e.g., "From $120 per person")
- highlights: JSON (array of strings: ["Meet & Greet", "Welcome Drink"])
- tags: JSON (array of strings: ["Family-friendly", "Luxury"])
- is_active: Boolean (default True)
- internal_notes: Text (not shown to client)
- created_at: DateTime
- updated_at: DateTime
- created_by_id: UUID (FK → users.id)

Relationships:
- activity_type: ActivityType
- images: List[ActivityImage] (one-to-many)
```

#### **ActivityImage** (Multi-image gallery)
```python
- id: UUID (PK)
- activity_id: UUID (FK → activities.id, cascade delete)
- file_path: String(500) (relative path: uploads/{agency_id}/activities/{activity_id}/{filename})
- file_url: String(500) (computed: /uploads/{agency_id}/activities/...)
- display_order: Integer (for sorting, 0-based)
- is_hero: Boolean (one image per activity should be True)
- uploaded_at: DateTime

UNIQUE(activity_id, display_order)
```

#### **Template** (Reusable itinerary blueprint)
```python
- id: UUID (PK)
- agency_id: UUID (FK → agencies.id)
- name: String(200) (e.g., "Kerala 4N/5D – Premium")
- destinations: String(500) (comma-separated: "Kochi, Munnar, Alleppey")
- duration_nights: Integer
- duration_days: Integer (auto-computed or manual)
- description: Text
- approximate_price: Decimal(10,2) (nullable, just for display)
- status: Enum("draft", "published")
- created_at: DateTime
- updated_at: DateTime
- created_by_id: UUID (FK → users.id)

Relationships:
- days: List[TemplateDay] (one-to-many, ordered)
```

#### **TemplateDay** (Day structure within template)
```python
- id: UUID (PK)
- template_id: UUID (FK → templates.id, cascade delete)
- day_number: Integer (1, 2, 3...)
- title: String(200) (e.g., "Arrival & Welcome to Paradise")
- description: Text (optional, day-specific notes)
- created_at: DateTime
- updated_at: DateTime

Relationships:
- activities: List[TemplateDayActivity] (many-to-many via junction)

UNIQUE(template_id, day_number)
```

#### **TemplateDayActivity** (M2M junction with ordering)
```python
- id: UUID (PK)
- template_day_id: UUID (FK → template_days.id, cascade delete)
- activity_id: UUID (FK → activities.id, restrict)
- display_order: Integer (within the day)
- template_notes: Text (optional override for this template)
- created_at: DateTime

UNIQUE(template_day_id, display_order)
```

#### **Itinerary** (Client-specific trip)
```python
- id: UUID (PK)
- agency_id: UUID (FK → agencies.id)
- template_id: UUID (FK → templates.id, nullable, soft reference)
- trip_name: String(200)
- client_name: String(200)
- client_email: String(200)
- client_phone: String(50)
- destination_main: String(200) (e.g., "Bali, Indonesia")
- start_date: Date
- end_date: Date
- travellers_adults: Integer
- travellers_children: Integer (default 0)
- status: Enum("draft", "sent", "confirmed", "cancelled")
- internal_notes: Text
- created_at: DateTime
- updated_at: DateTime
- created_by_id: UUID (FK → users.id)

Relationships:
- days: List[ItineraryDay] (one-to-many, ordered)
- pricing: ItineraryPricing (one-to-one, nullable)
- share_link: ShareLink (one-to-one, nullable)

Computed properties:
- duration_nights: (end_date - start_date).days
- duration_days: duration_nights + 1
- total_travellers: travellers_adults + travellers_children
```

#### **ItineraryDay** (Concrete day with real date)
```python
- id: UUID (PK)
- itinerary_id: UUID (FK → itineraries.id, cascade delete)
- day_number: Integer (1, 2, 3...)
- date: Date (actual calendar date)
- title: String(200) (e.g., "Arrival & Welcome to Paradise")
- description: Text (optional)
- created_at: DateTime
- updated_at: DateTime

Relationships:
- activities: List[ItineraryDayActivity] (many-to-many via junction)

UNIQUE(itinerary_id, day_number)
UNIQUE(itinerary_id, date)
```

#### **ItineraryDayActivity** (M2M junction with time & overrides)
```python
- id: UUID (PK)
- itinerary_day_id: UUID (FK → itinerary_days.id, cascade delete)
- activity_id: UUID (FK → activities.id, restrict)
- display_order: Integer (within the day)
- scheduled_time: Time (e.g., "14:00", nullable)
- itinerary_notes: Text (client-specific override notes)
- created_at: DateTime

UNIQUE(itinerary_day_id, display_order)
```

#### **CompanyProfile** (Agency branding & payment)
```python
- id: UUID (PK)
- agency_id: UUID (FK → agencies.id, unique)
- company_name: String(200)
- tagline: String(200) (e.g., "Your Travel Partner")
- description: Text (2-4 lines for shared page)
- logo_path: String(500) (nullable)
- logo_url: String(500) (computed)
- email: String(200)
- phone: String(50)
- website_url: String(300) (nullable)
- whatsapp_number: String(50) (nullable)
- show_phone: Boolean (default True)
- show_email: Boolean (default True)
- show_website: Boolean (default True)
- payment_qr_path: String(500) (nullable, for UPI/Stripe QR)
- payment_qr_url: String(500) (computed)
- payment_note: Text (e.g., "Secure payment powered by Stripe")
- bank_account_name: String(200) (nullable)
- bank_name: String(200) (nullable)
- bank_account_number: String(100) (nullable)
- bank_ifsc_swift: String(50) (nullable)
- bank_reference_note: Text (nullable)
- created_at: DateTime
- updated_at: DateTime

UNIQUE(agency_id)
```

#### **ItineraryPricing** (Price breakdown)
```python
- id: UUID (PK)
- itinerary_id: UUID (FK → itineraries.id, unique, cascade delete)
- base_package: Decimal(10,2)
- taxes_fees: Decimal(10,2)
- discount_code: String(50) (nullable)
- discount_amount: Decimal(10,2) (nullable)
- total: Decimal(10,2) (computed or stored)
- currency: String(10) (default "USD")
- created_at: DateTime
- updated_at: DateTime

UNIQUE(itinerary_id)
```

#### **ShareLink** (Public itinerary URL)
```python
- id: UUID (PK)
- itinerary_id: UUID (FK → itineraries.id, unique, cascade delete)
- token: String(64) (unique, random URL-safe token)
- is_active: Boolean (default True)
- live_updates_enabled: Boolean (default False)
- expires_at: DateTime (nullable)
- view_count: Integer (default 0)
- last_viewed_at: DateTime (nullable)
- created_at: DateTime
- updated_at: DateTime

UNIQUE(itinerary_id)
UNIQUE(token)
Index on token for fast lookup
```

---

### 2.2 API Contract (FastAPI)

All endpoints are prefixed with `/api/v1` and require authentication except Public endpoints.

#### Activity Types Endpoints

| Method | Endpoint | Request Schema | Response Schema | Permission | Description |
|--------|----------|----------------|-----------------|------------|-------------|
| GET | `/activity-types` | - | `List[ActivityTypeResponse]` | activities.view | List all types |
| POST | `/activity-types` | `ActivityTypeCreate` | `ActivityTypeResponse` | activities.create | Create type |
| PUT | `/activity-types/{id}` | `ActivityTypeUpdate` | `ActivityTypeResponse` | activities.edit | Update type |
| DELETE | `/activity-types/{id}` | - | `SuccessResponse` | activities.delete | Delete type |

#### Activities Endpoints

| Method | Endpoint | Request Schema | Response Schema | Permission | Description |
|--------|----------|----------------|-----------------|------------|-------------|
| GET | `/activities` | Query: type_id, location, is_active, search | `PaginatedResponse[ActivityListItem]` | activities.view | List/filter activities |
| POST | `/activities` | `ActivityCreate` | `ActivityResponse` | activities.create | Create activity |
| GET | `/activities/{id}` | - | `ActivityDetailResponse` | activities.view | Get full details |
| PUT | `/activities/{id}` | `ActivityUpdate` | `ActivityResponse` | activities.edit | Update activity |
| DELETE | `/activities/{id}` | - | `SuccessResponse` | activities.delete | Delete activity |
| POST | `/activities/{id}/images` | Multipart: files | `List[ActivityImageResponse]` | activities.edit | Upload images |
| PUT | `/activities/{id}/images/{image_id}` | `ImageUpdateRequest` | `ActivityImageResponse` | activities.edit | Update image (order, hero) |
| DELETE | `/activities/{id}/images/{image_id}` | - | `SuccessResponse` | activities.edit | Delete image |

#### Templates Endpoints

| Method | Endpoint | Request Schema | Response Schema | Permission | Description |
|--------|----------|----------------|-----------------|------------|-------------|
| GET | `/templates` | Query: status, search | `List[TemplateListItem]` | templates.view | List templates |
| POST | `/templates` | `TemplateCreate` | `TemplateResponse` | templates.create | Create template |
| GET | `/templates/{id}` | - | `TemplateDetailResponse` | templates.view | Get with full days |
| PUT | `/templates/{id}` | `TemplateUpdate` | `TemplateResponse` | templates.edit | Update template |
| POST | `/templates/{id}/publish` | - | `TemplateResponse` | templates.edit | Set status=published |
| DELETE | `/templates/{id}` | - | `SuccessResponse` | templates.delete | Delete template |
| POST | `/templates/{id}/days` | `TemplateDayCreate` | `TemplateDayResponse` | templates.edit | Add day |
| PUT | `/templates/{id}/days/{day_id}` | `TemplateDayUpdate` | `TemplateDayResponse` | templates.edit | Update day |
| DELETE | `/templates/{id}/days/{day_id}` | - | `SuccessResponse` | templates.edit | Delete day |
| POST | `/templates/{id}/days/{day_id}/activities` | `AttachActivityRequest` | `TemplateDayActivityResponse` | templates.edit | Attach activity to day |
| DELETE | `/templates/{id}/days/{day_id}/activities/{tda_id}` | - | `SuccessResponse` | templates.edit | Remove activity |
| PUT | `/templates/{id}/days/{day_id}/activities/reorder` | `ReorderRequest` | `SuccessResponse` | templates.edit | Reorder activities |

#### Itineraries Endpoints

| Method | Endpoint | Request Schema | Response Schema | Permission | Description |
|--------|----------|----------------|-----------------|------------|-------------|
| GET | `/itineraries` | Query: status, destination, date_from, date_to, search | `PaginatedResponse[ItineraryListItem]` | itineraries.view | List itineraries |
| POST | `/itineraries` | `ItineraryCreate` | `ItineraryResponse` | itineraries.create | Create from template |
| GET | `/itineraries/{id}` | - | `ItineraryDetailResponse` | itineraries.view | Get full structure |
| PUT | `/itineraries/{id}` | `ItineraryUpdate` | `ItineraryResponse` | itineraries.edit | Update metadata |
| DELETE | `/itineraries/{id}` | - | `SuccessResponse` | itineraries.delete | Delete itinerary |
| PUT | `/itineraries/{id}/days/{day_id}` | `ItineraryDayUpdate` | `ItineraryDayResponse` | itineraries.edit | Update day |
| POST | `/itineraries/{id}/days/{day_id}/activities` | `AttachActivityRequest` | `ItineraryDayActivityResponse` | itineraries.edit | Add activity to day |
| PUT | `/itineraries/{id}/days/{day_id}/activities/{ida_id}` | `ItineraryDayActivityUpdate` | `ItineraryDayActivityResponse` | itineraries.edit | Update time/notes |
| DELETE | `/itineraries/{id}/days/{day_id}/activities/{ida_id}` | - | `SuccessResponse` | itineraries.edit | Remove activity |
| PUT | `/itineraries/{id}/days/{day_id}/activities/reorder` | `ReorderRequest` | `SuccessResponse` | itineraries.edit | Reorder activities |
| PUT | `/itineraries/{id}/pricing` | `ItineraryPricingUpdate` | `ItineraryPricingResponse` | itineraries.edit | Update pricing |

#### Share & Public Endpoints

| Method | Endpoint | Request Schema | Response Schema | Permission | Description |
|--------|----------|----------------|-----------------|------------|-------------|
| POST | `/itineraries/{id}/share` | `ShareLinkCreate` | `ShareLinkResponse` | itineraries.share | Generate share link |
| PUT | `/share-links/{id}` | `ShareLinkUpdate` | `ShareLinkResponse` | itineraries.share | Update settings |
| DELETE | `/share-links/{id}` | - | `SuccessResponse` | itineraries.share | Deactivate link |
| GET | `/public/itinerary/{token}` | - | `PublicItineraryResponse` | **None (public)** | View shared itinerary |

#### Company Profile Endpoints

| Method | Endpoint | Request Schema | Response Schema | Permission | Description |
|--------|----------|----------------|-----------------|------------|-------------|
| GET | `/company-profile` | - | `CompanyProfileResponse` | settings.view | Get agency profile |
| PUT | `/company-profile` | `CompanyProfileUpdate` | `CompanyProfileResponse` | settings.edit | Update profile |
| POST | `/company-profile/logo` | Multipart: file | `CompanyProfileResponse` | settings.edit | Upload logo |
| POST | `/company-profile/payment-qr` | Multipart: file | `CompanyProfileResponse` | settings.edit | Upload QR code |

---

### 2.3 Pydantic Schemas (Request/Response)

#### Activity Schemas
```python
ActivityTypeCreate: name, description?, icon?
ActivityTypeUpdate: name?, description?, icon?
ActivityTypeResponse: id, name, description, icon, created_at

ActivityCreate:
  - name, activity_type_id, category_label, location_display
  - short_description, client_description
  - default_duration_value, default_duration_unit
  - rating?, group_size_label?, cost_type, cost_display?
  - highlights (array), tags (array)
  - is_active, internal_notes?

ActivityUpdate: (all fields optional)

ActivityListItem: (summary for grid)
  - id, name, activity_type_name, category_label, location_display
  - short_description, hero_image_url, is_active, updated_at

ActivityDetailResponse: (full object)
  - All ActivityCreate fields + id, agency_id, created_at, updated_at
  - images: List[ActivityImageResponse]

ActivityImageResponse:
  - id, activity_id, file_url, display_order, is_hero, uploaded_at

ImageUpdateRequest: display_order?, is_hero?
```

#### Template Schemas
```python
TemplateCreate:
  - name, destinations, duration_nights, duration_days
  - description, approximate_price?, status

TemplateUpdate: (all optional)

TemplateListItem:
  - id, name, destinations, duration_nights, duration_days
  - status, updated_at, usage_count?

TemplateDetailResponse:
  - All template fields
  - days: List[TemplateDayDetailResponse]

TemplateDayCreate:
  - day_number, title, description?

TemplateDayUpdate: title?, description?

TemplateDayDetailResponse:
  - id, day_number, title, description
  - activities: List[TemplateDayActivityResponse]

TemplateDayActivityResponse:
  - id, activity (nested ActivityListItem), display_order, template_notes

AttachActivityRequest: activity_id, display_order, notes?
ReorderRequest: activity_ids (ordered array of UUIDs)
```

#### Itinerary Schemas
```python
ItineraryCreate:
  - template_id?, trip_name, client_name, client_email, client_phone
  - destination_main, start_date, end_date
  - travellers_adults, travellers_children
  - internal_notes?

ItineraryUpdate: (all optional except id)

ItineraryListItem:
  - id, trip_name, client_name, destination_main
  - start_date, end_date, status, updated_at

ItineraryDetailResponse:
  - All itinerary fields + computed (duration_nights, duration_days, total_travellers)
  - days: List[ItineraryDayDetailResponse]
  - pricing: ItineraryPricingResponse?
  - share_link: ShareLinkResponse?

ItineraryDayUpdate: title?, description?

ItineraryDayDetailResponse:
  - id, day_number, date, title, description
  - activities: List[ItineraryDayActivityResponse]

ItineraryDayActivityResponse:
  - id, activity (nested ActivityListItem), display_order
  - scheduled_time, itinerary_notes

ItineraryDayActivityUpdate: scheduled_time?, itinerary_notes?, display_order?

ItineraryPricingUpdate:
  - base_package, taxes_fees, discount_code?, discount_amount?
  - total (computed)

ItineraryPricingResponse: all fields

ShareLinkCreate: live_updates_enabled?, expires_at?
ShareLinkUpdate: is_active?, live_updates_enabled?, expires_at?
ShareLinkResponse: all fields + public_url (computed)

PublicItineraryResponse:
  - Sanitized version of ItineraryDetailResponse
  - Includes: client_name, destination_main, dates, travellers, days with activities
  - Excludes: internal_notes, created_by, agency_id
  - Includes: company_profile (nested), pricing (nested)
```

#### Company Profile Schemas
```python
CompanyProfileUpdate:
  - company_name?, tagline?, description?
  - email?, phone?, website_url?, whatsapp_number?
  - show_phone?, show_email?, show_website?
  - payment_note?, bank_account_name?, bank_name?
  - bank_account_number?, bank_ifsc_swift?, bank_reference_note?

CompanyProfileResponse: all fields including logo_url, payment_qr_url
```

---

### 2.4 Frontend Modules (React + TypeScript)

#### Directory Structure
```
src/
├── features/
│   ├── activities/
│   │   ├── ActivityList.tsx
│   │   ├── ActivityDetail.tsx
│   │   ├── ActivityForm.tsx
│   │   ├── ActivityPicker.tsx (modal for selecting activities)
│   │   └── components/
│   │       ├── ActivityCard.tsx
│   │       ├── ImageGalleryUploader.tsx
│   │       └── ActivityPreviewCard.tsx
│   ├── templates/
│   │   ├── TemplateList.tsx
│   │   ├── TemplateBuilder.tsx (3-column layout)
│   │   └── components/
│   │       ├── TemplateCard.tsx
│   │       ├── DayTimeline.tsx
│   │       └── DayActivityList.tsx
│   ├── itineraries/
│   │   ├── ItineraryList.tsx
│   │   ├── ItineraryWizard.tsx (2-step)
│   │   ├── ItineraryEditor.tsx (similar to TemplateBuilder but date-aware)
│   │   ├── ItineraryPreview.tsx
│   │   └── components/
│   │       ├── ShareModal.tsx
│   │       └── PricingPanel.tsx
│   ├── public/
│   │   └── PublicItinerary.tsx (beautiful shared view)
│   ├── company/
│   │   └── CompanySettings.tsx
│   └── dashboard/
│       └── Dashboard.tsx (overview)
├── components/
│   ├── ui/
│   │   ├── ImageUploader.tsx (multi-image drag & drop)
│   │   ├── Chip.tsx
│   │   ├── Badge.tsx
│   │   ├── Accordion.tsx
│   │   ├── DatePicker.tsx
│   │   ├── TimePicker.tsx
│   │   └── ... (existing: Button, Input, Card, etc.)
│   └── layout/
│       ├── PublicLayout.tsx (no sidebar, for shared view)
│       └── ... (existing: AppShell, Header, Sidebar)
├── api/
│   ├── activities.ts
│   ├── templates.ts
│   ├── itineraries.ts
│   ├── share.ts
│   └── company.ts
├── store/
│   ├── activityStore.ts (optional)
│   ├── templateStore.ts (for builder state)
│   └── itineraryStore.ts (for editor state)
├── types/
│   ├── activity.ts
│   ├── template.ts
│   ├── itinerary.ts
│   └── company.ts
└── utils/
    ├── dateHelpers.ts (format dates, compute duration)
    └── imageHelpers.ts (upload, preview)
```

#### Key React Components

**ActivityList.tsx**
- Grid/table of activity cards with filters (type, location, search)
- Search bar with debounce
- Pagination
- Empty state
- Click card → ActivityDetail

**ActivityForm.tsx**
- Multi-section form: Basic Info, Descriptions, Media Gallery, Timing, Meta, Highlights
- ImageGalleryUploader with drag-to-reorder and set-as-hero
- Chip input for highlights
- Save/Cancel buttons
- Live preview panel (optional)

**TemplateBuilder.tsx**
- 3-column layout:
  - Left: template metadata form
  - Middle: day list with drag-and-drop
  - Right: selected day activities
- ActivityPicker modal
- Save Draft / Publish buttons

**ItineraryEditor.tsx**
- Similar to TemplateBuilder but:
  - Days show real dates
  - Activities have time pickers
  - Top bar with trip name, client, status
  - Preview and Share buttons

**PublicItinerary.tsx**
- Dark hero section with client greeting
- Trip overview stats (accommodations, activities, meals, transfers)
- Accordion day list
- Expanded day shows timeline with activity cards
- Company profile card
- Price summary card
- Payment QR code
- No authentication required
- Mobile-responsive

**ShareModal.tsx**
- Shareable link section with copy button
- Live updates toggle
- Expiry date picker
- PDF export button (future)

**CompanySettings.tsx**
- Branding section (logo upload, name, tagline)
- Contact details
- Payment info (QR upload, bank details)
- Show/hide toggles

---

## 3. Implementation Details

### 3.1 File Upload & Storage

**Strategy:** Local filesystem (development/small deployments), S3/R2 (production)

**Structure:**
```
uploads/
├── {agency_id}/
│   ├── activities/
│   │   ├── {activity_id}/
│   │   │   ├── image1.jpg
│   │   │   └── image2.png
│   ├── company/
│   │   ├── logo.png
│   │   └── payment_qr.png
```

**Implementation:**
- `app/utils/file_storage.py`:
  - `save_activity_image(file, agency_id, activity_id) → file_path`
  - `delete_file(file_path) → bool`
  - `get_file_url(file_path) → URL`
- Use `aiofiles` for async I/O
- Validate file types (JPEG, PNG only), max size (5MB per image)
- Generate unique filenames with UUID prefix to avoid collisions
- Serve via FastAPI StaticFiles mount: `/uploads/{path}`

### 3.2 Multi-Image Gallery Logic

**Frontend:**
- Use `react-dropzone` or native file input with drag-and-drop
- Allow selecting multiple images at once
- Display thumbnails in a grid
- Drag handles to reorder (update `display_order`)
- "Set as hero" button on each thumbnail (sets `is_hero=True`, clears others)
- Delete button with confirmation

**Backend:**
- On upload: save files, create ActivityImage records with sequential `display_order`
- On reorder: accept new order array, update `display_order` for each
- On set hero: update all images for activity, set only one to `is_hero=True`
- On delete: remove file from disk, delete record

### 3.3 Template → Itinerary Conversion Service

**Service:** `app/services/itinerary_service.py`

**Function:** `create_from_template(template_id, itinerary_data, db)`

**Logic:**
1. Fetch template with all days and activities (eager load)
2. Validate start_date and end_date
3. Compute duration; ensure it matches template's duration (or allow override)
4. Create Itinerary record
5. For each TemplateDay:
   - Compute actual date: `start_date + timedelta(days=day_number - 1)`
   - Create ItineraryDay with computed date
   - Copy title and description from TemplateDay
6. For each TemplateDayActivity:
   - Create ItineraryDayActivity
   - Copy activity_id, display_order
   - Leave scheduled_time as NULL (user fills later)
7. Return created Itinerary with days

### 3.4 Stats Computation for Trip Overview

**Backend endpoint:** `/api/v1/itineraries/{id}/stats`

**Logic:**
```python
def get_itinerary_stats(itinerary_id, db):
    # Count distinct activity types
    stats = db.query(
        ActivityType.name,
        func.count(ItineraryDayActivity.id)
    ).join(
        Activity, Activity.activity_type_id == ActivityType.id
    ).join(
        ItineraryDayActivity, ItineraryDayActivity.activity_id == Activity.id
    ).join(
        ItineraryDay, ItineraryDay.id == ItineraryDayActivity.itinerary_day_id
    ).filter(
        ItineraryDay.itinerary_id == itinerary_id
    ).group_by(ActivityType.name).all()

    return {
        "accommodations": count for "Stay",
        "activities": count for "Experience",
        "meals": count for "Meal",
        "transfers": count for "Transfer"
    }
```

**Alternative:** Compute on-the-fly in PublicItineraryResponse by iterating days and activities.

### 3.5 Public Itinerary Access & Security

**Flow:**
1. User visits `/public/itinerary/{token}`
2. Backend looks up ShareLink by token
3. Check: is_active=True, not expired
4. Increment view_count, update last_viewed_at
5. Fetch full itinerary with days, activities, images, company profile, pricing
6. Return sanitized response (no internal_notes, no user IDs)
7. Frontend renders beautiful page

**Security:**
- No authentication required
- Token is cryptographically random (64 chars, URL-safe)
- Rate limit public endpoint to prevent abuse
- Optional: check Referer or require CAPTCHA for first view

### 3.6 Live Updates (Optional, Phase 2)

**If live_updates_enabled=True:**
- Use WebSocket connection
- Frontend connects to `/ws/itinerary/{token}`
- When itinerary is updated (PUT /itineraries/{id}/...), broadcast message to connected clients
- Frontend receives update, refetches itinerary data
- Show toast: "Updated just now"

**Defer to later phase** if not critical for MVP.

### 3.7 RBAC Integration

**Permissions needed (add to existing Permission seeds):**
- `activities.view`, `activities.create`, `activities.edit`, `activities.delete`
- `templates.view`, `templates.create`, `templates.edit`, `templates.delete`
- `itineraries.view`, `itineraries.create`, `itineraries.edit`, `itineraries.delete`, `itineraries.share`
- `settings.view`, `settings.edit` (for company profile)

**Enforcement:**
- Use existing `require_permission` dependency
- Check on all protected endpoints
- Frontend hides buttons/routes if user lacks permission

### 3.8 Pagination & Filtering

**For large lists (Activities, Templates, Itineraries):**
- Use query params: `?page=1&limit=20&search=bali&type_id=...`
- Return:
  ```json
  {
    "items": [...],
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
  ```
- Use SQLAlchemy `offset()` and `limit()`

### 3.9 Soft Deletes (Optional)

**For Activities and Templates:**
- Add `deleted_at` column (nullable)
- Instead of DELETE, set `deleted_at = now()`
- Filter queries with `WHERE deleted_at IS NULL`
- Admin can restore by clearing `deleted_at`

**Alternative:** Hard delete with cascade constraints, ensure no orphan references.

### 3.10 Frontend State Management

**For complex builder/editor UIs:**
- Use Zustand store to manage local state:
  - Current template/itinerary being edited
  - Days array with nested activities
  - Dirty state (unsaved changes)
  - Undo/Redo stack (optional)

**Actions:**
- `addDay()`, `removeDay()`, `updateDay(dayId, data)`
- `addActivity(dayId, activityId)`, `removeActivity(dayId, activityId)`
- `reorderActivities(dayId, newOrder)`
- `saveTemplate()` / `saveItinerary()` → API call

### 3.11 Image Optimization

**Backend:**
- Generate thumbnails on upload (small, medium, large)
- Use Pillow library
- Store variants: `image1_thumb.jpg`, `image1_medium.jpg`, `image1.jpg`

**Frontend:**
- Use `srcset` and `sizes` for responsive images
- Lazy load images below the fold

**Defer to optimization phase** if needed.

---

## 4. Testing Strategy

### 4.1 Backend Tests

**Unit tests:**
- `test_activity_crud.py`: Create, read, update, delete activities
- `test_template_service.py`: Test template → itinerary conversion
- `test_file_storage.py`: Mock file uploads, test save/delete
- `test_public_itinerary.py`: Test token validation, expiry logic

**Integration tests:**
- Test full flow: create activity → create template → create itinerary → generate share link → access public view
- Test permission enforcement on all endpoints
- Test multi-image upload and reordering

### 4.2 Frontend Tests

**Component tests:**
- Test ActivityForm validation
- Test ImageGalleryUploader drag-and-drop (with mocked files)
- Test TemplateBuilder day addition/removal
- Test PublicItinerary rendering with mock data

**E2E tests (optional):**
- Playwright/Cypress: full user journey from login → create activity → build template → create itinerary → share

---

## 5. Deployment Considerations

### 5.1 Database Migrations

- Use Alembic to manage schema changes
- Initial migration: create all new tables
- Subsequent migrations: add columns, indexes as needed

### 5.2 File Storage in Production

- Switch to S3/R2/Azure Blob
- Update `file_storage.py` to use cloud SDK
- Serve images via CDN

### 5.3 Performance

- Add indexes on foreign keys, search fields (name, location)
- Optimize queries with `joinedload` to avoid N+1
- Cache public itinerary responses (Redis) if traffic is high

### 5.4 Security

- Validate all file uploads (type, size, content)
- Sanitize user input (XSS prevention)
- Rate limit public endpoints
- Use HTTPS in production
- Implement CORS properly

---

## 6. Future Enhancements

### 6.1 PDF Export
- Use WeasyPrint or Puppeteer to render PublicItinerary as PDF
- Endpoint: `POST /api/v1/itineraries/{id}/export-pdf`
- Store generated PDFs, serve download link

### 6.2 Semantic Search for Activities
- Integrate ChromaDB + OpenAI embeddings
- Endpoint: `POST /api/v1/activities/search` with `query` param
- Return ranked results based on semantic similarity

### 6.3 Drag-and-Drop UI Enhancements
- Use `react-beautiful-dnd` or `dnd-kit`
- Drag days to reorder
- Drag activities between days
- Smooth animations

### 6.4 Client Comments/Feedback
- Allow clients to leave comments on specific days/activities
- Store in separate `ItineraryComment` table
- Show in internal view for agent to respond

### 6.5 Multi-language Support
- Add `locale` field to Itinerary
- Store translations for common UI text
- Render public itinerary in client's language

### 6.6 Mobile App (Future)
- Expose same API for native mobile apps
- Offline mode for clients to view itinerary without internet

---

## 7. Summary

This plan provides a complete technical blueprint for implementing:
- **Activities**: Rich, reusable building blocks with multi-image galleries
- **Templates**: Day-wise itinerary blueprints for reuse
- **Itineraries**: Client-specific trips with dates, times, and pricing
- **Public View**: Beautiful, mobile-friendly shared itinerary page
- **Company Profile**: Agency branding and payment configuration

All modules integrate seamlessly with the existing auth, RBAC, and multi-tenancy foundation.

**Next steps:**
1. Review and approve this plan
2. Refer to `phases_v2_activities_templates_itineraries.md` for step-by-step implementation roadmap
3. Begin Phase 1: Activities Module (backend models + API)

---

**End of Implementation Plan**
