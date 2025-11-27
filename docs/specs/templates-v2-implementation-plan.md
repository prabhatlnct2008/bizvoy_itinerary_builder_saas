# Templates List + Builder v2 - Implementation Plan

## Decisions Made

| Question | Decision |
|----------|----------|
| Archived Status | **Option A** - Add `archived` to status enum |
| Create Itinerary Flow | **Option A** - Skip Step 1, show template summary with "Change" link |
| Day Deletion | **Option A** - Simple confirmation with activity count |
| Duration vs Days | **Option B** - Auto-sync duration to match day count (days = source of truth) |
| Responsive Layout | **Option A** - Stacked layout on mobile |
| Drag Library | **Native HTML5** - Already used for activities, keep consistent |
| Permissions | **Reuse existing** - `templates.create` for copy, `templates.delete` for archive |

---

## Current State Analysis

### What Already Exists ✅
1. **Template CRUD** - Full create/read/update/delete operations
2. **Template Days** - With `day_number` for ordering
3. **Activity Ordering** - `display_order` field with native drag-and-drop + move buttons
4. **Activity Reorder API** - `PUT /templates/{id}/days/{day_id}/activities/reorder`
5. **Template-Itinerary Integration** - `create_itinerary_from_template` service
6. **Status** - `draft` and `published` values
7. **Usage Count** - Calculated in API but not displayed in UI
8. **3-column Builder Layout** - Left (info), Middle (days), Right (activities)
9. **Itinerary Wizard** - Step 1 allows template selection

### What Needs to Be Built 🔨

| Story | Feature | Status | Complexity |
|-------|---------|--------|------------|
| T1 | Table view for templates list | New | Medium |
| T1 | Search by name/destination | Exists (needs refinement) | Low |
| T1 | Status filter with Archived | Partial (needs Archived) | Medium |
| T1 | 3-dot actions menu | New | Low |
| T1 | Soft delete/Archive | New | Medium |
| T2 | Create Itinerary from list | New routing | Low |
| T3 | Copy/Clone template | New | Medium |
| T4 | Decouple days from duration | Refactor | Medium |
| T4 | + Add Day button | New | Low |
| T4 | Drag-and-drop day reorder | New | Medium |
| T5 | Activity reordering | ✅ EXISTS | Done |
| T6 | Responsive/mobile layout | Refactor | Medium |

---

## Implementation Plan

### Phase 1: Backend Changes

#### 1.1 Add Archived Status
**File:** `backend/app/models/template.py`

```python
class TemplateStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"  # NEW
```

**Migration:** Alembic migration to add 'archived' to enum

#### 1.2 Update Template List Endpoint
**File:** `backend/app/api/v1/endpoints/templates.py`

- Modify `GET /templates` to:
  - Exclude archived by default (unless `status=archived` or `status=all`)
  - Support `search` param for name/destination filtering
  - Return `usage_count` in list response (currently only in detail)

#### 1.3 Add Clone Template Endpoint
**File:** `backend/app/api/v1/endpoints/templates.py`

```python
@router.post("/{template_id}/copy", response_model=TemplateDetailResponse)
async def copy_template(template_id: str, ...):
    """Clone a template with all days and activities"""
    # Requires: templates.create permission
    # 1. Get original template with days and activities
    # 2. Create new template with name = "Original Name (Copy)"
    # 3. Copy all days and activities with ordering
    # 4. Set status = draft
    # 5. Return new template
```

#### 1.4 Add Day Reorder Endpoint
**File:** `backend/app/api/v1/endpoints/templates.py`

```python
@router.put("/{template_id}/days/reorder", response_model=TemplateDetailResponse)
async def reorder_days(template_id: str, day_order: List[str], ...):
    """Reorder days by providing list of day IDs in desired order"""
    # Update day_number for each day based on position in list
```

#### 1.5 Enhance Add Day Endpoint
**File:** `backend/app/api/v1/endpoints/templates.py`

- Modify existing `POST /templates/{id}/days` to:
  - Auto-assign next `day_number` if not provided
  - Default title = "Day {n}"
  - Auto-sync template `duration_days` = day count

#### 1.6 Archive Endpoint (Soft Delete)
**File:** `backend/app/api/v1/endpoints/templates.py`

```python
@router.post("/{template_id}/archive", response_model=TemplateResponse)
async def archive_template(template_id: str, ...):
    """Archive a template (soft delete)"""
    # Requires: templates.delete permission
    # Set status = 'archived'
```

#### 1.7 Auto-Sync Duration on Day Changes
- When adding/deleting days, auto-update:
  - `duration_days` = number of days
  - `duration_nights` = max(days - 1, 0)

---

### Phase 2: Frontend - Templates List

#### 2.1 Convert to Table View
**File:** `frontend/src/features/templates/TemplateList.tsx`

- Replace card grid with `<Table>` component
- Columns: Name, Destination(s), Duration, Status, Last Updated, Used In, Actions
- Status as colored chip/badge
- Duration formatted as "N days / N nights"

#### 2.2 Enhanced Search & Filters
- Debounced search input
- Status dropdown: All / Draft / Published / Archived
- Search filters by name AND destination

#### 2.3 Row Actions Menu (3-dot)
- View → Navigate to `/templates/{id}/edit`
- Copy → Call clone API, navigate to new template
- Create Itinerary → Navigate to `/itineraries/new?templateId={id}`
- Archive → Confirmation modal, call archive API

#### 2.4 Type Updates
**File:** `frontend/src/types/index.ts`

```typescript
export type TemplateStatus = 'draft' | 'published' | 'archived';

export interface TemplateListItem extends Template {
  usage_count: number;
}
```

---

### Phase 3: Frontend - Create Itinerary from Template

#### 3.1 Add Route Parameter
**File:** Router config / page component

- Support query param: `/itineraries/new?templateId=xxx`

#### 3.2 Update Itinerary Wizard
**File:** `frontend/src/features/itineraries/ItineraryWizard.tsx`

When `templateId` query param exists:
1. Fetch template details on mount
2. **Skip Step 1** - go directly to Step 2 (Client & Dates)
3. Show template summary banner at top of Step 2:
   ```
   Template: Kerala 5N/6D · [Change]
   ```
4. "Change" link navigates back to Step 1 (template picker)
5. Pre-fill destination and trip name from template

---

### Phase 4: Frontend - Clone Template

#### 4.1 Add Clone API Function
**File:** `frontend/src/api/templates.ts`

```typescript
async copyTemplate(id: string): Promise<TemplateDetail>
```

#### 4.2 Integrate Clone Action
- Call API from list actions menu
- Show loading state
- Navigate to new template on success
- Show success toast

---

### Phase 5: Frontend - Template Builder Enhancements

#### 5.1 Duration Auto-Sync (Days = Source of Truth)
**File:** `frontend/src/features/templates/TemplateBuilder.tsx`

**Current Behavior (problematic):**
- Changing duration_days auto-generates/removes days
- Can cause data loss

**New Behavior:**
- Days are authoritative; duration follows
- Adding/removing days auto-updates duration:
  - `duration_days` = number of days
  - `duration_nights` = max(days - 1, 0)
- Manually changing duration in form:
  - Updates display fields
  - Does NOT delete days
  - On save, duration syncs back to day count
- Duration fields shown as read-only or with subtle hint that they sync from days

#### 5.2 Add Day Management
- **+ Add Day button** at bottom of days timeline
  - Creates new day with title "Day {n}"
  - Appends to end of list
  - Auto-updates duration
- **Delete Day** in day's 3-dot menu
  - Confirmation: "Delete Day 3 – 'Beaches & Sunsets'? This will remove 3 activities."
  - Auto-updates duration after deletion
- **Rename Day** in day's 3-dot menu
  - Inline edit or modal

#### 5.3 Day Drag-and-Drop Reorder
**File:** `frontend/src/features/templates/components/DayTimeline.tsx`

- Add drag handles to day cards (use native HTML5 drag, same as activities)
- On drop: call reorder API and update local state
- Re-number days visually (Day 1, Day 2, etc.)
- Include up/down arrow buttons as fallback for mobile

#### 5.4 Duplicate Day
- In day's 3-dot menu: "Duplicate Day"
- Clones day with all activities
- Appends as new day at end
- Auto-updates duration

---

### Phase 6: Responsive Design

#### 6.1 Template Builder Mobile Layout (Stacked)
**File:** `frontend/src/features/templates/TemplateBuilder.tsx`

**Desktop (lg+):** 3-column layout as-is

**Tablet/Mobile (< lg):** Stacked layout
1. Template Details card (collapsible accordion)
2. Days list (full width)
3. When day is tapped → slide in Activities panel with back button

**Implementation:**
- Use Tailwind breakpoints: `lg:grid-cols-3`
- Add "Back to Days" button in activities panel on mobile
- Keep all actions visible (no hover-only controls)

#### 6.2 Touch-Friendly Fallbacks
- Up/down arrow buttons alongside drag handles
- Larger touch targets (min 44px)
- Day/activity cards have adequate padding

#### 6.3 Template List Responsive
- Desktop: Table view
- Mobile: Convert to card list or simplified table
- Search and status filter stack vertically
- 3-dot actions menu remains accessible

---

## Database Migration

```sql
-- Add 'archived' to template status enum
ALTER TYPE template_status ADD VALUE 'archived';
```

Or with Alembic:
```python
def upgrade():
    op.execute("ALTER TYPE templatestatus ADD VALUE 'archived'")
```

---

## API Endpoint Summary

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /templates | List templates (with search/filter) | Enhance |
| GET | /templates/{id} | Get template detail | Exists |
| POST | /templates | Create template | Exists |
| PUT | /templates/{id} | Update template | Exists |
| DELETE | /templates/{id} | Hard delete | Exists |
| POST | /templates/{id}/publish | Publish template | Exists |
| POST | /templates/{id}/copy | Clone template | **NEW** |
| POST | /templates/{id}/archive | Soft delete/archive | **NEW** |
| POST | /templates/{id}/days | Add day | Enhance |
| PUT | /templates/{id}/days/{day_id} | Update day | Exists |
| DELETE | /templates/{id}/days/{day_id} | Delete day | Exists |
| PUT | /templates/{id}/days/reorder | Reorder days | **NEW** |
| PUT | /templates/{id}/days/{day_id}/activities/reorder | Reorder activities | Exists |

---

## File Changes Summary

### Backend Files
1. `backend/app/models/template.py` - Add archived status
2. `backend/app/api/v1/endpoints/templates.py` - New endpoints + enhancements
3. `backend/app/schemas/template.py` - Update schemas
4. `alembic/versions/xxx_add_archived_status.py` - Migration

### Frontend Files
1. `frontend/src/types/index.ts` - Type updates
2. `frontend/src/api/templates.ts` - New API functions
3. `frontend/src/features/templates/TemplateList.tsx` - Table view + actions
4. `frontend/src/features/templates/TemplateBuilder.tsx` - Day management + responsive
5. `frontend/src/features/templates/components/DayTimeline.tsx` - Drag-and-drop days
6. `frontend/src/features/templates/components/DayCard.tsx` - Day actions menu (new)
7. `frontend/src/features/itineraries/ItineraryWizard.tsx` - Pre-select template
8. `frontend/src/store/templateStore.ts` - Day management actions

---

## Estimated Effort

| Phase | Description | Effort |
|-------|-------------|--------|
| Phase 1 | Backend changes | 4-6 hours |
| Phase 2 | Templates list table view | 4-6 hours |
| Phase 3 | Create itinerary from template | 2-3 hours |
| Phase 4 | Clone template | 2-3 hours |
| Phase 5 | Template builder enhancements | 6-8 hours |
| Phase 6 | Responsive design | 4-6 hours |
| **Total** | | **22-32 hours** |

---

## Questions for Stakeholder

See separate section for questions before implementation.
