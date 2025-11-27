# Implementation Plan: Travel SaaS Itinerary Builder

## 1. System Overview

A **multi-tenant travel agency SaaS platform** that enables travel agencies to:
- Manage reusable activity libraries with AI-powered semantic search
- Create and publish itinerary templates for common trips
- Generate customized client itineraries from templates
- Share itineraries via public URLs with real-time live preview
- Export professional PDFs with images
- Enforce granular role-based access control

**Tech Stack:**
- **Backend:** FastAPI + SQLAlchemy (SQLite)
- **Frontend:** React + Tailwind CSS + Zustand
- **Search:** ChromaDB + OpenAI Embeddings
- **Real-time:** WebSocket (immediate push)
- **PDF:** WeasyPrint
- **Auth:** JWT tokens
- **Storage:** Local filesystem

---

## 2. Architecture Specification

### 2.1 Database Models (SQLAlchemy + SQLite)

#### 2.1.1 Core Tenancy & Auth

**Agency** (Tenant)
- `id`: UUID (PK)
- `name`: String(255), unique, indexed
- `subdomain`: String(100), unique, indexed (for future multi-domain support)
- `logo_url`: String(500), nullable
- `contact_email`: String(255)
- `contact_phone`: String(50), nullable
- `is_active`: Boolean, default=True
- `created_at`: DateTime(UTC)
- `updated_at`: DateTime(UTC)

**User**
- `id`: UUID (PK)
- `agency_id`: UUID (FK → Agency.id, CASCADE)
- `email`: String(255), unique, indexed
- `hashed_password`: String(255)
- `full_name`: String(255)
- `is_active`: Boolean, default=True
- `is_superuser`: Boolean, default=False (for agency admin)
- `created_at`: DateTime(UTC)
- `updated_at`: DateTime(UTC)
- **Unique Constraint:** (agency_id, email)

**Role** (Custom roles per agency)
- `id`: UUID (PK)
- `agency_id`: UUID (FK → Agency.id, CASCADE)
- `name`: String(100), indexed
- `description`: Text, nullable
- `created_at`: DateTime(UTC)
- `updated_at`: DateTime(UTC)
- **Unique Constraint:** (agency_id, name)

**Permission** (System-wide permission definitions)
- `id`: UUID (PK)
- `module`: String(100) (e.g., "itineraries", "templates", "activities", "users", "roles")
- `action`: String(50) (e.g., "view", "create", "edit", "delete", "export", "share")
- `codename`: String(150), unique (e.g., "itineraries.view", "templates.create")
- **Unique Constraint:** (module, action)

**RolePermission** (M2M: Role ↔ Permission)
- `id`: UUID (PK)
- `role_id`: UUID (FK → Role.id, CASCADE)
- `permission_id`: UUID (FK → Permission.id, CASCADE)
- **Unique Constraint:** (role_id, permission_id)

**UserRole** (M2M: User ↔ Role)
- `id`: UUID (PK)
- `user_id`: UUID (FK → User.id, CASCADE)
- `role_id`: UUID (FK → Role.id, CASCADE)
- **Unique Constraint:** (user_id, role_id)

---

#### 2.1.2 Activity Library

**ActivityType**
- `id`: UUID (PK)
- `agency_id`: UUID (FK → Agency.id, CASCADE)
- `name`: String(100) (e.g., "Stay", "Meal", "Experience", "Transfer")
- `icon`: String(50), nullable (emoji or icon name)
- `created_at`: DateTime(UTC)
- **Unique Constraint:** (agency_id, name)

**Activity** (Reusable catalog items)
- `id`: UUID (PK)
- `agency_id`: UUID (FK → Agency.id, CASCADE)
- `activity_type_id`: UUID (FK → ActivityType.id, SET NULL)
- `name`: String(255), indexed
- `location`: String(255), nullable
- `short_description`: Text
- `highlights`: Text (JSON array or line-separated)
- `base_price`: Decimal(10, 2), nullable
- `pricing_model`: String(50), nullable (e.g., "per_person", "per_group")
- `tags`: Text (JSON array) (e.g., ["romantic", "adventure"])
- `is_active`: Boolean, default=True
- `created_at`: DateTime(UTC)
- `updated_at`: DateTime(UTC)
- **Index:** (agency_id, name), (agency_id, is_active)

**ActivityImage**
- `id`: UUID (PK)
- `activity_id`: UUID (FK → Activity.id, CASCADE)
- `file_path`: String(500)
- `caption`: String(255), nullable
- `display_order`: Integer, default=0
- `is_primary`: Boolean, default=False
- `uploaded_at`: DateTime(UTC)

---

#### 2.1.3 Templates

**Template** (Reusable itinerary blueprints)
- `id`: UUID (PK)
- `agency_id`: UUID (FK → Agency.id, CASCADE)
- `name`: String(255), indexed
- `destination`: String(255)
- `duration_days`: Integer
- `duration_nights`: Integer
- `description`: Text, nullable
- `approximate_price`: Decimal(10, 2), nullable
- `status`: Enum("draft", "published"), default="draft", indexed
- `created_by`: UUID (FK → User.id, SET NULL)
- `created_at`: DateTime(UTC)
- `updated_at`: DateTime(UTC)
- **Index:** (agency_id, status)

**TemplateDay** (Day structure in a template)
- `id`: UUID (PK)
- `template_id`: UUID (FK → Template.id, CASCADE)
- `day_number`: Integer (1-indexed)
- `title`: String(255), nullable (e.g., "Arrival in Paris")
- `notes`: Text, nullable
- **Unique Constraint:** (template_id, day_number)

**TemplateDayActivity** (M2M: TemplateDay ↔ Activity with ordering)
- `id`: UUID (PK)
- `template_day_id`: UUID (FK → TemplateDay.id, CASCADE)
- `activity_id`: UUID (FK → Activity.id, RESTRICT) (prevent deletion if used)
- `display_order`: Integer, default=0
- `time_slot`: String(50), nullable (e.g., "09:00 AM", "Morning")
- `custom_notes`: Text, nullable (template-specific notes)
- **Unique Constraint:** (template_day_id, activity_id)

---

#### 2.1.4 Client Itineraries

**Itinerary** (Concrete trips for clients)
- `id`: UUID (PK)
- `agency_id`: UUID (FK → Agency.id, CASCADE)
- `template_id`: UUID (FK → Template.id, SET NULL) (track origin)
- `trip_name`: String(255), indexed
- `client_name`: String(255)
- `client_email`: String(255), nullable
- `client_phone`: String(50), nullable
- `destination`: String(255)
- `start_date`: Date
- `end_date`: Date
- `num_adults`: Integer, default=1
- `num_children`: Integer, default=0
- `status`: Enum("draft", "sent", "confirmed", "completed", "cancelled"), default="draft", indexed
- `total_price`: Decimal(10, 2), nullable
- `special_notes`: Text, nullable
- `created_by`: UUID (FK → User.id, SET NULL)
- `created_at`: DateTime(UTC)
- `updated_at`: DateTime(UTC)
- **Index:** (agency_id, status), (agency_id, start_date)

**ItineraryDay** (Actual dated days in itinerary)
- `id`: UUID (PK)
- `itinerary_id`: UUID (FK → Itinerary.id, CASCADE)
- `day_number`: Integer (1-indexed)
- `actual_date`: Date
- `title`: String(255), nullable
- `notes`: Text, nullable
- **Unique Constraint:** (itinerary_id, day_number)

**ItineraryDayActivity** (M2M: ItineraryDay ↔ Activity with customization)
- `id`: UUID (PK)
- `itinerary_day_id`: UUID (FK → ItineraryDay.id, CASCADE)
- `activity_id`: UUID (FK → Activity.id, RESTRICT)
- `display_order`: Integer, default=0
- `time_slot`: String(50), nullable
- `custom_notes`: Text, nullable (client-specific notes)
- `custom_price`: Decimal(10, 2), nullable (override base price)
- **Unique Constraint:** (itinerary_day_id, activity_id)

---

#### 2.1.5 Sharing & Export

**ShareLink** (Public access to itineraries)
- `id`: UUID (PK)
- `itinerary_id`: UUID (FK → Itinerary.id, CASCADE)
- `token`: String(100), unique, indexed (URL-safe random token)
- `is_active`: Boolean, default=True
- `live_updates_enabled`: Boolean, default=False
- `expires_at`: DateTime(UTC), nullable
- `view_count`: Integer, default=0
- `last_viewed_at`: DateTime(UTC), nullable
- `created_at`: DateTime(UTC)
- **Index:** (token, is_active)

**PDFExport** (Track PDF generation history)
- `id`: UUID (PK)
- `itinerary_id`: UUID (FK → Itinerary.id, CASCADE)
- `file_path`: String(500)
- `generated_by`: UUID (FK → User.id, SET NULL)
- `generated_at`: DateTime(UTC)

---

### 2.2 API Contract (FastAPI)

#### 2.2.1 API Structure

```
app/
├── main.py                      # FastAPI app initialization
├── core/
│   ├── config.py                # Settings (Pydantic BaseSettings)
│   ├── security.py              # JWT encode/decode, password hashing
│   └── deps.py                  # Dependency injection (DB, current user, permissions)
├── db/
│   ├── base.py                  # SQLAlchemy Base + imports
│   ├── session.py               # Database session management
│   └── init_db.py               # Initial data seeding (permissions, default roles)
├── models/                      # SQLAlchemy models
│   ├── __init__.py
│   ├── agency.py
│   ├── user.py
│   ├── role.py
│   ├── activity.py
│   ├── template.py
│   ├── itinerary.py
│   └── share.py
├── schemas/                     # Pydantic schemas (strict separation)
│   ├── __init__.py
│   ├── auth.py                  # Token, LoginRequest
│   ├── user.py                  # UserCreate, UserUpdate, UserResponse
│   ├── role.py                  # RoleCreate, RoleUpdate, RoleResponse, PermissionResponse
│   ├── activity.py              # ActivityCreate, ActivityUpdate, ActivityResponse
│   ├── template.py              # TemplateCreate, TemplateUpdate, TemplateResponse
│   ├── itinerary.py             # ItineraryCreate, ItineraryUpdate, ItineraryResponse
│   └── share.py                 # ShareLinkCreate, ShareLinkResponse, PublicItineraryResponse
├── api/
│   └── v1/
│       ├── endpoints/
│       │   ├── auth.py          # POST /login, /refresh, /forgot-password
│       │   ├── users.py         # CRUD for users
│       │   ├── roles.py         # CRUD for roles + permissions
│       │   ├── activity_types.py
│       │   ├── activities.py    # CRUD + semantic search
│       │   ├── templates.py     # CRUD + publish/draft
│       │   ├── itineraries.py   # CRUD + custom itinerary logic
│       │   ├── share.py         # Generate share links, PDF export
│       │   ├── public.py        # Public itinerary view (no auth)
│       │   └── websocket.py     # WebSocket endpoint for live preview
│       └── router.py            # Aggregate all routers
├── services/
│   ├── auth_service.py          # Authentication logic
│   ├── rbac_service.py          # Permission checking
│   ├── search_service.py        # ChromaDB integration + OpenAI embeddings
│   ├── template_service.py      # Template → Itinerary conversion logic
│   ├── pdf_service.py           # WeasyPrint PDF generation
│   └── websocket_service.py     # WebSocket connection manager
├── utils/
│   ├── file_storage.py          # Local file upload/retrieval
│   └── helpers.py
└── tests/
    ├── unit/
    │   ├── test_auth.py
    │   ├── test_rbac.py
    │   └── test_search.py
    └── integration/
        ├── test_itinerary_flow.py
        └── test_share_flow.py
```

---

#### 2.2.2 API Endpoints

| Method | Endpoint | Request Schema | Response Schema | Auth Required | Permission | Description |
|:-------|:---------|:--------------|:---------------|:--------------|:-----------|:------------|
| **Authentication** |
| POST | `/api/v1/auth/login` | `LoginRequest` | `TokenResponse` | No | - | User login |
| POST | `/api/v1/auth/refresh` | `RefreshRequest` | `TokenResponse` | No | - | Refresh JWT |
| POST | `/api/v1/auth/forgot-password` | `ForgotPasswordRequest` | `MessageResponse` | No | - | Send reset link |
| POST | `/api/v1/auth/reset-password` | `ResetPasswordRequest` | `MessageResponse` | No | - | Reset password |
| **Users** |
| GET | `/api/v1/users` | - | `List[UserResponse]` | Yes | `users.view` | List all users in agency |
| POST | `/api/v1/users` | `UserCreate` | `UserResponse` | Yes | `users.create` | Create new user |
| GET | `/api/v1/users/{id}` | - | `UserResponse` | Yes | `users.view` | Get user by ID |
| PUT | `/api/v1/users/{id}` | `UserUpdate` | `UserResponse` | Yes | `users.edit` | Update user |
| DELETE | `/api/v1/users/{id}` | - | `MessageResponse` | Yes | `users.delete` | Delete user |
| **Roles** |
| GET | `/api/v1/roles` | - | `List[RoleResponse]` | Yes | `roles.view` | List all roles |
| POST | `/api/v1/roles` | `RoleCreate` | `RoleResponse` | Yes | `roles.create` | Create role |
| GET | `/api/v1/roles/{id}` | - | `RoleResponse` | Yes | `roles.view` | Get role with permissions |
| PUT | `/api/v1/roles/{id}` | `RoleUpdate` | `RoleResponse` | Yes | `roles.edit` | Update role |
| DELETE | `/api/v1/roles/{id}` | - | `MessageResponse` | Yes | `roles.delete` | Delete role |
| GET | `/api/v1/permissions` | - | `List[PermissionResponse]` | Yes | `roles.view` | List all system permissions |
| **Activity Types** |
| GET | `/api/v1/activity-types` | - | `List[ActivityTypeResponse]` | Yes | `activities.view` | List activity types |
| POST | `/api/v1/activity-types` | `ActivityTypeCreate` | `ActivityTypeResponse` | Yes | `activities.create` | Create type |
| **Activities** |
| GET | `/api/v1/activities` | Query params | `List[ActivityResponse]` | Yes | `activities.view` | List/filter activities |
| POST | `/api/v1/activities/search` | `ActivitySearchRequest` | `List[ActivityResponse]` | Yes | `activities.view` | Semantic search |
| POST | `/api/v1/activities` | `ActivityCreate` | `ActivityResponse` | Yes | `activities.create` | Create activity |
| GET | `/api/v1/activities/{id}` | - | `ActivityResponse` | Yes | `activities.view` | Get activity |
| PUT | `/api/v1/activities/{id}` | `ActivityUpdate` | `ActivityResponse` | Yes | `activities.edit` | Update activity |
| DELETE | `/api/v1/activities/{id}` | - | `MessageResponse` | Yes | `activities.delete` | Delete activity |
| POST | `/api/v1/activities/{id}/images` | `FormData` | `ActivityImageResponse` | Yes | `activities.edit` | Upload image |
| **Templates** |
| GET | `/api/v1/templates` | Query params | `List[TemplateResponse]` | Yes | `templates.view` | List templates |
| POST | `/api/v1/templates` | `TemplateCreate` | `TemplateResponse` | Yes | `templates.create` | Create template |
| GET | `/api/v1/templates/{id}` | - | `TemplateDetailResponse` | Yes | `templates.view` | Get template with days |
| PUT | `/api/v1/templates/{id}` | `TemplateUpdate` | `TemplateResponse` | Yes | `templates.edit` | Update template |
| POST | `/api/v1/templates/{id}/publish` | - | `TemplateResponse` | Yes | `templates.edit` | Publish template |
| DELETE | `/api/v1/templates/{id}` | - | `MessageResponse` | Yes | `templates.delete` | Delete template |
| **Itineraries** |
| GET | `/api/v1/itineraries` | Query params | `List[ItineraryResponse]` | Yes | `itineraries.view` | List itineraries |
| POST | `/api/v1/itineraries` | `ItineraryCreate` | `ItineraryResponse` | Yes | `itineraries.create` | Create from template/scratch |
| GET | `/api/v1/itineraries/{id}` | - | `ItineraryDetailResponse` | Yes | `itineraries.view` | Get itinerary with days |
| PUT | `/api/v1/itineraries/{id}` | `ItineraryUpdate` | `ItineraryResponse` | Yes | `itineraries.edit` | Update itinerary |
| DELETE | `/api/v1/itineraries/{id}` | - | `MessageResponse` | Yes | `itineraries.delete` | Delete itinerary |
| **Sharing** |
| POST | `/api/v1/itineraries/{id}/share` | `ShareLinkCreate` | `ShareLinkResponse` | Yes | `itineraries.share` | Generate share link |
| PUT | `/api/v1/share-links/{id}` | `ShareLinkUpdate` | `ShareLinkResponse` | Yes | `itineraries.share` | Update share settings |
| POST | `/api/v1/itineraries/{id}/export-pdf` | - | `PDFExportResponse` | Yes | `itineraries.export` | Generate PDF |
| **Public** |
| GET | `/api/v1/public/itinerary/{token}` | - | `PublicItineraryResponse` | No | - | View public itinerary |
| **WebSocket** |
| WS | `/api/v1/ws/itinerary/{token}` | - | JSON messages | No | - | Live preview updates |

---

### 2.3 Frontend Modules

#### 2.3.1 Frontend Structure

```
src/
├── main.tsx                     # App entry point
├── App.tsx                      # Root component with routing
├── api/
│   ├── client.ts                # Axios instance with JWT interceptor
│   ├── auth.ts                  # Auth API calls
│   ├── users.ts
│   ├── roles.ts
│   ├── activities.ts
│   ├── templates.ts
│   ├── itineraries.ts
│   └── share.ts
├── components/
│   ├── ui/                      # Atomic reusable components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Chip.tsx             # Status pills
│   │   ├── ImageUploader.tsx
│   │   └── DatePicker.tsx
│   └── layout/
│       ├── AppShell.tsx         # Main layout with sidebar
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── AuthLayout.tsx       # Centered card layout for login
├── features/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   ├── dashboard/
│   │   └── Dashboard.tsx        # Summary cards + recent items
│   ├── users/
│   │   ├── UserList.tsx
│   │   └── UserForm.tsx
│   ├── roles/
│   │   ├── RoleList.tsx
│   │   └── RoleForm.tsx         # Permissions matrix
│   ├── activities/
│   │   ├── ActivityList.tsx
│   │   ├── ActivityForm.tsx
│   │   └── ActivitySearch.tsx   # Semantic search component
│   ├── templates/
│   │   ├── TemplateList.tsx
│   │   └── TemplateBuilder.tsx  # Day-wise editor
│   ├── itineraries/
│   │   ├── ItineraryList.tsx
│   │   ├── ItineraryWizard.tsx  # Step 1: Template, Step 2: Client/Dates
│   │   ├── ItineraryEditor.tsx  # Main day-wise editor
│   │   ├── ItineraryPreview.tsx # Internal preview
│   │   └── ShareModal.tsx       # Share/export controls
│   └── public/
│       └── PublicItinerary.tsx  # Client-facing view
├── hooks/
│   ├── useAuth.ts               # Access auth state from Zustand
│   ├── usePermissions.ts        # Check user permissions
│   ├── useWebSocket.ts          # WebSocket connection management
│   ├── useActivities.ts         # Fetch/search activities
│   ├── useTemplates.ts
│   └── useItineraries.ts
├── store/                       # Zustand stores
│   ├── authStore.ts             # User, token, agency
│   ├── itineraryStore.ts        # Current editing itinerary state
│   └── wsStore.ts               # WebSocket connection state
├── types/
│   └── index.ts                 # TypeScript interfaces matching API schemas
├── utils/
│   ├── rbac.ts                  # Helper: hasPermission(user, 'module.action')
│   ├── dateHelpers.ts
│   └── formatters.ts
├── routes/
│   └── index.tsx                # React Router setup with protected routes
└── styles/
    └── index.css                # Tailwind imports + global styles
```

---

#### 2.3.2 Key Frontend Features

**State Management (Zustand)**

Given the complexity (multi-step forms, real-time updates, nested day/activity editing), Zustand is chosen over Context API for:
- Minimal boilerplate
- No provider hell
- DevTools support
- Better performance with selective subscriptions

**Stores:**
1. `authStore`: user, token, agency, login/logout actions
2. `itineraryStore`: currentItinerary, days, activities, add/remove/reorder actions
3. `wsStore`: connection status, subscribed itinerary, message handler

**Permission-Based UI**

Component pattern:
```tsx
<ProtectedRoute permission="itineraries.create">
  <CreateItineraryButton />
</ProtectedRoute>
```

Hook pattern:
```tsx
const { hasPermission } = usePermissions();
{hasPermission('templates.edit') && <EditButton />}
```

**WebSocket Integration**

`useWebSocket` hook:
- Connects to `/ws/itinerary/{token}` when PublicItinerary component mounts
- Automatically reconnects on disconnect
- Updates itinerary state when broadcast received
- Shows toast: "Updated just now"

---

### 2.4 ChromaDB Integration (Semantic Search)

#### 2.4.1 Architecture

**Service:** `SearchService` in `app/services/search_service.py`

**Collection Naming:** `activities_{agency_id}` (multi-tenant isolation)

**Workflow:**

1. **Activity Creation/Update:**
   ```python
   # In ActivityCreate/Update endpoint
   → Generate embedding from: f"{name} {short_description} {highlights}"
   → Call OpenAI Embeddings API
   → Upsert to ChromaDB collection with metadata:
      {
        "activity_id": str(activity.id),
        "activity_type": activity_type.name,
        "location": activity.location,
        "tags": activity.tags
      }
   ```

2. **Semantic Search:**
   ```python
   # POST /activities/search with query="romantic sunset cruise"
   → Generate query embedding via OpenAI
   → Query ChromaDB: collection.query(query_embeddings=[...], n_results=20)
   → ChromaDB returns activity_ids + similarity scores
   → Fetch full Activity objects from DB (WHERE id IN (...))
   → Return sorted by similarity
   ```

3. **Fallback Strategy:**
   - If OpenAI API fails: fallback to SQL LIKE search on name/description
   - If ChromaDB collection empty: return empty results + error message

#### 2.4.2 Implementation Details

**Dependencies:**
- `chromadb` (persistent client)
- `openai` (embeddings API)

**Configuration (config.py):**
```python
OPENAI_API_KEY: str
CHROMADB_PERSIST_DIR: str = "./chroma_data"
EMBEDDING_MODEL: str = "text-embedding-3-small"
```

**Indexing Strategy:**
- Async background task after activity create/update (non-blocking)
- Batch re-indexing script for existing activities

**Limitations:**
- Max 1000 activities per agency (as specified)
- Embedding cost: ~$0.00002 per activity (negligible)

---

### 2.5 WebSocket Architecture (Live Preview)

#### 2.5.1 Connection Manager

**Service:** `WebSocketService` in `app/services/websocket_service.py`

**Pattern:** Channel-based pub/sub

```python
class ConnectionManager:
    active_connections: Dict[str, List[WebSocket]]  # {itinerary_token: [ws1, ws2, ...]}

    async def connect(token: str, websocket: WebSocket)
    async def disconnect(token: str, websocket: WebSocket)
    async def broadcast(token: str, message: dict)
```

#### 2.5.2 Flow

1. **Client Opens Public Itinerary:**
   - Frontend checks if `live_updates_enabled` from API response
   - If true, connect WebSocket: `ws://api/v1/ws/itinerary/{token}`
   - Send initial message: `{"action": "subscribe", "token": "..."}`

2. **Creator Edits Itinerary:**
   - PUT `/itineraries/{id}` saves changes to DB
   - If associated ShareLink has `live_updates_enabled=True`:
     - Call `websocket_service.broadcast(token, updated_itinerary_data)`
   - All connected clients receive JSON message
   - Frontend updates state + shows toast

3. **Client Disconnects:**
   - WebSocket cleanup on unmount
   - Reconnect logic with exponential backoff

#### 2.5.3 Message Format

**From Server to Client:**
```json
{
  "type": "itinerary_updated",
  "data": {
    "itinerary": {...},  // Full ItineraryDetailResponse
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

**Security:**
- Token validation on WebSocket handshake
- No authentication required (public share link)
- Rate limiting on broadcast frequency (debounce 500ms)

---

### 2.6 PDF Generation (WeasyPrint)

#### 2.6.1 Service

**Service:** `PDFService` in `app/services/pdf_service.py`

**Workflow:**
1. Fetch full itinerary with all relationships (days, activities, images)
2. Render HTML template using Jinja2 with itinerary data
3. Convert HTML → PDF using WeasyPrint
4. Save to local filesystem: `./pdfs/{agency_id}/{itinerary_id}_{timestamp}.pdf`
5. Store reference in `PDFExport` table
6. Return file path for download

#### 2.6.2 Template Design

**Jinja2 Template:** `templates/pdf/itinerary.html`

**Styling:**
- Inline CSS (Tailwind classes won't work in PDF)
- Use color palette from design system
- Page breaks after each day
- Image embedding via base64 or file paths

**Dependencies:**
- `weasyprint`
- `jinja2`

**Configuration:**
```python
PDF_STORAGE_DIR: str = "./pdfs"
PDF_LOGO_PATH: str = "./static/logo.png"
```

---

### 2.7 Multi-Tenancy & Security

#### 2.7.1 Data Isolation

**Strategy:** Agency-scoped queries

Every DB query MUST filter by `agency_id` from current authenticated user:

```python
# Dependency in deps.py
def get_current_agency_id(current_user: User = Depends(get_current_user)) -> UUID:
    return current_user.agency_id

# In endpoint
def get_activities(
    agency_id: UUID = Depends(get_current_agency_id),
    db: Session = Depends(get_db)
):
    return db.query(Activity).filter(Activity.agency_id == agency_id).all()
```

**Validation:**
- Never trust client-provided `agency_id`
- Always derive from JWT token → User.agency_id

#### 2.7.2 RBAC Enforcement

**Permission Dependency:**

```python
# deps.py
def require_permission(permission: str):
    def dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if not rbac_service.has_permission(current_user, permission, db):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return dependency

# Usage in endpoint
@router.post("/itineraries")
def create_itinerary(
    data: ItineraryCreate,
    current_user: User = Depends(require_permission("itineraries.create")),
    db: Session = Depends(get_db)
):
    ...
```

**Permission Check Logic (rbac_service.py):**
```python
def has_permission(user: User, codename: str, db: Session) -> bool:
    if user.is_superuser:  # Agency admin bypass
        return True

    # Get user roles → role permissions
    permissions = db.query(Permission).join(RolePermission).join(Role).join(UserRole).filter(
        UserRole.user_id == user.id,
        Permission.codename == codename
    ).first()

    return permissions is not None
```

#### 2.7.3 JWT Token Structure

**Payload:**
```json
{
  "sub": "user_id",
  "agency_id": "agency_uuid",
  "email": "user@example.com",
  "exp": 1234567890
}
```

**Token Types:**
- Access Token: 30 min expiry
- Refresh Token: 7 day expiry (stored in httpOnly cookie for production)

---

### 2.8 File Storage (Local Filesystem)

**Structure:**
```
./uploads/
  ├── agencies/
  │   └── {agency_id}/
  │       ├── activities/
  │       │   └── {activity_id}/
  │       │       ├── image1.jpg
  │       │       └── image2.jpg
  │       └── logos/
  │           └── logo.png
./pdfs/
  └── {agency_id}/
      └── {itinerary_id}_{timestamp}.pdf
```

**Upload Endpoint:**
```python
POST /activities/{id}/images
Content-Type: multipart/form-data

→ Validate file type (jpg, png, webp)
→ Generate unique filename: f"{uuid4()}.{extension}"
→ Save to ./uploads/agencies/{agency_id}/activities/{activity_id}/
→ Create ActivityImage record with file_path
```

**Serving Files:**
```python
# Static file mount in main.py
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# URL in response: http://api/uploads/agencies/{id}/activities/{id}/image.jpg
```

---

## 3. Implementation Details

### 3.1 Initial Data Seeding

**Script:** `app/db/init_db.py`

**Seed Data:**
1. **System Permissions:** All module.action combinations
   ```python
   modules = ["users", "roles", "activities", "templates", "itineraries"]
   actions = ["view", "create", "edit", "delete", "export", "share"]
   → Generate 30 permissions (not all combinations valid, filter as needed)
   ```

2. **Demo Agency + Admin User:**
   - Agency: "Demo Travel Agency"
   - User: admin@demo.com / password: (hashed)
   - Role: "Agency Admin" with all permissions
   - Assign role to user

### 3.2 Template → Itinerary Conversion

**Service:** `TemplateService.create_itinerary_from_template()`

**Logic:**
1. Fetch template with all TemplateDay + TemplateDayActivity
2. Create Itinerary record with client details + dates
3. For each TemplateDay:
   - Calculate actual_date: start_date + (day_number - 1)
   - Create ItineraryDay
   - Copy all TemplateDayActivity → ItineraryDayActivity
4. Return created itinerary

**Date Mapping Example:**
- Template: 4N/5D (Day 1, 2, 3, 4, 5)
- Client start_date: 2025-06-01
- Itinerary Days:
  - Day 1 → 2025-06-01
  - Day 2 → 2025-06-02
  - ...
  - Day 5 → 2025-06-05

### 3.3 Image Handling

**Upload Flow:**
1. Client uploads via `<ImageUploader />` component
2. POST `/activities/{id}/images` with FormData
3. Backend validates, saves to filesystem, creates DB record
4. Returns `ActivityImageResponse` with `file_path`
5. Frontend displays using `<img src={API_URL + file_path} />`

**Display in PDF:**
- WeasyPrint supports file paths and base64
- Use file paths: `<img src="./uploads/..." />`

### 3.4 Search UX

**Frontend Component:** `ActivitySearch.tsx`

**Features:**
- Debounced input (500ms)
- Loading spinner during search
- Results grid with similarity scores (if semantic)
- Fallback message if no results
- Click to add activity to template/itinerary

**API Call:**
```typescript
const results = await api.activities.search({
  query: "romantic sunset cruise",
  limit: 20
});
```

### 3.5 Error Handling

**Backend:**
- Custom exception handlers in `main.py`
- Structured error responses:
  ```json
  {
    "detail": "Activity not found",
    "error_code": "ACTIVITY_NOT_FOUND"
  }
  ```

**Frontend:**
- Axios interceptor for 401 (redirect to login)
- Toast notifications for errors
- Form validation with error messages

### 3.6 Testing Strategy

**Unit Tests:**
- `test_auth.py`: JWT generation, password hashing
- `test_rbac.py`: Permission checking logic
- `test_search.py`: Embedding generation, ChromaDB queries

**Integration Tests:**
- `test_itinerary_flow.py`: Create template → Create itinerary → Edit → Share
- `test_share_flow.py`: Generate link → Access public page → PDF export

**Tools:**
- `pytest` (backend)
- `pytest-asyncio` (async tests)
- `httpx` (API client for tests)
- Mock OpenAI API calls in tests

**Coverage Target:** 70%+ for services and endpoints

---

## 4. Deployment Considerations (Future Phases)

**Not included in initial plan, but architecture supports:**

1. **Database Migration:**
   - SQLite → PostgreSQL (change driver, minimal code change)
   - Add Alembic for schema migrations

2. **Containerization:**
   - Dockerfile for FastAPI app
   - docker-compose with backend + ChromaDB container

3. **Cloud Storage:**
   - Replace local filesystem with S3/R2
   - Update `file_storage.py` with cloud SDK

4. **Scaling:**
   - Horizontal scaling with load balancer
   - Redis for WebSocket connection state (multi-server)
   - Celery for async tasks (PDF generation, embeddings)

5. **Monitoring:**
   - Sentry for error tracking
   - Prometheus + Grafana for metrics
   - Logging with structured JSON

---

## 5. Technology Checklist

### Backend
- [x] FastAPI
- [x] SQLAlchemy (SQLite driver)
- [x] Pydantic (validation)
- [x] python-jose (JWT)
- [x] passlib (bcrypt)
- [x] ChromaDB
- [x] openai (embeddings)
- [x] WeasyPrint
- [x] Jinja2
- [x] python-multipart (file uploads)
- [x] pytest + httpx

### Frontend
- [x] React 18
- [x] TypeScript
- [x] Vite (build tool)
- [x] React Router
- [x] Zustand (state management)
- [x] Axios (HTTP client)
- [x] Tailwind CSS
- [x] date-fns (date utilities)
- [x] react-hook-form (form handling)
- [x] zod (validation)
- [x] react-toastify (notifications)

---

## 6. Key Design Decisions Summary

| Decision | Choice | Rationale |
|:---------|:-------|:----------|
| Database | SQLite | Simplicity for MVP; easy migration to PostgreSQL later |
| Vector DB | ChromaDB | Lightweight, embeddable, perfect for 1000 activities/agency |
| Embeddings | OpenAI | Best quality, cost-effective for low volume |
| Real-time | WebSocket | Full-duplex needed for potential future client interactions |
| PDF | WeasyPrint | Python-native, good CSS support, handles images well |
| Auth | JWT | Stateless, scalable, standard for SPAs |
| State Mgmt | Zustand | Simpler than Redux, better than Context for complex state |
| File Storage | Local FS | MVP simplicity; abstracted for easy cloud migration |
| Testing | pytest | Industry standard for Python, great async support |

---

## 7. Open Questions / Future Enhancements

**Not in initial scope, but document for later:**

1. **Email Service:** Password reset emails (use SMTP or service like SendGrid)
2. **Client Feedback:** Allow clients to comment on itinerary items (requires auth or magic links)
3. **Multi-language:** i18n support for itineraries
4. **Mobile App:** React Native or PWA
5. **Analytics:** Track which activities are most used, template popularity
6. **Pricing Calculator:** Auto-calculate itinerary total from activity prices
7. **Calendar Integration:** Export to Google Calendar / iCal
8. **Approval Workflow:** Multi-step approval for itineraries before sharing

---

**End of Plan Document**

This plan serves as the single source of truth for architecture and implementation. All code must align with this specification. Update this document when requirements change.
