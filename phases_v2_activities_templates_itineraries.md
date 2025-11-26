# Project Phases: Activities, Templates, Itineraries & Shared View

**Current Phase:** Not Started

**Last Updated:** 2025-11-26

---

## Overview

This phases document provides a step-by-step implementation roadmap for the core business modules:
- Activities (library with rich cards)
- Templates (reusable day-by-day itineraries)
- Itineraries (client-specific trips)
- Public Shared View (beautiful client-facing page)
- Company Profile (agency branding)

Each phase builds on the previous one. Follow the order for best results.

---

## Phase 1: Activities Module – Backend

**Goal:** Build the backend foundation for the activity library with multi-image support.

### Database Models & Migrations

- [ ] Create `app/models/activity_type.py`:
  - [ ] ActivityType model (id, agency_id, name, description, icon, timestamps)
  - [ ] Add unique constraint on (agency_id, name)

- [ ] Create `app/models/activity.py`:
  - [ ] Activity model with all fields from plan.md
  - [ ] Fields: name, category_label, location_display, descriptions, duration, rating, group_size, cost, highlights (JSON), tags (JSON), is_active
  - [ ] Foreign keys: agency_id, activity_type_id, created_by_id
  - [ ] Add indexes on name, location_display, is_active

- [ ] Create `app/models/activity_image.py`:
  - [ ] ActivityImage model (id, activity_id, file_path, file_url, display_order, is_hero, uploaded_at)
  - [ ] Add unique constraint on (activity_id, display_order)
  - [ ] Add cascade delete when activity is deleted

- [ ] Update `app/db/base.py`:
  - [ ] Import ActivityType, Activity, ActivityImage

- [ ] Create Alembic migration (optional, or rely on `Base.metadata.create_all`)

### Schemas

- [ ] Create `app/schemas/activity_type.py`:
  - [ ] ActivityTypeCreate (name, description?, icon?)
  - [ ] ActivityTypeUpdate (all optional)
  - [ ] ActivityTypeResponse (all fields)

- [ ] Create `app/schemas/activity.py`:
  - [ ] ActivityCreate (all required/optional fields per plan)
  - [ ] ActivityUpdate (all optional)
  - [ ] ActivityListItem (summary for grid: id, name, type_name, category_label, location, short_description, hero_image_url, is_active, updated_at)
  - [ ] ActivityDetailResponse (full object with images array)
  - [ ] ActivityImageResponse (id, file_url, display_order, is_hero, uploaded_at)
  - [ ] ImageUpdateRequest (display_order?, is_hero?)

### File Storage Utility

- [ ] Create `app/utils/file_storage.py`:
  - [ ] `save_activity_image(file: UploadFile, agency_id: UUID, activity_id: UUID) → str` (returns file_path)
  - [ ] `delete_file(file_path: str) → bool`
  - [ ] `get_file_url(file_path: str) → str` (generate URL)
  - [ ] Validate file type (JPEG, PNG) and size (max 5MB)
  - [ ] Create directory structure: `uploads/{agency_id}/activities/{activity_id}/`
  - [ ] Generate unique filename with UUID prefix

- [ ] Update `app/main.py`:
  - [ ] Ensure `/uploads` is mounted via StaticFiles

### API Endpoints

- [ ] Create `app/api/v1/endpoints/activity_types.py`:
  - [ ] GET `/activity-types` – list all types for agency (permission: activities.view)
  - [ ] POST `/activity-types` – create type (permission: activities.create)
  - [ ] PUT `/activity-types/{id}` – update type (permission: activities.edit)
  - [ ] DELETE `/activity-types/{id}` – delete type (permission: activities.delete)

- [ ] Create `app/api/v1/endpoints/activities.py`:
  - [ ] GET `/activities` – list/filter activities (query: type_id, location, is_active, search, page, limit)
  - [ ] POST `/activities` – create activity (permission: activities.create)
  - [ ] GET `/activities/{id}` – get full details (permission: activities.view)
  - [ ] PUT `/activities/{id}` – update activity (permission: activities.edit)
  - [ ] DELETE `/activities/{id}` – delete activity (permission: activities.delete)
  - [ ] POST `/activities/{id}/images` – upload multiple images (permission: activities.edit)
  - [ ] PUT `/activities/{id}/images/{image_id}` – update image (display_order, is_hero)
  - [ ] DELETE `/activities/{id}/images/{image_id}` – delete image

- [ ] Update `app/api/v1/router.py`:
  - [ ] Include activity_types and activities routers

### Seed Data

- [ ] Update `app/db/init_db.py`:
  - [ ] Add activity permissions to seed (activities.view, activities.create, activities.edit, activities.delete)
  - [ ] Seed default activity types: Stay, Meal, Experience, Transfer, Other
  - [ ] Optional: seed 2-3 sample activities with placeholder images

### Testing

- [ ] Write `tests/unit/test_activity_models.py`:
  - [ ] Test Activity model creation
  - [ ] Test relationships (activity → images)

- [ ] Write `tests/unit/test_file_storage.py`:
  - [ ] Mock file upload
  - [ ] Test save, delete, get_url functions

- [ ] Write `tests/integration/test_activities.py`:
  - [ ] Test activity CRUD endpoints
  - [ ] Test image upload flow
  - [ ] Test image reordering and set-as-hero
  - [ ] Test permission enforcement

---

## Phase 2: Activities Module – Frontend

**Goal:** Build the activity library UI with grid view, rich editor, and multi-image uploader.

### API Client

- [ ] Create `src/api/activities.ts`:
  - [ ] `getActivityTypes()` → Promise<ActivityType[]>
  - [ ] `createActivityType(data)` → Promise<ActivityType>
  - [ ] `getActivities(params)` → Promise<PaginatedResponse<ActivityListItem>>
  - [ ] `createActivity(data)` → Promise<Activity>
  - [ ] `getActivity(id)` → Promise<ActivityDetailResponse>
  - [ ] `updateActivity(id, data)` → Promise<Activity>
  - [ ] `deleteActivity(id)` → Promise<void>
  - [ ] `uploadActivityImages(activityId, files)` → Promise<ActivityImage[]>
  - [ ] `updateActivityImage(activityId, imageId, data)` → Promise<ActivityImage>
  - [ ] `deleteActivityImage(activityId, imageId)` → Promise<void>

### Types

- [ ] Create `src/types/activity.ts`:
  - [ ] ActivityType, Activity, ActivityListItem, ActivityDetailResponse, ActivityImage
  - [ ] ActivityCreateRequest, ActivityUpdateRequest
  - [ ] Match backend schemas

### UI Components

- [ ] Create `src/components/ui/ImageUploader.tsx`:
  - [ ] Multi-file drag-and-drop uploader
  - [ ] Accept JPEG/PNG, max 5MB per file
  - [ ] Show upload progress
  - [ ] Preview thumbnails
  - [ ] Handle errors

- [ ] Create `src/components/ui/Chip.tsx` (if not exists):
  - [ ] Small pill component with color variants
  - [ ] Removable chips (with X icon)

- [ ] Create `src/components/ui/Badge.tsx` (if not exists):
  - [ ] Small status indicator (active/inactive, etc.)

### Activity Management

- [ ] Create `src/features/activities/ActivityList.tsx`:
  - [ ] Page header with title "Activities Library" and "+ Add Activity" button
  - [ ] Filters row: search input, type dropdown, location filter (optional), status filter
  - [ ] Card grid (3-4 per row on desktop)
  - [ ] ActivityCard component per activity:
    - [ ] Hero image thumbnail
    - [ ] Type chip
    - [ ] Name, location
    - [ ] Small meta line (duration, price)
    - [ ] "View details" / "Edit" button
  - [ ] Empty state: "No activities yet" + CTA
  - [ ] Pagination controls
  - [ ] Click card → navigate to ActivityDetail

- [ ] Create `src/features/activities/components/ActivityCard.tsx`:
  - [ ] Reusable card for grid
  - [ ] Props: activity (ActivityListItem), onClick
  - [ ] Show hero image, type chip, name, location

- [ ] Create `src/features/activities/ActivityDetail.tsx`:
  - [ ] Top bar with activity name (or "New Activity"), status toggle, Cancel/Save buttons
  - [ ] Multi-section form:
    - [ ] **Basic Information**: name, type dropdown, category_label, location_display
    - [ ] **Descriptions**: short_description (textarea), client_description (textarea)
    - [ ] **Media Gallery**: ImageGalleryUploader component
    - [ ] **Timing & Duration**: duration_value (number), duration_unit (dropdown)
    - [ ] **Experience Meta**: rating (number), group_size_label (dropdown/input), cost_type (radio: included/extra), cost_display (text)
    - [ ] **Highlights**: chip input (type + Enter to add)
    - [ ] **Tags**: chip input
    - [ ] **Internal Notes**: textarea
  - [ ] Use react-hook-form + zod for validation
  - [ ] Save → POST or PUT /activities
  - [ ] Cancel → back to ActivityList with unsaved changes confirmation

- [ ] Create `src/features/activities/components/ImageGalleryUploader.tsx`:
  - [ ] Upload area with drag-and-drop
  - [ ] Display uploaded images as thumbnails in a grid
  - [ ] Each thumbnail:
    - [ ] Drag handle (for reordering)
    - [ ] "Set as hero" button (radio-style, only one can be hero)
    - [ ] Delete button (X icon)
  - [ ] On reorder: update display_order and call API
  - [ ] On set hero: call API to update is_hero
  - [ ] On delete: call API to remove image

- [ ] Create `src/features/activities/components/ActivityPreviewCard.tsx` (optional):
  - [ ] Live preview of how activity card will look in shared itinerary
  - [ ] Shows hero image, title, meta row, highlights chips
  - [ ] Nice-to-have for UX

### Routing

- [ ] Update `src/routes/index.tsx`:
  - [ ] Add route: `/activities` → ActivityList (protected, requires activities.view)
  - [ ] Add route: `/activities/new` → ActivityDetail (protected, requires activities.create)
  - [ ] Add route: `/activities/:id` → ActivityDetail (protected, requires activities.view)

### Navigation

- [ ] Update `src/components/layout/Sidebar.tsx`:
  - [ ] Add "Activities" menu item (icon: compass or list)
  - [ ] Show only if user has activities.view permission

### Testing

- [ ] Test ActivityList rendering with mock data
- [ ] Test ActivityDetail form validation
- [ ] Test ImageGalleryUploader drag-and-drop and reorder
- [ ] Test activity creation flow end-to-end

---

## Phase 3: Templates Module – Backend

**Goal:** Implement backend for reusable itinerary templates with day-wise structure.

### Database Models

- [ ] Create `app/models/template.py`:
  - [ ] Template model (id, agency_id, name, destinations, duration_nights, duration_days, description, approximate_price, status, timestamps, created_by_id)
  - [ ] Enum for status: draft, published

- [ ] Create `app/models/template_day.py`:
  - [ ] TemplateDay model (id, template_id, day_number, title, description, timestamps)
  - [ ] Add unique constraint on (template_id, day_number)

- [ ] Create `app/models/template_day_activity.py`:
  - [ ] TemplateDayActivity model (id, template_day_id, activity_id, display_order, template_notes, created_at)
  - [ ] Add unique constraint on (template_day_id, display_order)
  - [ ] Foreign keys with cascade/restrict rules

- [ ] Update `app/db/base.py`:
  - [ ] Import Template, TemplateDay, TemplateDayActivity

### Schemas

- [ ] Create `app/schemas/template.py`:
  - [ ] TemplateCreate (name, destinations, duration_nights, duration_days, description, approximate_price?, status)
  - [ ] TemplateUpdate (all optional)
  - [ ] TemplateListItem (summary: id, name, destinations, duration, status, updated_at, usage_count?)
  - [ ] TemplateDetailResponse (full object with days: List[TemplateDayDetailResponse])
  - [ ] TemplateDayCreate (day_number, title, description?)
  - [ ] TemplateDayUpdate (title?, description?)
  - [ ] TemplateDayDetailResponse (id, day_number, title, description, activities: List[TemplateDayActivityResponse])
  - [ ] TemplateDayActivityResponse (id, activity nested, display_order, template_notes)
  - [ ] AttachActivityRequest (activity_id, display_order?, notes?)
  - [ ] ReorderRequest (activity_ids: List[UUID])

### API Endpoints

- [ ] Create `app/api/v1/endpoints/templates.py`:
  - [ ] GET `/templates` – list templates (query: status, search) (permission: templates.view)
  - [ ] POST `/templates` – create template (permission: templates.create)
  - [ ] GET `/templates/{id}` – get full template with days (permission: templates.view)
  - [ ] PUT `/templates/{id}` – update template metadata (permission: templates.edit)
  - [ ] POST `/templates/{id}/publish` – set status=published (permission: templates.edit)
  - [ ] DELETE `/templates/{id}` – delete template (permission: templates.delete)
  - [ ] POST `/templates/{id}/days` – add day (permission: templates.edit)
  - [ ] PUT `/templates/{id}/days/{day_id}` – update day (permission: templates.edit)
  - [ ] DELETE `/templates/{id}/days/{day_id}` – delete day (permission: templates.edit)
  - [ ] POST `/templates/{id}/days/{day_id}/activities` – attach activity (permission: templates.edit)
  - [ ] DELETE `/templates/{id}/days/{day_id}/activities/{tda_id}` – remove activity (permission: templates.edit)
  - [ ] PUT `/templates/{id}/days/{day_id}/activities/reorder` – reorder activities (permission: templates.edit)

- [ ] Update `app/api/v1/router.py`:
  - [ ] Include templates router

### Seed Data

- [ ] Update `app/db/init_db.py`:
  - [ ] Add template permissions (templates.view, templates.create, templates.edit, templates.delete)
  - [ ] Optional: seed 1-2 sample templates with days and activities

### Testing

- [ ] Write `tests/integration/test_templates.py`:
  - [ ] Test template CRUD
  - [ ] Test day creation and deletion
  - [ ] Test activity attachment and reordering
  - [ ] Test publish flow
  - [ ] Test permission enforcement

---

## Phase 4: Templates Module – Frontend

**Goal:** Build template builder UI with 3-column layout and drag-and-drop.

### API Client

- [ ] Create `src/api/templates.ts`:
  - [ ] `getTemplates(params)` → Promise<TemplateListItem[]>
  - [ ] `createTemplate(data)` → Promise<Template>
  - [ ] `getTemplate(id)` → Promise<TemplateDetailResponse>
  - [ ] `updateTemplate(id, data)` → Promise<Template>
  - [ ] `publishTemplate(id)` → Promise<Template>
  - [ ] `deleteTemplate(id)` → Promise<void>
  - [ ] `addTemplateDay(templateId, data)` → Promise<TemplateDay>
  - [ ] `updateTemplateDay(templateId, dayId, data)` → Promise<TemplateDay>
  - [ ] `deleteTemplateDay(templateId, dayId)` → Promise<void>
  - [ ] `attachActivity(templateId, dayId, data)` → Promise<TemplateDayActivity>
  - [ ] `removeActivity(templateId, dayId, activityId)` → Promise<void>
  - [ ] `reorderActivities(templateId, dayId, activityIds)` → Promise<void>

### Types

- [ ] Create `src/types/template.ts`:
  - [ ] Template, TemplateListItem, TemplateDetailResponse
  - [ ] TemplateDay, TemplateDayActivity
  - [ ] TemplateCreateRequest, TemplateUpdateRequest

### State Management

- [ ] Create `src/store/templateStore.ts` (Zustand):
  - [ ] State: currentTemplate, days, selectedDayId, isDirty
  - [ ] Actions: setTemplate, addDay, removeDay, updateDay, selectDay, addActivity, removeActivity, reorderActivities, saveTemplate

### Template Management

- [ ] Create `src/features/templates/TemplateList.tsx`:
  - [ ] Header: "Templates" + "+ Create Template" button
  - [ ] Grid of template cards (2-3 per row)
  - [ ] TemplateCard: name, destinations, duration, status chip, "Used in X itineraries", buttons: "Edit Template", "Use Template"
  - [ ] Empty state
  - [ ] Optional: search/filter by name, status

- [ ] Create `src/features/templates/components/TemplateCard.tsx`:
  - [ ] Reusable card for grid
  - [ ] Show template summary
  - [ ] Action buttons

- [ ] Create `src/features/templates/TemplateBuilder.tsx`:
  - [ ] **3-column layout**:
    1. **Left panel (metadata)**:
       - [ ] Template name, destinations, duration (nights/days), description, approximate price
       - [ ] Status chip (Draft/Published)
       - [ ] Buttons: "Save Draft", "Publish"
    2. **Middle panel (days timeline)**:
       - [ ] Title: "Days"
       - [ ] Vertical list of day cards
       - [ ] Each day: day number pill + title
       - [ ] Drag handle for reordering days
       - [ ] Overflow menu: Rename, Duplicate, Delete
       - [ ] Active day highlighted
       - [ ] "+ Add Day" button at bottom
    3. **Right panel (selected day content)**:
       - [ ] Header: day title + description
       - [ ] Badge: "X activities planned"
       - [ ] List of activity cards for this day
       - [ ] Each card: type icon, name, duration, location, drag handle, Edit/Delete icons
       - [ ] "+ Add Activity" button (opens ActivityPicker modal)
       - [ ] Empty state if no activities

- [ ] Create `src/features/templates/components/DayTimeline.tsx`:
  - [ ] Vertical list of days
  - [ ] Drag-and-drop to reorder (use `dnd-kit` or similar)
  - [ ] Click day → select in store

- [ ] Create `src/features/templates/components/DayActivityList.tsx`:
  - [ ] List of activities for selected day
  - [ ] Drag-and-drop to reorder
  - [ ] Edit notes (inline or modal)
  - [ ] Remove activity button

- [ ] Create `src/features/activities/ActivityPicker.tsx`:
  - [ ] Modal/drawer for selecting activities
  - [ ] Search + filters (same as ActivityList)
  - [ ] Grid of ActivityCard components
  - [ ] Each card has "+ Add" button
  - [ ] Can select multiple before confirming
  - [ ] "Done" button → attach selected activities to day

### Routing

- [ ] Update `src/routes/index.tsx`:
  - [ ] Add route: `/templates` → TemplateList (protected, requires templates.view)
  - [ ] Add route: `/templates/new` → TemplateBuilder (protected, requires templates.create)
  - [ ] Add route: `/templates/:id` → TemplateBuilder (protected, requires templates.view)

### Navigation

- [ ] Update `src/components/layout/Sidebar.tsx`:
  - [ ] Add "Templates" menu item
  - [ ] Show only if user has templates.view permission

### Testing

- [ ] Test TemplateList rendering
- [ ] Test TemplateBuilder 3-column layout
- [ ] Test day addition/removal
- [ ] Test activity attachment via ActivityPicker
- [ ] Test drag-and-drop reordering

---

## Phase 5: Itineraries Module – Backend

**Goal:** Implement backend for client-specific itineraries with template conversion.

### Database Models

- [ ] Create `app/models/itinerary.py`:
  - [ ] Itinerary model (id, agency_id, template_id, trip_name, client info, destination, dates, travellers, status, internal_notes, timestamps, created_by_id)
  - [ ] Enum for status: draft, sent, confirmed, cancelled

- [ ] Create `app/models/itinerary_day.py`:
  - [ ] ItineraryDay model (id, itinerary_id, day_number, date, title, description, timestamps)
  - [ ] Add unique constraints on (itinerary_id, day_number) and (itinerary_id, date)

- [ ] Create `app/models/itinerary_day_activity.py`:
  - [ ] ItineraryDayActivity model (id, itinerary_day_id, activity_id, display_order, scheduled_time, itinerary_notes, created_at)
  - [ ] Add unique constraint on (itinerary_day_id, display_order)

- [ ] Create `app/models/itinerary_pricing.py`:
  - [ ] ItineraryPricing model (id, itinerary_id, base_package, taxes_fees, discount_code, discount_amount, total, currency, timestamps)
  - [ ] Add unique constraint on itinerary_id

- [ ] Update `app/db/base.py`:
  - [ ] Import Itinerary, ItineraryDay, ItineraryDayActivity, ItineraryPricing

### Schemas

- [ ] Create `app/schemas/itinerary.py`:
  - [ ] ItineraryCreate (template_id?, trip_name, client info, destination, dates, travellers, internal_notes?)
  - [ ] ItineraryUpdate (all optional)
  - [ ] ItineraryListItem (summary: id, trip_name, client_name, destination, dates, status, updated_at)
  - [ ] ItineraryDetailResponse (full object with days, pricing?, share_link?, computed fields)
  - [ ] ItineraryDayUpdate (title?, description?)
  - [ ] ItineraryDayDetailResponse (id, day_number, date, title, description, activities)
  - [ ] ItineraryDayActivityResponse (id, activity nested, display_order, scheduled_time, itinerary_notes)
  - [ ] ItineraryDayActivityUpdate (scheduled_time?, itinerary_notes?, display_order?)
  - [ ] ItineraryPricingUpdate (base_package, taxes_fees, discount_code?, discount_amount?, total)
  - [ ] ItineraryPricingResponse (all fields)

### Template Conversion Service

- [ ] Create `app/services/itinerary_service.py`:
  - [ ] `create_from_template(template_id: UUID, itinerary_data: ItineraryCreate, db: Session) → Itinerary`:
    - [ ] Fetch template with all days and activities (eager load)
    - [ ] Validate dates
    - [ ] Create Itinerary record
    - [ ] For each TemplateDay:
      - [ ] Compute date = start_date + timedelta(days=day_number - 1)
      - [ ] Create ItineraryDay with date, title, description
      - [ ] For each TemplateDayActivity:
        - [ ] Create ItineraryDayActivity (copy activity_id, display_order, leave scheduled_time null)
    - [ ] Return created itinerary

### API Endpoints

- [ ] Create `app/api/v1/endpoints/itineraries.py`:
  - [ ] GET `/itineraries` – list itineraries (query: status, destination, date_from, date_to, search, page, limit) (permission: itineraries.view)
  - [ ] POST `/itineraries` – create from template (permission: itineraries.create)
  - [ ] GET `/itineraries/{id}` – get full structure (permission: itineraries.view)
  - [ ] PUT `/itineraries/{id}` – update metadata (permission: itineraries.edit)
  - [ ] DELETE `/itineraries/{id}` – delete itinerary (permission: itineraries.delete)
  - [ ] PUT `/itineraries/{id}/days/{day_id}` – update day (permission: itineraries.edit)
  - [ ] POST `/itineraries/{id}/days/{day_id}/activities` – add activity (permission: itineraries.edit)
  - [ ] PUT `/itineraries/{id}/days/{day_id}/activities/{ida_id}` – update time/notes (permission: itineraries.edit)
  - [ ] DELETE `/itineraries/{id}/days/{day_id}/activities/{ida_id}` – remove activity (permission: itineraries.edit)
  - [ ] PUT `/itineraries/{id}/days/{day_id}/activities/reorder` – reorder activities (permission: itineraries.edit)
  - [ ] PUT `/itineraries/{id}/pricing` – update pricing (permission: itineraries.edit)

- [ ] Update `app/api/v1/router.py`:
  - [ ] Include itineraries router

### Seed Data

- [ ] Update `app/db/init_db.py`:
  - [ ] Add itinerary permissions (itineraries.view, itineraries.create, itineraries.edit, itineraries.delete, itineraries.share)
  - [ ] Optional: seed 1 sample itinerary with pricing

### Testing

- [ ] Write `tests/unit/test_itinerary_service.py`:
  - [ ] Test create_from_template logic
  - [ ] Test date mapping
  - [ ] Mock template data

- [ ] Write `tests/integration/test_itineraries.py`:
  - [ ] Test itinerary CRUD
  - [ ] Test creating itinerary from template
  - [ ] Test day and activity management
  - [ ] Test pricing update

---

## Phase 6: Itineraries Module – Frontend

**Goal:** Build itinerary wizard, editor, and preview.

### API Client

- [ ] Create `src/api/itineraries.ts`:
  - [ ] `getItineraries(params)` → Promise<PaginatedResponse<ItineraryListItem>>
  - [ ] `createItinerary(data)` → Promise<Itinerary>
  - [ ] `getItinerary(id)` → Promise<ItineraryDetailResponse>
  - [ ] `updateItinerary(id, data)` → Promise<Itinerary>
  - [ ] `deleteItinerary(id)` → Promise<void>
  - [ ] `updateItineraryDay(itineraryId, dayId, data)` → Promise<ItineraryDay>
  - [ ] `addActivityToDay(itineraryId, dayId, data)` → Promise<ItineraryDayActivity>
  - [ ] `updateDayActivity(itineraryId, dayId, activityId, data)` → Promise<ItineraryDayActivity>
  - [ ] `removeDayActivity(itineraryId, dayId, activityId)` → Promise<void>
  - [ ] `reorderDayActivities(itineraryId, dayId, activityIds)` → Promise<void>
  - [ ] `updatePricing(itineraryId, data)` → Promise<ItineraryPricing>

### Types

- [ ] Create `src/types/itinerary.ts`:
  - [ ] Itinerary, ItineraryListItem, ItineraryDetailResponse
  - [ ] ItineraryDay, ItineraryDayActivity, ItineraryPricing
  - [ ] ItineraryCreateRequest, ItineraryUpdateRequest

### State Management

- [ ] Create `src/store/itineraryStore.ts` (Zustand):
  - [ ] State: currentItinerary, days, selectedDayId, pricing, isDirty
  - [ ] Actions: setItinerary, updateDay, addActivity, removeActivity, updateActivity, reorderActivities, savePricing

### Itinerary Management

- [ ] Create `src/features/itineraries/ItineraryList.tsx`:
  - [ ] Header: "Itineraries" + "Create New Itinerary" button
  - [ ] Filters: search, status dropdown, destination, date range pickers
  - [ ] Table: Client name, Trip name, Destination, Dates, Status, Last updated, Actions
  - [ ] Row click → ItineraryEditor
  - [ ] "Create New Itinerary" → ItineraryWizard

- [ ] Create `src/features/itineraries/ItineraryWizard.tsx`:
  - [ ] **Step 1: Select Template**
    - [ ] Step indicator: "1. Select Template → 2. Client & Dates"
    - [ ] Grid of template cards (only Published)
    - [ ] "Use this template" button per card
    - [ ] Optional: "Start from scratch" (defer to later)
  - [ ] **Step 2: Client & Dates**
    - [ ] Fields: client_name, client_email, client_phone, trip_name, destination (pre-filled), start_date, end_date, travellers_adults, travellers_children
    - [ ] Summary line: "7 days / 6 nights · 2 guests"
    - [ ] Buttons: "Back", "Create Itinerary"
  - [ ] On create → POST /itineraries → redirect to ItineraryEditor

- [ ] Create `src/features/itineraries/ItineraryEditor.tsx`:
  - [ ] **Layout similar to TemplateBuilder but date-aware**:
    - [ ] Top bar: trip name, client name, destination, dates, travellers badge, status chip
    - [ ] Buttons: "Preview", "Share & Export"
    - [ ] Left/middle: day list with real dates ("Day 1 – Sun, Dec 15 · Arrival")
    - [ ] Right: selected day timeline editor
      - [ ] For each activity: time picker, activity card, edit/remove buttons
      - [ ] "+ Add Activity" button
  - [ ] Auto-save or explicit "Save" button

- [ ] Create `src/features/itineraries/components/PricingPanel.tsx`:
  - [ ] Side panel or collapsible section
  - [ ] Fields: base_package, taxes_fees, discount_code, discount_amount
  - [ ] Computed total
  - [ ] "Update Pricing" button

- [ ] Create `src/features/itineraries/ItineraryPreview.tsx`:
  - [ ] Read-only view using PublicItinerary layout (same styles)
  - [ ] Label: "Internal Preview"
  - [ ] Buttons: "Back to Editing", "Share & Export"

### Routing

- [ ] Update `src/routes/index.tsx`:
  - [ ] Add route: `/itineraries` → ItineraryList (protected, requires itineraries.view)
  - [ ] Add route: `/itineraries/new` → ItineraryWizard (protected, requires itineraries.create)
  - [ ] Add route: `/itineraries/:id/edit` → ItineraryEditor (protected, requires itineraries.edit)
  - [ ] Add route: `/itineraries/:id/preview` → ItineraryPreview (protected, requires itineraries.view)

### Navigation

- [ ] Update `src/components/layout/Sidebar.tsx`:
  - [ ] Add "Itineraries" menu item
  - [ ] Show only if user has itineraries.view permission

### Testing

- [ ] Test ItineraryWizard 2-step flow
- [ ] Test ItineraryEditor with time pickers
- [ ] Test pricing panel update
- [ ] Test preview mode

---

## Phase 7: Company Profile – Backend & Frontend

**Goal:** Allow agencies to configure branding, contact, and payment info.

### Backend

- [ ] Create `app/models/company_profile.py`:
  - [ ] CompanyProfile model (id, agency_id, company_name, tagline, description, logo_path, contact fields, payment fields, timestamps)
  - [ ] Add unique constraint on agency_id

- [ ] Update `app/db/base.py`:
  - [ ] Import CompanyProfile

- [ ] Create `app/schemas/company_profile.py`:
  - [ ] CompanyProfileUpdate (all fields optional)
  - [ ] CompanyProfileResponse (all fields + computed logo_url, payment_qr_url)

- [ ] Create `app/api/v1/endpoints/company_profile.py`:
  - [ ] GET `/company-profile` – get agency profile (permission: settings.view)
  - [ ] PUT `/company-profile` – update profile (permission: settings.edit)
  - [ ] POST `/company-profile/logo` – upload logo (permission: settings.edit)
  - [ ] POST `/company-profile/payment-qr` – upload QR code (permission: settings.edit)

- [ ] Update `app/api/v1/router.py`:
  - [ ] Include company_profile router

- [ ] Update `app/db/init_db.py`:
  - [ ] Add settings permissions (settings.view, settings.edit)
  - [ ] Seed default CompanyProfile for demo agency

### Frontend

- [ ] Create `src/api/company.ts`:
  - [ ] `getCompanyProfile()` → Promise<CompanyProfile>
  - [ ] `updateCompanyProfile(data)` → Promise<CompanyProfile>
  - [ ] `uploadLogo(file)` → Promise<CompanyProfile>
  - [ ] `uploadPaymentQR(file)` → Promise<CompanyProfile>

- [ ] Create `src/types/company.ts`:
  - [ ] CompanyProfile, CompanyProfileUpdateRequest

- [ ] Create `src/features/company/CompanySettings.tsx`:
  - [ ] Header: "Company Profile"
  - [ ] Sections:
    - [ ] **Branding**: logo uploader (circle preview), company_name, tagline
    - [ ] **About**: description (textarea)
    - [ ] **Contact Details**: email, phone, website_url, whatsapp_number
    - [ ] **Shared Page Options**: toggles for show_phone, show_email, show_website
    - [ ] **Payment Info**: payment_qr uploader, payment_note, bank details (account name, bank name, account number, IFSC/SWIFT, reference note)
  - [ ] "Save" button

- [ ] Update `src/routes/index.tsx`:
  - [ ] Add route: `/settings/company` → CompanySettings (protected, requires settings.view)

- [ ] Update `src/components/layout/Sidebar.tsx`:
  - [ ] Add "Settings" menu item with sub-item "Company Profile"
  - [ ] Show only if user has settings.view permission

### Testing

- [ ] Test company profile update
- [ ] Test logo and QR upload
- [ ] Test permission enforcement

---

## Phase 8: Share Links & Public View – Backend

**Goal:** Generate share links and implement public itinerary endpoint.

### Backend

- [ ] Create `app/models/share_link.py`:
  - [ ] ShareLink model (id, itinerary_id, token, is_active, live_updates_enabled, expires_at, view_count, last_viewed_at, timestamps)
  - [ ] Add unique constraints on itinerary_id and token
  - [ ] Add index on token

- [ ] Update `app/db/base.py`:
  - [ ] Import ShareLink

- [ ] Create `app/schemas/share.py`:
  - [ ] ShareLinkCreate (live_updates_enabled?, expires_at?)
  - [ ] ShareLinkUpdate (is_active?, live_updates_enabled?, expires_at?)
  - [ ] ShareLinkResponse (all fields + computed public_url)
  - [ ] PublicItineraryResponse (sanitized itinerary with company_profile and pricing)

- [ ] Create `app/utils/token_generator.py`:
  - [ ] `generate_share_token() → str` (64-char URL-safe random token)

- [ ] Create `app/api/v1/endpoints/share.py`:
  - [ ] POST `/itineraries/{id}/share` – generate share link (permission: itineraries.share)
  - [ ] PUT `/share-links/{id}` – update settings (permission: itineraries.share)
  - [ ] DELETE `/share-links/{id}` – deactivate link (permission: itineraries.share)

- [ ] Create `app/api/v1/endpoints/public.py`:
  - [ ] GET `/public/itinerary/{token}` – view shared itinerary (no auth)
    - [ ] Look up ShareLink by token
    - [ ] Check is_active=True, not expired
    - [ ] Increment view_count, update last_viewed_at
    - [ ] Fetch full itinerary with days, activities (eager load), company_profile, pricing
    - [ ] Return PublicItineraryResponse (sanitized)

- [ ] Update `app/api/v1/router.py`:
  - [ ] Include share and public routers

- [ ] Update `app/main.py`:
  - [ ] Ensure CORS allows requests from any origin for /public/* (or configure as needed)

### Seed Data

- [ ] Update `app/db/init_db.py`:
  - [ ] Optional: seed a share link for sample itinerary

### Testing

- [ ] Write `tests/integration/test_share.py`:
  - [ ] Test share link generation
  - [ ] Test public itinerary access with valid token
  - [ ] Test expiry logic
  - [ ] Test invalid token returns 404
  - [ ] Test view_count increment

---

## Phase 9: Public Shared View – Frontend

**Goal:** Build beautiful client-facing itinerary page based on screenshots.

### API Client

- [ ] Create `src/api/share.ts`:
  - [ ] `generateShareLink(itineraryId, options)` → Promise<ShareLink>
  - [ ] `updateShareLink(linkId, options)` → Promise<ShareLink>
  - [ ] `deactivateShareLink(linkId)` → Promise<void>
  - [ ] `getPublicItinerary(token)` → Promise<PublicItineraryResponse>

### Types

- [ ] Create `src/types/share.ts`:
  - [ ] ShareLink, ShareLinkCreateRequest, ShareLinkUpdateRequest
  - [ ] PublicItineraryResponse

### UI Components

- [ ] Create `src/components/ui/Accordion.tsx` (if not exists):
  - [ ] Accordion component for expandable day cards
  - [ ] Support single or multiple items open

### Public View

- [ ] Create `src/features/public/PublicItinerary.tsx`:
  - [ ] **Section 1: Hero Block**
    - [ ] Dark gradient card
    - [ ] "WELCOME ABOARD" small text
    - [ ] Greeting: "Hello, {client_name}"
    - [ ] Subline: "Your journey to {destination} awaits..."
    - [ ] Stat chips row: Duration, Destination, Travellers, Travel Dates
    - [ ] Optional plane icon
  - [ ] **Section 2: Trip Overview Cards**
    - [ ] Row of white cards: Accommodations (count), Activities (count), Meals Included (count), Transfers (count)
    - [ ] Compute counts from activities by type
  - [ ] **Section 3: Day List ("YOUR ITINERARY")**
    - [ ] Heading: "YOUR ITINERARY"
    - [ ] For each day:
      - [ ] Card row with: "DAY X" pill, date + title, "X activities planned", activity thumbnails, chevron
      - [ ] Accordion expand/collapse
  - [ ] **Section 4: Day Detail Timeline (Expanded)**
    - [ ] Sub-hero bar for day: "DAY X" badge, date, title, "X activities planned", image stack
    - [ ] Vertical timeline:
      - [ ] Left: time markers (scheduled_time)
      - [ ] Right: activity cards stacked vertically
    - [ ] **Activity Card**:
      - [ ] Category chip (colored)
      - [ ] Title
      - [ ] Meta line: duration, location
      - [ ] Image row: big hero image + 2-3 smaller thumbnails
      - [ ] Description paragraph
      - [ ] Meta strip: rating, group size, cost
      - [ ] Highlights chip row
  - [ ] **Section 5: Company Info & Price Summary**
    - [ ] Side-by-side or stacked (responsive)
    - [ ] **Company Card**: logo, name, tagline, description, contact details (email, phone, website)
    - [ ] **Price Summary Card**: Base Package, Taxes & Fees, Total (highlighted), Discount code input + Apply button
  - [ ] **Section 6: Payment Area**
    - [ ] Heading: "Ready to Confirm?"
    - [ ] Text: "Scan the QR code..."
    - [ ] QR code image
    - [ ] Payment note: "Secure payment powered by..."
  - [ ] All read-only, no editing
  - [ ] Mobile-responsive

- [ ] Create `src/components/layout/PublicLayout.tsx`:
  - [ ] No sidebar, no header
  - [ ] Optional: simple top bar with agency logo
  - [ ] Main content area
  - [ ] Footer (optional)

### Routing

- [ ] Update `src/routes/index.tsx`:
  - [ ] Add public route: `/itinerary/:token` → PublicItinerary (no auth)
  - [ ] Use PublicLayout

### Share Modal

- [ ] Create `src/features/itineraries/components/ShareModal.tsx`:
  - [ ] **Shareable Link Section**:
    - [ ] Toggle: "Enable public link"
    - [ ] When enabled: show URL with "Copy link" button
    - [ ] Optional: expiry date picker
    - [ ] Toggle: "Live updates ON/OFF"
  - [ ] **PDF Export Section** (placeholder for now):
    - [ ] "Generate PDF" button (disabled or coming soon)
    - [ ] Show timestamp if PDF exists
  - [ ] "Close" button

- [ ] Integrate ShareModal into ItineraryEditor:
  - [ ] "Share & Export" button opens modal
  - [ ] On save settings → call API to create/update share link

### Testing

- [ ] Test PublicItinerary rendering with mock data
- [ ] Test accordion expand/collapse
- [ ] Test mobile responsiveness
- [ ] Test ShareModal link copy
- [ ] Test public route access without auth

---

## Phase 10: Dashboard & Overview

**Goal:** Create dashboard with summary stats and recent items.

### Backend

- [ ] Create `app/api/v1/endpoints/dashboard.py`:
  - [ ] GET `/dashboard/stats` – return summary stats (permission: any authenticated user)
    - [ ] Total itineraries count
    - [ ] Upcoming trips count (start_date > today, status != cancelled)
    - [ ] Active templates count (status=published)
    - [ ] Recent itineraries (last 5, ordered by updated_at)
    - [ ] Recent templates (last 5, ordered by updated_at)

- [ ] Update `app/api/v1/router.py`:
  - [ ] Include dashboard router

### Frontend

- [ ] Create `src/api/dashboard.ts`:
  - [ ] `getDashboardStats()` → Promise<DashboardStats>

- [ ] Create `src/types/dashboard.ts`:
  - [ ] DashboardStats (total_itineraries, upcoming_trips, active_templates, recent_itineraries, recent_templates)

- [ ] Create `src/features/dashboard/Dashboard.tsx`:
  - [ ] Header: "Dashboard"
  - [ ] Primary CTA: "Create New Itinerary" button
  - [ ] Summary cards row:
    - [ ] Total Itineraries (number + icon)
    - [ ] Upcoming Trips (number + icon)
    - [ ] Active Templates (number + icon)
  - [ ] "Recent Itineraries" table (clickable rows → ItineraryEditor)
  - [ ] "Recently Updated Templates" list (clickable → TemplateBuilder)
  - [ ] Empty states if no data

- [ ] Update `src/routes/index.tsx`:
  - [ ] Set `/dashboard` as default route after login

- [ ] Update `src/components/layout/Sidebar.tsx`:
  - [ ] "Dashboard" as first menu item

### Testing

- [ ] Test dashboard stats fetch
- [ ] Test navigation from dashboard cards

---

## Phase 11: Polish & UX Enhancements

**Goal:** Refine UI/UX, add loading/error states, and improve overall user experience.

### UI/UX Polish

- [ ] Consistent spacing and typography across all screens (8px system)
- [ ] Add loading spinners for all async operations (API calls)
- [ ] Add skeleton loaders for lists/grids while fetching data
- [ ] Add empty states for all lists (e.g., "No activities yet", "No templates created")
- [ ] Add error states with user-friendly messages (retry buttons)
- [ ] Add toast notifications for success/error actions (react-toastify)
- [ ] Add confirmation dialogs for destructive actions (delete activity, delete template, etc.)
- [ ] Mobile responsiveness for all internal screens (not just public view)
- [ ] Accessibility improvements:
  - [ ] Keyboard navigation for modals, forms
  - [ ] ARIA labels for icons, buttons
  - [ ] Focus management

### Error Handling

- [ ] Global error boundary in React (`ErrorBoundary` component)
- [ ] 404 page for invalid routes
- [ ] Handle API errors gracefully (show error messages, allow retry)
- [ ] Backend: consistent error response format (status, message, details)

### Performance Optimizations

- [ ] Implement pagination for all large lists (activities, templates, itineraries)
- [ ] Debounce search inputs (300ms)
- [ ] Lazy load images in grids/lists
- [ ] Code splitting for routes (React.lazy + Suspense)
- [ ] Optimize image uploads (compress on client before upload)

### Form Validation

- [ ] Ensure all forms use react-hook-form + zod for validation
- [ ] Show field-level errors
- [ ] Disable submit button while submitting
- [ ] Show success feedback after save

### Testing

- [ ] Manual testing of all flows on different screen sizes
- [ ] Browser compatibility testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing (iOS, Android)

---

## Phase 12: Testing & Quality Assurance

**Goal:** Achieve comprehensive test coverage and fix bugs.

### Backend Testing

- [ ] Run all existing unit tests
- [ ] Run all integration tests
- [ ] Write additional tests for edge cases:
  - [ ] Invalid date ranges for itineraries
  - [ ] Expired share link access
  - [ ] Activity deletion when used in templates/itineraries (should fail or cascade)
  - [ ] Permission enforcement on all endpoints
- [ ] Achieve 70%+ code coverage (use pytest-cov)
- [ ] Fix any failing tests

### Frontend Testing

- [ ] Write component tests for key components:
  - [ ] ActivityForm, ActivityList
  - [ ] TemplateBuilder, ItineraryEditor
  - [ ] PublicItinerary
- [ ] Test form validation flows
- [ ] Test error handling (mock API errors)
- [ ] Manual end-to-end testing:
  - [ ] Full user journey: login → create activity → build template → create itinerary → share with client
  - [ ] Test all RBAC scenarios (different user roles)

### Bug Fixes

- [ ] Review and fix any bugs discovered during testing
- [ ] Fix UI/UX issues (alignment, spacing, colors)
- [ ] Fix performance issues (slow queries, large payloads)

---

## Phase 13: Documentation & Deployment Prep

**Goal:** Document the system and prepare for deployment.

### Documentation

- [ ] Update main README.md:
  - [ ] Add instructions for running backend and frontend
  - [ ] Document environment variables
  - [ ] Add API endpoint reference (or link to /docs)
  - [ ] Add screenshots of key screens
- [ ] Document database schema (ER diagram or markdown table)
- [ ] Document frontend component architecture
- [ ] Add inline code comments for complex logic
- [ ] Create user guide (optional):
  - [ ] How to create activities
  - [ ] How to build templates
  - [ ] How to create and share itineraries

### Deployment Preparation

- [ ] Backend:
  - [ ] Add Alembic migrations (if not already using)
  - [ ] Create Dockerfile for FastAPI app
  - [ ] Setup docker-compose (backend + database)
  - [ ] Add production environment variables (.env.example)
  - [ ] Setup logging (structured JSON logs)
  - [ ] Add health check endpoint (already exists: /health)
  - [ ] Security headers (CORS, CSP, rate limiting with slowapi)
- [ ] Frontend:
  - [ ] Build production bundle: `npm run build`
  - [ ] Optimize bundle size (check with `npm run build -- --report`)
  - [ ] Setup environment-specific configs (dev/staging/prod)
  - [ ] Add service worker for PWA (optional)
- [ ] Database:
  - [ ] Switch to PostgreSQL for production (update DATABASE_URL)
  - [ ] Run migrations on production DB
  - [ ] Seed initial data (permissions, default activity types)
- [ ] File Storage:
  - [ ] Plan migration to S3/R2 (update file_storage.py)
  - [ ] Setup cloud storage buckets

---

## Phase 14: Production Deployment (Optional)

**Goal:** Deploy to production environment.

### Deployment

- [ ] Choose hosting platforms:
  - [ ] Backend: Railway, Render, DigitalOcean, AWS EC2
  - [ ] Frontend: Vercel, Netlify, Cloudflare Pages
  - [ ] Database: Managed PostgreSQL (AWS RDS, DigitalOcean, Supabase)
  - [ ] File storage: AWS S3, Cloudflare R2
- [ ] Deploy backend:
  - [ ] Setup CI/CD pipeline (GitHub Actions)
  - [ ] Configure environment variables on hosting platform
  - [ ] Run database migrations
  - [ ] Test API endpoints
- [ ] Deploy frontend:
  - [ ] Configure build settings
  - [ ] Set VITE_API_URL to production backend URL
  - [ ] Deploy and test
- [ ] Setup domain and SSL:
  - [ ] Point domain to frontend and backend
  - [ ] Configure SSL certificates (Let's Encrypt or platform-managed)
- [ ] Configure CORS for production origins

### Monitoring & Maintenance

- [ ] Setup error tracking (Sentry for both backend and frontend)
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom)
- [ ] Setup analytics (optional, Google Analytics or Plausible)
- [ ] Configure automated backups for database
- [ ] Setup alerting for critical errors

---

## Phase 15: Future Enhancements (Backlog)

**Goal:** Plan for future features and improvements.

### Planned Features

- [ ] **PDF Export**:
  - [ ] Implement WeasyPrint or Puppeteer PDF generation
  - [ ] Endpoint: POST /itineraries/{id}/export-pdf
  - [ ] Store generated PDFs, serve download link in ShareModal
- [ ] **Semantic Search for Activities**:
  - [ ] Integrate ChromaDB + OpenAI embeddings
  - [ ] Endpoint: POST /activities/search with natural language query
  - [ ] Update ActivityList to support semantic search
- [ ] **Live Updates (WebSocket)**:
  - [ ] Implement WebSocket connection for public itinerary
  - [ ] When itinerary is updated, broadcast to connected clients
  - [ ] Show "Updated just now" toast on client page
- [ ] **Drag-and-Drop Enhancements**:
  - [ ] Use react-beautiful-dnd or dnd-kit
  - [ ] Drag days to reorder in templates/itineraries
  - [ ] Drag activities between days
- [ ] **Client Feedback/Comments**:
  - [ ] Allow clients to leave comments on activities/days
  - [ ] Store in ItineraryComment table
  - [ ] Show in internal view for agent response
- [ ] **Multi-language Support**:
  - [ ] Add locale field to Itinerary
  - [ ] Store translations for UI text
  - [ ] Render public itinerary in client's language
- [ ] **Mobile App**:
  - [ ] Expose API for native mobile apps
  - [ ] Offline mode for clients

### Technical Debt

- [ ] Refactor large components into smaller, reusable pieces
- [ ] Optimize database queries (add indexes, use eager loading)
- [ ] Implement soft deletes for activities/templates (if needed)
- [ ] Improve error messages (more specific, actionable)
- [ ] Add rate limiting on public endpoints (prevent abuse)

---

## Completion Checklist

**Phase 1:** ☐ Activities Backend Complete
**Phase 2:** ☐ Activities Frontend Complete
**Phase 3:** ☐ Templates Backend Complete
**Phase 4:** ☐ Templates Frontend Complete
**Phase 5:** ☐ Itineraries Backend Complete
**Phase 6:** ☐ Itineraries Frontend Complete
**Phase 7:** ☐ Company Profile Complete
**Phase 8:** ☐ Share Links Backend Complete
**Phase 9:** ☐ Public Shared View Complete
**Phase 10:** ☐ Dashboard Complete
**Phase 11:** ☐ Polish & UX Complete
**Phase 12:** ☐ Testing & QA Complete
**Phase 13:** ☐ Documentation Complete
**Phase 14:** ☐ Production Deployment (Optional)
**Phase 15:** ☐ Future Enhancements (Ongoing)

---

**End of Phases Document**

Update this file regularly to track progress. Check off items as they are completed. When starting a new session, review `plan_v2_activities_templates_itineraries.md` and this file to understand what needs to be done next.
