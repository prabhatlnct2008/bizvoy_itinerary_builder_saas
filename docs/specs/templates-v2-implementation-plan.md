# Templates List + Builder v2 - Implementation Plan

## Current State Analysis

### What Already Exists ✅
1. **Template CRUD** - Full create/read/update/delete operations
2. **Template Days** - With `day_number` for ordering
3. **Activity Ordering** - `display_order` field with drag-and-drop + move buttons
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

**Migration needed:** Add 'archived' as valid enum value

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
    # 1. Get original template with days and activities
    # 2. Create new template with name = "Original Name (Copy)"
    # 3. Copy all days and activities
    # 4. Set status = draft
    # 5. Return new template
```

#### 1.4 Add Day Reorder Endpoint
**File:** `backend/app/api/v1/endpoints/templates.py`

```python
@router.put("/{template_id}/days/reorder", response_model=TemplateDetailResponse)
async def reorder_days(template_id: str, day_order: List[str], ...):
    """Reorder days by providing list of day IDs in desired order"""
    # Update day_number for each day based on new order
```

#### 1.5 Add Day to Template Endpoint (Enhanced)
**File:** `backend/app/api/v1/endpoints/templates.py`

- Modify existing `POST /templates/{id}/days` to:
  - Auto-assign next `day_number`
  - Not require day_number from client
  - Support default title "Day N"

#### 1.6 Soft Delete / Archive Endpoint
**File:** `backend/app/api/v1/endpoints/templates.py`

```python
@router.post("/{template_id}/archive", response_model=TemplateResponse)
async def archive_template(template_id: str, ...):
    """Archive a template (soft delete)"""
    # Set status = 'archived'
```

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
**File:** `frontend/src/pages/itineraries/new.tsx` (or router config)

- Support query param: `/itineraries/new?templateId=xxx`

#### 3.2 Update Itinerary Wizard
**File:** `frontend/src/features/itineraries/ItineraryWizard.tsx`

- If `templateId` query param exists:
  - Fetch template details
  - Pre-select template in Step 1
  - Optionally skip Step 1 and go directly to Step 2
  - Pre-fill destination and trip name

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

#### 5.1 Decouple Duration from Days
**File:** `frontend/src/features/templates/TemplateBuilder.tsx`

**Current Behavior (problematic):**
- Changing duration_days auto-generates/removes days
- Can cause data loss

**New Behavior:**
- Duration fields are informational only
- Days managed explicitly via + Add Day / Delete Day
- Show warning banner if `duration_days !== days.length`

#### 5.2 Add Day Management
- **+ Add Day button** at bottom of days timeline
  - Creates new day with title "Day N"
  - Appends to end of list
- **Delete Day** in day's 3-dot menu
  - Confirmation: "Delete Day X? All activities will be removed."
- **Rename Day** in day's 3-dot menu
  - Inline edit or modal

#### 5.3 Day Drag-and-Drop Reorder
**File:** `frontend/src/features/templates/components/DayTimeline.tsx`

- Add drag handles to day cards
- Use `@dnd-kit` or `react-beautiful-dnd` (check what's already in project)
- On drop: call reorder API and update local state
- Re-number days visually (Day 1, Day 2, etc.)

#### 5.4 Duplicate Day
- In day's 3-dot menu: "Duplicate Day"
- Clones day with all activities
- Appends as new day at end

---

### Phase 6: Responsive Design

#### 6.1 Template Builder Mobile Layout
**File:** `frontend/src/features/templates/TemplateBuilder.tsx`

**Approach A - Stacked Layout:**
- Desktop: 3 columns
- Tablet/Mobile: Stack vertically
  - Template Info (collapsible)
  - Days Timeline
  - Tap day → slide in Activities panel

**Approach B - Tabbed Layout:**
- Tabs: Details | Days | Activities
- Under "Days": full-screen day list
- Under "Activities": day selector + activity list

#### 6.2 Touch-Friendly Drag Fallback
- Add up/down arrow buttons as fallback
- Larger touch targets
- Long-press to initiate drag (optional)

#### 6.3 Template List Responsive
- Table converts to cards on mobile
- Actions menu remains accessible
- Search and filters stack vertically

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
