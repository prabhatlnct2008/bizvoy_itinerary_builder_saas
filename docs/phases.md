# Project Status: Travel SaaS Itinerary Builder

**Current Phase:** Not Started

**Last Updated:** 2025-01-25

---

## Phase 0: Project Setup & Configuration

**Goal:** Initialize project structure, dependencies, and development environment.

### Backend Setup
- [ ] Create FastAPI project structure
- [ ] Setup `pyproject.toml` or `requirements.txt` with dependencies:
  - [ ] fastapi
  - [ ] uvicorn[standard]
  - [ ] sqlalchemy
  - [ ] pydantic
  - [ ] pydantic-settings
  - [ ] python-jose[cryptography]
  - [ ] passlib[bcrypt]
  - [ ] python-multipart
  - [ ] chromadb
  - [ ] openai
  - [ ] weasyprint
  - [ ] jinja2
  - [ ] pytest
  - [ ] pytest-asyncio
  - [ ] httpx
- [ ] Create directory structure as per plan.md
- [ ] Setup `.env` file for configuration
- [ ] Create `app/core/config.py` with BaseSettings
- [ ] Initialize SQLite database file
- [ ] Create `app/db/base.py` with SQLAlchemy Base
- [ ] Create `app/db/session.py` for DB session management

### Frontend Setup
- [ ] Initialize React + TypeScript project with Vite
- [ ] Install dependencies:
  - [ ] react
  - [ ] react-dom
  - [ ] react-router-dom
  - [ ] zustand
  - [ ] axios
  - [ ] tailwindcss
  - [ ] date-fns
  - [ ] react-hook-form
  - [ ] zod
  - [ ] react-toastify
  - [ ] @types/* (TypeScript types)
- [ ] Configure Tailwind CSS
- [ ] Setup directory structure as per plan.md
- [ ] Create `.env` file for API URL
- [ ] Configure Axios client with base URL

### Version Control
- [ ] Initialize Git repository
- [ ] Create `.gitignore` (exclude .env, __pycache__, node_modules, etc.)
- [ ] Initial commit

---

## Phase 1: Core Backend - Auth & Tenancy

**Goal:** Implement authentication system with multi-tenant support.

### Database Models
- [ ] Create `app/models/agency.py` (Agency model)
- [ ] Create `app/models/user.py` (User model)
- [ ] Create database initialization script
- [ ] Test database creation and tables

### Security & Auth
- [ ] Implement `app/core/security.py`:
  - [ ] Password hashing functions (bcrypt)
  - [ ] JWT token creation and verification
  - [ ] Token expiry handling
- [ ] Create `app/schemas/auth.py`:
  - [ ] LoginRequest
  - [ ] TokenResponse
  - [ ] RefreshRequest
- [ ] Create `app/schemas/user.py`:
  - [ ] UserCreate
  - [ ] UserUpdate
  - [ ] UserResponse

### Dependencies
- [ ] Create `app/core/deps.py`:
  - [ ] `get_db()` - database session dependency
  - [ ] `get_current_user()` - JWT validation dependency
  - [ ] `get_current_agency_id()` - extract agency from user

### Auth Endpoints
- [ ] Create `app/api/v1/endpoints/auth.py`:
  - [ ] POST `/login` - user authentication
  - [ ] POST `/refresh` - token refresh
  - [ ] POST `/forgot-password` - send reset link (stub for now)
  - [ ] POST `/reset-password` - password reset (stub for now)
- [ ] Create `app/api/v1/router.py` - aggregate routers
- [ ] Update `app/main.py` - mount API router

### Testing
- [ ] Write `tests/unit/test_auth.py`:
  - [ ] Test password hashing
  - [ ] Test JWT creation and decoding
  - [ ] Test login endpoint
- [ ] Run tests and verify all pass

---

## Phase 2: RBAC (Roles & Permissions)

**Goal:** Implement role-based access control system.

### Database Models
- [ ] Create `app/models/role.py`:
  - [ ] Role model
  - [ ] Permission model
  - [ ] RolePermission model
  - [ ] UserRole model
- [ ] Create database migration for new tables

### Seed Data
- [ ] Create `app/db/init_db.py`:
  - [ ] Seed system permissions (module.action combinations)
  - [ ] Create demo agency with admin user
  - [ ] Create default "Agency Admin" role with all permissions
- [ ] Run seed script and verify data

### Schemas
- [ ] Create `app/schemas/role.py`:
  - [ ] PermissionResponse
  - [ ] RoleCreate
  - [ ] RoleUpdate
  - [ ] RoleResponse (with permissions)
- [ ] Update `app/schemas/user.py`:
  - [ ] Add roles to UserResponse

### RBAC Service
- [ ] Create `app/services/rbac_service.py`:
  - [ ] `has_permission(user, codename, db)` - check if user has permission
  - [ ] `get_user_permissions(user, db)` - get all user permissions
- [ ] Create permission dependency in `app/core/deps.py`:
  - [ ] `require_permission(permission: str)` - dependency factory

### Endpoints
- [ ] Create `app/api/v1/endpoints/roles.py`:
  - [ ] GET `/roles` - list all roles (permission: roles.view)
  - [ ] POST `/roles` - create role (permission: roles.create)
  - [ ] GET `/roles/{id}` - get role with permissions
  - [ ] PUT `/roles/{id}` - update role (permission: roles.edit)
  - [ ] DELETE `/roles/{id}` - delete role (permission: roles.delete)
  - [ ] GET `/permissions` - list all system permissions
- [ ] Create `app/api/v1/endpoints/users.py`:
  - [ ] GET `/users` - list users (permission: users.view)
  - [ ] POST `/users` - create user (permission: users.create)
  - [ ] GET `/users/{id}` - get user
  - [ ] PUT `/users/{id}` - update user (permission: users.edit)
  - [ ] DELETE `/users/{id}` - delete user (permission: users.delete)

### Testing
- [ ] Write `tests/unit/test_rbac.py`:
  - [ ] Test permission checking logic
  - [ ] Test role assignment
- [ ] Write `tests/integration/test_roles.py`:
  - [ ] Test role CRUD operations
  - [ ] Test permission enforcement on endpoints

---

## Phase 3: Activity Library & Semantic Search

**Goal:** Build activity catalog with AI-powered search.

### Database Models
- [ ] Create `app/models/activity.py`:
  - [ ] ActivityType model
  - [ ] Activity model
  - [ ] ActivityImage model

### Schemas
- [ ] Create `app/schemas/activity.py`:
  - [ ] ActivityTypeCreate, ActivityTypeResponse
  - [ ] ActivityCreate, ActivityUpdate, ActivityResponse
  - [ ] ActivityImageResponse
  - [ ] ActivitySearchRequest (query, limit)

### ChromaDB Integration
- [ ] Create `app/services/search_service.py`:
  - [ ] Initialize ChromaDB persistent client
  - [ ] `get_or_create_collection(agency_id)` - create agency collection
  - [ ] `generate_embedding(text)` - call OpenAI API
  - [ ] `index_activity(activity)` - add/update activity in ChromaDB
  - [ ] `search_activities(agency_id, query, limit)` - semantic search
  - [ ] `delete_activity(activity_id)` - remove from ChromaDB
- [ ] Add OpenAI API key to config
- [ ] Add ChromaDB persist directory to config

### File Storage
- [ ] Create `app/utils/file_storage.py`:
  - [ ] `save_upload(file, agency_id, category, entity_id)` - save file to disk
  - [ ] `delete_file(file_path)` - remove file
  - [ ] `get_file_url(file_path)` - generate URL
- [ ] Create uploads directory structure
- [ ] Mount static files in main.py

### Endpoints
- [ ] Create `app/api/v1/endpoints/activity_types.py`:
  - [ ] GET `/activity-types` - list types
  - [ ] POST `/activity-types` - create type
- [ ] Create `app/api/v1/endpoints/activities.py`:
  - [ ] GET `/activities` - list/filter activities
  - [ ] POST `/activities/search` - semantic search (NEW)
  - [ ] POST `/activities` - create activity + index in ChromaDB
  - [ ] GET `/activities/{id}` - get activity details
  - [ ] PUT `/activities/{id}` - update activity + re-index
  - [ ] DELETE `/activities/{id}` - delete activity + remove from ChromaDB
  - [ ] POST `/activities/{id}/images` - upload image

### Testing
- [ ] Write `tests/unit/test_search.py`:
  - [ ] Mock OpenAI API
  - [ ] Test embedding generation
  - [ ] Test ChromaDB indexing and search
- [ ] Write `tests/integration/test_activities.py`:
  - [ ] Test activity CRUD
  - [ ] Test semantic search flow
  - [ ] Test image upload

---

## Phase 4: Itinerary Templates

**Goal:** Enable creation and management of reusable itinerary templates.

### Database Models
- [ ] Create `app/models/template.py`:
  - [ ] Template model
  - [ ] TemplateDay model
  - [ ] TemplateDayActivity model (M2M with ordering)

### Schemas
- [ ] Create `app/schemas/template.py`:
  - [ ] TemplateDayActivityCreate (activity_id, display_order, time_slot, notes)
  - [ ] TemplateDayCreate (day_number, title, notes, activities)
  - [ ] TemplateCreate (name, destination, duration, days)
  - [ ] TemplateUpdate
  - [ ] TemplateDayResponse
  - [ ] TemplateResponse (basic info)
  - [ ] TemplateDetailResponse (with full days and activities)

### Endpoints
- [ ] Create `app/api/v1/endpoints/templates.py`:
  - [ ] GET `/templates` - list templates (filter by status)
  - [ ] POST `/templates` - create template
  - [ ] GET `/templates/{id}` - get template with full day structure
  - [ ] PUT `/templates/{id}` - update template (replace days/activities)
  - [ ] POST `/templates/{id}/publish` - change status to published
  - [ ] DELETE `/templates/{id}` - delete template (check if used in itineraries)

### Testing
- [ ] Write `tests/integration/test_templates.py`:
  - [ ] Test template creation with nested days
  - [ ] Test template update
  - [ ] Test publish flow
  - [ ] Test deletion constraints

---

## Phase 5: Client Itineraries

**Goal:** Create customized itineraries for clients from templates or scratch.

### Database Models
- [ ] Create `app/models/itinerary.py`:
  - [ ] Itinerary model
  - [ ] ItineraryDay model
  - [ ] ItineraryDayActivity model (M2M with custom fields)

### Schemas
- [ ] Create `app/schemas/itinerary.py`:
  - [ ] ItineraryDayActivityCreate
  - [ ] ItineraryDayCreate
  - [ ] ItineraryCreate (template_id optional, client info, dates)
  - [ ] ItineraryUpdate
  - [ ] ItineraryDayResponse
  - [ ] ItineraryResponse (list view)
  - [ ] ItineraryDetailResponse (full structure)

### Template Service
- [ ] Create `app/services/template_service.py`:
  - [ ] `create_itinerary_from_template(template_id, itinerary_data, db)`:
    - [ ] Fetch template with all days and activities
    - [ ] Create Itinerary record
    - [ ] Map template days to actual dates
    - [ ] Copy all activities to itinerary days
    - [ ] Return created itinerary

### Endpoints
- [ ] Create `app/api/v1/endpoints/itineraries.py`:
  - [ ] GET `/itineraries` - list itineraries (filters: status, destination, dates)
  - [ ] POST `/itineraries` - create from template or scratch
  - [ ] GET `/itineraries/{id}` - get full itinerary structure
  - [ ] PUT `/itineraries/{id}` - update itinerary (modify days/activities)
  - [ ] DELETE `/itineraries/{id}` - delete itinerary

### Testing
- [ ] Write `tests/integration/test_itinerary_flow.py`:
  - [ ] Test creating itinerary from template
  - [ ] Test date mapping logic
  - [ ] Test creating itinerary from scratch
  - [ ] Test updating itinerary (add/remove activities)

---

## Phase 6: Sharing, PDF Export & WebSocket

**Goal:** Enable sharing itineraries with clients and live preview.

### Database Models
- [ ] Create `app/models/share.py`:
  - [ ] ShareLink model
  - [ ] PDFExport model

### Schemas
- [ ] Create `app/schemas/share.py`:
  - [ ] ShareLinkCreate (live_updates_enabled, expires_at)
  - [ ] ShareLinkUpdate
  - [ ] ShareLinkResponse
  - [ ] PDFExportResponse
  - [ ] PublicItineraryResponse (sanitized for client view)

### PDF Service
- [ ] Create `app/services/pdf_service.py`:
  - [ ] `generate_pdf(itinerary_id, db)`:
    - [ ] Fetch full itinerary data
    - [ ] Render Jinja2 template
    - [ ] Convert to PDF using WeasyPrint
    - [ ] Save to filesystem
    - [ ] Create PDFExport record
    - [ ] Return file path
- [ ] Create `app/templates/pdf/itinerary.html`:
  - [ ] Design PDF layout with inline CSS
  - [ ] Day-by-day structure
  - [ ] Include images
  - [ ] Agency branding
- [ ] Create PDF storage directory

### WebSocket Service
- [ ] Create `app/services/websocket_service.py`:
  - [ ] `ConnectionManager` class:
    - [ ] `active_connections: Dict[str, List[WebSocket]]`
    - [ ] `connect(token, websocket)`
    - [ ] `disconnect(token, websocket)`
    - [ ] `broadcast(token, message)`
- [ ] Create `app/api/v1/endpoints/websocket.py`:
  - [ ] WS `/ws/itinerary/{token}` - WebSocket endpoint
  - [ ] Validate token on connection
  - [ ] Handle subscribe/unsubscribe messages
  - [ ] Keep connection alive

### Share Endpoints
- [ ] Create `app/api/v1/endpoints/share.py`:
  - [ ] POST `/itineraries/{id}/share` - generate share link
  - [ ] PUT `/share-links/{id}` - update share settings
  - [ ] POST `/itineraries/{id}/export-pdf` - generate PDF
  - [ ] GET `/pdfs/{agency_id}/{filename}` - download PDF
- [ ] Create `app/api/v1/endpoints/public.py`:
  - [ ] GET `/public/itinerary/{token}` - view itinerary (no auth)
  - [ ] Increment view count
  - [ ] Check expiry and active status

### Integration
- [ ] Modify itinerary update endpoint:
  - [ ] After saving changes, check if ShareLink exists with live_updates=True
  - [ ] If yes, broadcast update via WebSocket

### Testing
- [ ] Write `tests/integration/test_share_flow.py`:
  - [ ] Test share link generation
  - [ ] Test public itinerary access
  - [ ] Test PDF generation
- [ ] Write `tests/integration/test_websocket.py`:
  - [ ] Test WebSocket connection
  - [ ] Test broadcast on itinerary update
  - [ ] Test multiple clients

---

## Phase 7: Frontend Core - Auth & Layout

**Goal:** Build authentication and base layout for the app.

### API Client Setup
- [ ] Create `src/api/client.ts`:
  - [ ] Axios instance with base URL
  - [ ] Request interceptor to add JWT token
  - [ ] Response interceptor for 401 handling
- [ ] Create `src/api/auth.ts`:
  - [ ] `login(email, password)`
  - [ ] `refreshToken()`
  - [ ] `forgotPassword(email)`

### State Management
- [ ] Create `src/store/authStore.ts` (Zustand):
  - [ ] State: user, token, agency, isAuthenticated
  - [ ] Actions: login, logout, setUser, refreshToken
  - [ ] Persist token in localStorage

### Types
- [ ] Create `src/types/index.ts`:
  - [ ] User, Agency, Token interfaces
  - [ ] Match backend schemas

### Auth Pages
- [ ] Create `src/features/auth/Login.tsx`:
  - [ ] Login form with email/password
  - [ ] Error handling
  - [ ] Redirect to dashboard on success
- [ ] Create `src/features/auth/ForgotPassword.tsx`:
  - [ ] Email input form
  - [ ] Success message

### Layout Components
- [ ] Create `src/components/ui/Button.tsx` - reusable button
- [ ] Create `src/components/ui/Input.tsx` - reusable input
- [ ] Create `src/components/ui/Card.tsx` - card container
- [ ] Create `src/components/layout/AuthLayout.tsx`:
  - [ ] Centered card layout for auth pages
- [ ] Create `src/components/layout/Header.tsx`:
  - [ ] Top bar with logo and user menu
- [ ] Create `src/components/layout/Sidebar.tsx`:
  - [ ] Navigation menu items
  - [ ] Active state highlighting
- [ ] Create `src/components/layout/AppShell.tsx`:
  - [ ] Combine Header + Sidebar + main content area

### Routing
- [ ] Create `src/routes/index.tsx`:
  - [ ] React Router setup
  - [ ] Public routes: /login, /forgot-password
  - [ ] Protected routes: /dashboard, /itineraries, etc.
  - [ ] ProtectedRoute component (checks auth)
- [ ] Update `src/App.tsx` - integrate router

### Testing
- [ ] Test login flow end-to-end
- [ ] Test token persistence
- [ ] Test protected route redirect

---

## Phase 8: Frontend - Users & Roles (RBAC UI)

**Goal:** Build admin interfaces for user and role management.

### API Clients
- [ ] Create `src/api/users.ts`:
  - [ ] `getUsers()`, `createUser()`, `updateUser()`, `deleteUser()`
- [ ] Create `src/api/roles.ts`:
  - [ ] `getRoles()`, `createRole()`, `updateRole()`, `deleteRole()`
  - [ ] `getPermissions()`

### State & Hooks
- [ ] Create `src/hooks/usePermissions.ts`:
  - [ ] `hasPermission(codename)` - check user permission
  - [ ] Used for conditional UI rendering
- [ ] Create `src/utils/rbac.ts`:
  - [ ] Helper functions for permission checking

### Components
- [ ] Create `src/components/ui/Table.tsx` - reusable table
- [ ] Create `src/components/ui/Modal.tsx` - reusable modal
- [ ] Create `src/components/ui/Dropdown.tsx` - dropdown select

### User Management
- [ ] Create `src/features/users/UserList.tsx`:
  - [ ] Table with name, email, role, status
  - [ ] Add/Edit/Delete actions
  - [ ] Permission-based button visibility
- [ ] Create `src/features/users/UserForm.tsx`:
  - [ ] Form for create/edit user
  - [ ] Role selection dropdown
  - [ ] Form validation with react-hook-form + zod

### Role Management
- [ ] Create `src/features/roles/RoleList.tsx`:
  - [ ] Table with role name, description, user count
  - [ ] Add/Edit/Delete actions
- [ ] Create `src/features/roles/RoleForm.tsx`:
  - [ ] Role name and description inputs
  - [ ] Permissions matrix (modules × actions grid)
  - [ ] Checkboxes for each permission

### Testing
- [ ] Test user CRUD operations
- [ ] Test role creation with permissions
- [ ] Test permission-based UI hiding

---

## Phase 9: Frontend - Activity Library & Search

**Goal:** Build activity management with semantic search.

### API Clients
- [ ] Create `src/api/activities.ts`:
  - [ ] `getActivities()`, `searchActivities(query)`, `createActivity()`, etc.
  - [ ] `uploadActivityImage(activityId, file)`
- [ ] Create `src/api/activityTypes.ts`

### Components
- [ ] Create `src/components/ui/ImageUploader.tsx`:
  - [ ] Drag-and-drop or click to upload
  - [ ] Preview uploaded images
  - [ ] Delete image
- [ ] Create `src/components/ui/Chip.tsx` - status/tag pills

### Activity Management
- [ ] Create `src/features/activities/ActivityList.tsx`:
  - [ ] Grid/table view of activities
  - [ ] Filters: type, location, status
  - [ ] Search bar (triggers semantic search)
  - [ ] Add activity button
- [ ] Create `src/features/activities/ActivitySearch.tsx`:
  - [ ] Standalone search component (for use in template/itinerary builder)
  - [ ] Debounced input
  - [ ] Results with similarity scores
  - [ ] Click to select activity
- [ ] Create `src/features/activities/ActivityForm.tsx`:
  - [ ] Multi-step form or single form:
    - [ ] Basic info (name, type, location)
    - [ ] Description and highlights
    - [ ] Pricing
    - [ ] Image upload
    - [ ] Tags

### Testing
- [ ] Test activity creation with images
- [ ] Test semantic search UX
- [ ] Test activity editing

---

## Phase 10: Frontend - Templates

**Goal:** Build template builder with day-wise activity management.

### API Clients
- [ ] Create `src/api/templates.ts`:
  - [ ] `getTemplates()`, `createTemplate()`, `updateTemplate()`, `publishTemplate()`

### State Management
- [ ] Consider local state or Zustand store for template editing:
  - [ ] Current template
  - [ ] Days array
  - [ ] Activities per day

### Components
- [ ] Create `src/components/ui/DatePicker.tsx` (if needed for duration)

### Template Management
- [ ] Create `src/features/templates/TemplateList.tsx`:
  - [ ] Grid of template cards
  - [ ] Show name, destination, duration, status
  - [ ] Filter by status (draft/published)
  - [ ] "Create Template" and "Use Template" buttons
- [ ] Create `src/features/templates/TemplateBuilder.tsx`:
  - [ ] Left panel: template metadata (name, destination, duration, price)
  - [ ] Right panel: day-wise builder
    - [ ] Day tabs or accordion
    - [ ] For each day:
      - [ ] Day title and notes
      - [ ] List of activities (drag-and-drop reordering)
      - [ ] "Add Activity" button (opens ActivitySearch modal)
      - [ ] Remove activity button
  - [ ] Save Draft / Publish buttons

### Testing
- [ ] Test template creation with multiple days
- [ ] Test adding/removing activities
- [ ] Test publishing template

---

## Phase 11: Frontend - Itineraries

**Goal:** Build itinerary creation wizard and day-wise editor.

### API Clients
- [ ] Create `src/api/itineraries.ts`:
  - [ ] `getItineraries()`, `createItinerary()`, `updateItinerary()`, etc.

### State Management
- [ ] Create `src/store/itineraryStore.ts` (Zustand):
  - [ ] Current editing itinerary
  - [ ] Days and activities
  - [ ] Actions: addDay, removeDay, addActivity, reorderActivities

### Itinerary Management
- [ ] Create `src/features/itineraries/ItineraryList.tsx`:
  - [ ] Table with client, trip name, destination, dates, status
  - [ ] Filters: status, destination, date range
  - [ ] "Create Itinerary" button
- [ ] Create `src/features/itineraries/ItineraryWizard.tsx`:
  - [ ] Step 1: Select Template (or "Start from scratch")
    - [ ] Show template cards
    - [ ] "Use this template" button
  - [ ] Step 2: Client & Dates
    - [ ] Client name, email, phone
    - [ ] Trip name
    - [ ] Start date, end date (date pickers)
    - [ ] Number of travelers
    - [ ] "Create Itinerary" button
  - [ ] On submit → create itinerary → redirect to editor
- [ ] Create `src/features/itineraries/ItineraryEditor.tsx`:
  - [ ] Top bar: trip name, client, dates, status chip
  - [ ] Buttons: Preview, Share & Export
  - [ ] Day tabs/navigation
  - [ ] For selected day:
    - [ ] Actual date display
    - [ ] List of activity cards (name, type, time, location)
    - [ ] Actions per activity: edit notes, replace, delete
    - [ ] "Add Activity" button
  - [ ] Side panel (optional): price summary, special notes
  - [ ] Auto-save or explicit save
- [ ] Create `src/features/itineraries/ItineraryPreview.tsx`:
  - [ ] Read-only view using public layout style
  - [ ] "Back to editing" button

### Testing
- [ ] Test creating itinerary from template
- [ ] Test creating itinerary from scratch
- [ ] Test day-wise editing (add/remove/reorder activities)
- [ ] Test preview mode

---

## Phase 12: Frontend - Sharing & Export

**Goal:** Implement share link generation, PDF export, and WebSocket live preview.

### API Clients
- [ ] Create `src/api/share.ts`:
  - [ ] `generateShareLink(itineraryId, options)`
  - [ ] `updateShareLink(linkId, options)`
  - [ ] `exportPDF(itineraryId)`
  - [ ] `getPublicItinerary(token)`

### WebSocket Hook
- [ ] Create `src/hooks/useWebSocket.ts`:
  - [ ] Connect to WebSocket endpoint
  - [ ] Send subscribe message
  - [ ] Listen for itinerary updates
  - [ ] Auto-reconnect on disconnect
  - [ ] Return: connection status, last message
- [ ] Create `src/store/wsStore.ts` (optional):
  - [ ] Connection state
  - [ ] Subscribed itinerary token

### Components
- [ ] Create `src/components/ui/Toast.tsx` (or use react-toastify)

### Share & Export
- [ ] Create `src/features/itineraries/ShareModal.tsx`:
  - [ ] Shareable link section:
    - [ ] Toggle: Enable public link
    - [ ] URL input with copy button
    - [ ] Optional: expiry date picker
    - [ ] Toggle: Live updates ON/OFF
  - [ ] PDF export section:
    - [ ] "Generate PDF" button
    - [ ] Download link (if PDF exists)
    - [ ] Timestamp of last generation
  - [ ] Close button

### Public View
- [ ] Create `src/features/public/PublicItinerary.tsx`:
  - [ ] No auth required
  - [ ] Sticky header: trip name, dates, agency branding
  - [ ] Hero section: large image, client greeting, tags
  - [ ] Day sections (scrollable):
    - [ ] For each day: date, title, activities list
    - [ ] Activity card: icon, name, time, location, description, image
  - [ ] Footer: agency contact (phone, email, WhatsApp)
  - [ ] WebSocket integration:
    - [ ] Connect if live_updates_enabled
    - [ ] On message: update itinerary state
    - [ ] Show toast: "Updated just now"

### Routing
- [ ] Add public route: `/itinerary/:token` (no auth)

### Testing
- [ ] Test share link generation
- [ ] Test live updates toggle
- [ ] Test PDF export and download
- [ ] Test public itinerary view
- [ ] Test WebSocket connection and updates

---

## Phase 13: Frontend - Dashboard

**Goal:** Create overview dashboard with summary cards and recent items.

### Dashboard
- [ ] Create `src/features/dashboard/Dashboard.tsx`:
  - [ ] Summary cards:
    - [ ] Total itineraries
    - [ ] Upcoming trips (count)
    - [ ] Active templates
  - [ ] Recent itineraries table (clickable rows)
  - [ ] Recently updated templates list
  - [ ] Primary CTA: "Create New Itinerary" button

### Testing
- [ ] Test dashboard data loading
- [ ] Test navigation from dashboard cards

---

## Phase 14: Polish & Testing

**Goal:** Refine UX, fix bugs, and achieve test coverage.

### UI/UX Polish
- [ ] Consistent spacing and typography (8px system)
- [ ] Loading states for all async operations
- [ ] Empty states for lists (e.g., "No activities yet")
- [ ] Error states and user-friendly error messages
- [ ] Toast notifications for success/error actions
- [ ] Mobile responsiveness (especially public itinerary page)
- [ ] Accessibility: keyboard navigation, ARIA labels

### Error Handling
- [ ] Global error boundary in React
- [ ] 404 page for invalid routes
- [ ] Graceful degradation if ChromaDB/OpenAI fails

### Testing
- [ ] Backend:
  - [ ] Run all unit tests
  - [ ] Run all integration tests
  - [ ] Achieve 70%+ coverage
- [ ] Frontend:
  - [ ] Manual testing of all flows
  - [ ] Browser compatibility testing
  - [ ] Mobile device testing

### Documentation
- [ ] Update README.md with:
  - [ ] Setup instructions
  - [ ] How to run backend
  - [ ] How to run frontend
  - [ ] Environment variables
  - [ ] Initial seed data / admin credentials
- [ ] Document API endpoints (consider OpenAPI/Swagger)
- [ ] Document component props (JSDoc)

---

## Phase 15: Production Readiness (Optional / Future)

**Goal:** Prepare for deployment and scaling.

### Backend
- [ ] Add Alembic for database migrations
- [ ] Create Dockerfile for FastAPI app
- [ ] Setup docker-compose (backend + ChromaDB)
- [ ] Add health check endpoint: GET `/health`
- [ ] Setup logging (structured JSON logs)
- [ ] Add rate limiting (slowapi)
- [ ] Security headers (CORS, CSP)

### Frontend
- [ ] Build production bundle: `npm run build`
- [ ] Optimize bundle size (code splitting, lazy loading)
- [ ] Add service worker for PWA (optional)
- [ ] Setup environment-specific configs (dev/staging/prod)

### Deployment
- [ ] Deploy backend (e.g., Railway, Render, DigitalOcean)
- [ ] Deploy frontend (e.g., Vercel, Netlify, Cloudflare Pages)
- [ ] Setup domain and SSL
- [ ] Configure environment variables on hosting platform

### Monitoring
- [ ] Setup error tracking (Sentry)
- [ ] Setup analytics (optional)
- [ ] Setup uptime monitoring

---

## Completion Checklist

**Phase 0:** ☐ Setup Complete
**Phase 1:** ☐ Auth & Tenancy Complete
**Phase 2:** ☐ RBAC Complete
**Phase 3:** ☐ Activity Library Complete
**Phase 4:** ☐ Templates Complete
**Phase 5:** ☐ Itineraries Complete
**Phase 6:** ☐ Sharing & WebSocket Complete
**Phase 7:** ☐ Frontend Auth & Layout Complete
**Phase 8:** ☐ Frontend RBAC Complete
**Phase 9:** ☐ Frontend Activities Complete
**Phase 10:** ☐ Frontend Templates Complete
**Phase 11:** ☐ Frontend Itineraries Complete
**Phase 12:** ☐ Frontend Sharing Complete
**Phase 13:** ☐ Dashboard Complete
**Phase 14:** ☐ Polish & Testing Complete
**Phase 15:** ☐ Production Deployment (Optional)

---

**End of Phases Document**

Update this file regularly to track progress. Check off items as they are completed. When starting a new session, review `plan.md` and this file to understand what needs to be done next.
