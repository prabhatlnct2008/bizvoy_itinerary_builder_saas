Travel SaaS Itinerary System – Application Flow & UX Spec

1. Styling (Design System)

1.1 Color Palette

Brand / Primary
	•	Primary 600 – #2563EB – main CTA buttons, active states
	•	Primary 500 – #3B82F6 – hovers, highlights
	•	Primary 100 – #DBEAFE – soft backgrounds, pills, tags

Secondary / Status
	•	Secondary 500 – #10B981 – success / confirmations
	•	Secondary 100 – #D1FAE5 – success background
	•	Warning – #F59E0B
	•	Error – #EF4444
	•	Info – #3B82F6

Neutrals
	•	Background – #F3F4F6 – app background
	•	Surface – #FFFFFF – cards, panels
	•	Border – #E5E7EB – borders, dividers
	•	Text Primary – #111827
	•	Text Secondary – #4B5563
	•	Muted Text – #9CA3AF

⸻

1.2 Typography

Font Family
	•	Primary: Inter / Nunito / Roboto (clean sans-serif)

Size & Weight
	•	H1 (page titles): 24–28px, semi-bold
	•	H2 (section titles): 20–22px, semi-bold
	•	H3 (card titles): 16–18px, semi-bold
	•	Body: 14–16px, regular
	•	Caption / meta: 12–13px, medium / muted

Guidelines:
	•	Page titles: H1, bold, Text Primary
	•	Descriptions & help text: Text Secondary
	•	Non-critical labels: Muted Text

⸻

1.3 Spacing, Corners, Shadows
	•	8px spacing system: 4 / 8 / 12 / 16 / 24 / 32
	•	Card padding: 16–24px
	•	Section spacing: 24–32px
	•	Border radius:
	•	Buttons, inputs, cards: 8px
	•	Modals: 12px
	•	Shadows:
	•	Light elevation (0 10px 15px -10px rgba(0,0,0,0.1)) for cards / main panels

⸻

1.4 Layout Patterns & Components

App Shell (logged-in)
	•	Top bar: white, shadow, logo left, user menu right
	•	Left sidebar:
	•	Items: Dashboard, Itineraries, Templates, Activities, Users & Roles, Settings
	•	Active item: left border in Primary 600, Primary text, subtle background
	•	Content: page title, filters/actions row, then cards/tables

Auth Pages
	•	Light grey background
	•	Centered white card (400–500px wide) with logo + form

Public Itinerary Page
	•	No sidebar
	•	Sticky header with trip name & dates
	•	Large hero image + day-by-day sections

Core Components
	•	Primary button: Primary 600, white text, 8px radius
	•	Secondary / ghost: white background, Primary border, Primary text
	•	Chips for status: rounded pills, filled with status color
	•	Tables: grey header row, hover rows, clear actions column
	•	Cards: white background, subtle shadow, title + content

⸻

2. Architecture & Functional Summary

2.1 Who Is It For?
	•	Multi-tenant travel agencies
	•	Users inside each agency:
	•	Admin – full control inside that agency
	•	Itinerary Creator – creates and edits itineraries
	•	Viewer – read-only access
	•	Clients (travelers) see itineraries via a share URL (no login).

⸻

2.2 Core Modules
	1.	Authentication & Tenancy
	•	Login, password reset
	•	Each user belongs to exactly one agency (tenant)
	2.	Users & Roles (RBAC like Django)
	•	Admin creates roles with permissions per module (view/create/edit/delete/export/share)
	•	Admin creates users and assigns roles
	3.	Activity Library
	•	Reusable activities (stays, meals, experiences, transfers, etc.)
	•	Stored with descriptions, images, location, pricing, tags
	•	Searchable (including semantic / natural language search)
	4.	Itinerary Templates
	•	Reusable day-by-day itineraries (e.g., “Kerala 4N/5D – Premium”)
	•	Built from the activity library
	5.	Itineraries For Clients
	•	Concrete instances for a specific client with dates, travelers, pricing
	•	Usually created from templates, then customized
	6.	Share & Export
	•	Public read-only itinerary page (share URL)
	•	PDF export
	•	Optional Live Client Preview (client sees edits in real-time)
	7.	Client Experience
	•	Clean, brochure-like itinerary view
	•	No login, no editing; just view and contact travel agency

⸻

2.3 Key Functional Flows
	1.	Agency Onboarding & Setup
	•	Admin logs in → defines roles → adds users → configures activity library + templates
	2.	Template Setup
	•	Admin / senior creators create templates with day-wise activities using the library
	3.	Itinerary Creation
	•	Creator chooses a template → enters client & dates → system maps days to actual dates
	•	Creator customizes activities and notes → saves itinerary for that client
	4.	Sharing & Live Preview
	•	Creator generates share URL and PDF
	•	Optional: enables “Live updates” so the client page refreshes automatically as changes are made
	5.	Client Viewing
	•	Client opens share link → sees latest version, with optional live updates while on a call/chat with agent

⸻

3. Epics & User Stories

(Non-technical phrasing, suitable for product doc / planning.)

Epic A: Tenant & Role Management (RBAC)

Goal: Ensure each travel agency controls its own workspace, users, and permissions (similar to Django-style permissions).

Story A1 – Create Roles
As an Agency Admin, I want to create roles with specific permissions (view, create, edit, delete, export, share) for each module so that staff only see and do what they’re supposed to.

Story A2 – Assign Roles to Users
As an Agency Admin, I want to create users and assign them roles so that each team member has the right level of access.

Story A3 – Restrict Access By Role
As an Itinerary Creator or Viewer, I want to only see screens and actions allowed by my role so that the system feels simple and I don’t accidentally break something.

⸻

Epic B: Activity Library

Goal: Provide a reusable, searchable catalog of all stays, meals, and experiences.

Story B1 – Manage Activity Types
As an Admin, I want to define activity types (stay, meal, experience, transfer, etc.) so that we can categorize activities consistently.

Story B2 – Create & Edit Activities
As an Admin / Creator, I want to add and edit activities with descriptions, images, location, and pricing so that our itineraries use high-quality, reusable data.

Story B3 – Search Activities Semantically
As an Itinerary Creator, I want to search activities using natural language (e.g., “romantic sunset cruise”) so that I can find relevant options quickly without exact keywords.

⸻

Epic C: Itinerary Templates

Goal: Allow agencies to pre-build their best itineraries and reuse them.

Story C1 – Create Templates
As an Admin, I want to create itinerary templates with day-by-day activities so that my team can reuse them for similar trips.

Story C2 – Manage Template Lifecycle
As an Admin, I want to save templates as drafts or publish them so that only approved templates are visible to the team.

Story C3 – Use Template for New Trip
As an Itinerary Creator, I want to start a new itinerary from a template so that I don’t have to build every trip from scratch.

⸻

Epic D: Client Itineraries

Goal: Create, customize, and manage itineraries for specific clients.

Story D1 – Create Itinerary From Template
As an Itinerary Creator, I want to create an itinerary for a client by selecting a template and entering dates and traveler information so that a complete draft is generated for me.

Story D2 – Customize Activities Per Client
As an Itinerary Creator, I want to customize day-by-day activities (add, remove, replace, edit notes) so that each itinerary fits my client’s needs.

Story D3 – View & Filter All Itineraries
As an Admin / Creator, I want to see a list of itineraries with filters (status, destination, dates) so that I can manage ongoing and past trips efficiently.

Story D4 – Price Overview
As an Itinerary Creator, I want to see a price summary (e.g., total, per person) so that I can keep the trip within the client’s budget.

⸻

Epic E: Sharing, PDF Export & Live Preview

Goal: Make it easy to share itineraries with clients and optionally show live updates.

Story E1 – Shareable URL
As an Itinerary Creator, I want to generate a shareable URL for an itinerary so that I can send it to clients without asking them to log in.

Story E2 – PDF Export
As an Itinerary Creator, I want to export an itinerary as a PDF with images and day-by-day details so that I can send it as an attachment or print it.

Story E3 – Live Client Preview (View-only)
As a Client, I want the itinerary page I have open to update automatically when the agent makes changes so that I always see the latest version without refreshing.

Acceptance notes (non-technical):
	•	Client does not need to refresh the page.
	•	Client cannot edit anything.
	•	There’s a small indication when updates happen (e.g., “Updated just now”).

Story E4 – Admin Control Over Live Mode
As an Agency Admin, I want to enable or disable live updates for a shared itinerary link so that I can choose whether clients see live changes or only finalized versions.

⸻

Epic F: Client-Facing Itinerary Experience

Goal: Provide a clear, attractive, mobile-friendly view of the itinerary for clients.

Story F1 – Read-Only Itinerary View
As a Client, I want to see my trip plan in a clean, day-by-day format with images, descriptions, and key info so that I understand exactly what will happen on each day.

Story F2 – Easy Contact Back to Agency
As a Client, I want to see the agency’s contact details alongside the itinerary so that I can quickly reach out if I need changes or have questions.

⸻

4. Screens (by Module)

For each screen: Purpose, Primary User, Key Elements, Main Interactions.

⸻

4.1 Authentication Module

Screen 1 – Login
	•	Purpose: Allow internal users to sign in to their agency workspace.
	•	Primary Users: Admin, Itinerary Creator, Viewer.
	•	Key Elements:
	•	Logo + product name
	•	Title: “Sign in to your travel workspace”
	•	Email, Password inputs
	•	“Log in” button
	•	“Forgot password?” link
	•	Interactions:
	•	On success → Agency Dashboard
	•	On failure → error message under form

Screen 2 – Forgot Password
	•	Purpose: Help users recover access to their account.
	•	Primary Users: All internal users.
	•	Key Elements:
	•	Title: “Reset your password”
	•	Email input
	•	“Send reset link” button
	•	Interactions:
	•	On success → confirmation message (“Check your email”)

⸻

4.2 Dashboard

Screen 3 – Agency Dashboard
	•	Purpose: Overview of itineraries and templates; quick entry to main actions.
	•	Primary Users: Admin, Itinerary Creator.
	•	Key Elements:
	•	Page title: “Dashboard”
	•	Primary CTA: “Create New Itinerary”
	•	Summary cards:
	•	Total itineraries
	•	Upcoming trips
	•	Active templates
	•	“Recent Itineraries” table
	•	“Recently Updated Templates” list
	•	Interactions:
	•	Clicking a card/table row → opens itinerary/template
	•	“Create New Itinerary” → itinerary creation flow

⸻

4.3 Users & Roles Module

Screen 4 – Roles List
	•	Purpose: See and manage roles in the agency.
	•	Primary Users: Admin.
	•	Key Elements:
	•	Title: “Roles & Permissions”
	•	Button: “Create Role”
	•	Table: Role name, Description, User count, Actions (Edit/Delete)
	•	Interactions:
	•	Edit → Role Detail screen
	•	Delete → confirm dialog

Screen 5 – Role Detail / Edit
	•	Purpose: Define permissions for a role.
	•	Primary Users: Admin.
	•	Key Elements:
	•	Inputs: Role name, Description
	•	Permissions matrix:
	•	Rows: Itineraries, Templates, Activities, Users & Roles, Settings, etc.
	•	Columns: View, Create, Edit, Delete, Export, Share (checkboxes)
	•	“Save” / “Cancel” buttons
	•	Interactions:
	•	Toggling permissions updates what users with this role can see/do
	•	Save → returns to Roles List

Screen 6 – Users List
	•	Purpose: See and manage agency staff users.
	•	Primary Users: Admin.
	•	Key Elements:
	•	Title: “Users”
	•	“Add User” button
	•	Table: Name, Email, Role, Status, Actions
	•	Interactions:
	•	Add User → Create/Edit User screen
	•	Edit → same screen prefilled

Screen 7 – Create / Edit User
	•	Purpose: Create or modify a staff user within the agency.
	•	Primary Users: Admin.
	•	Key Elements:
	•	Name, Email
	•	Role dropdown
	•	Option: set password or send invite
	•	Status toggle: Active / Inactive
	•	“Save” / “Cancel”
	•	Interactions:
	•	Save → user appears in list with assigned role

⸻

4.4 Activity Library Module

Screen 8 – Activity Types (optional)
	•	Purpose: Manage activity categories (stay, meal, experience, etc.).
	•	Primary Users: Admin.
	•	Key Elements:
	•	Title: “Activity Types”
	•	“Add Type” button
	•	Table: Name, Description, Actions
	•	Interactions:
	•	Edit / delete type
	•	Used as dropdown in Activity Detail

Screen 9 – Activity List
	•	Purpose: View and search all reusable activities.
	•	Primary Users: Admin, Itinerary Creator.
	•	Key Elements:
	•	Title: “Activities Library”
	•	Search bar (supports natural language)
	•	Filters: Type, Location, Status
	•	Grid or table of activities (Name, Type, Location, Price, Actions)
	•	“Add Activity” button
	•	Interactions:
	•	Clicking activity → Activity Detail
	•	Search/filter updates list

Screen 10 – Activity Detail
	•	Purpose: Define one activity in detail (for reuse).
	•	Primary Users: Admin, Itinerary Creator (if allowed).
	•	Key Elements:
	•	Activity name
	•	Type dropdown
	•	Location
	•	Short description
	•	Highlights / inclusions (bullets)
	•	Image gallery uploader
	•	Pricing (base price, pricing model)
	•	Tags
	•	“Save” / “Cancel”
	•	Interactions:
	•	Save → update available for templates & itineraries

⸻

4.5 Template Module

Screen 11 – Template List
	•	Purpose: Manage reusable itinerary templates.
	•	Primary Users: Admin, Itinerary Creator (view or edit).
	•	Key Elements:
	•	Title: “Templates”
	•	“Create Template” button
	•	Cards grid:
	•	Template name
	•	Destination
	•	Duration (e.g., 4N/5D)
	•	Status chip (Draft/Published)
	•	Buttons: “Edit Template”, “Use Template”
	•	Interactions:
	•	Edit → Template Builder
	•	Use Template → Itinerary creation flow

Screen 12 – Template Builder / Editor
	•	Purpose: Define day-wise structure of a reusable itinerary.
	•	Primary Users: Admin, senior Creators.
	•	Key Elements:
	•	Left panel:
	•	Template name
	•	Destination(s)
	•	Duration
	•	Description
	•	Approximate price
	•	“Save Draft”, “Publish”
	•	Right panel:
	•	Day navigation (Day 1, 2, 3…) as tabs/steps
	•	For each day: list of activities (cards/rows)
	•	“Add Activity” button (opens activity search)
	•	Interactions:
	•	Add / remove / reorder activities per day
	•	Save / publish template

⸻

4.6 Itinerary Module

Screen 13 – Itinerary List
	•	Purpose: View and manage all client itineraries.
	•	Primary Users: Admin, Itinerary Creator, Viewer (view-only).
	•	Key Elements:
	•	Title: “Itineraries”
	•	Filters: Search (client/trip), Status, Destination, Date Range
	•	“Create New Itinerary” button
	•	Table: Client, Trip Name, Destination, Dates, Status, Actions
	•	Interactions:
	•	Row click → Itinerary Editor or view
	•	Create → Itinerary wizard

Screen 14 – Create Itinerary: Step 1 (Select Template)
	•	Purpose: Start a new itinerary from a template or scratch.
	•	Primary Users: Itinerary Creator, Admin.
	•	Key Elements:
	•	Step indicator: “1. Select Template → 2. Client & Dates”
	•	Options:
	•	Template cards (as in Template List) with “Use this template”
	•	Button: “Start from scratch”
	•	Interactions:
	•	Pick template → Step 2 pre-filled with structure
	•	Start from scratch → blank structure in Step 2

Screen 15 – Create Itinerary: Step 2 (Client & Dates)
	•	Purpose: Attach the itinerary to a specific client and time frame.
	•	Primary Users: Itinerary Creator, Admin.
	•	Key Elements:
	•	Client details: Name, Email, Phone
	•	Trip name
	•	Start date, End date (or duration)
	•	Number of travelers (adults / children)
	•	“Back” / “Create Itinerary” buttons
	•	Interactions:
	•	Create → generates draft itinerary + opens Itinerary Editor

Screen 16 – Itinerary Editor (Day-by-Day)
	•	Purpose: Customize the client’s itinerary before sending.
	•	Primary Users: Itinerary Creator, Admin.
	•	Key Elements:
	•	Top bar:
	•	Trip name, client name
	•	Dates & destination tags
	•	Status chip (Draft, Sent, Confirmed)
	•	Buttons: “Preview”, “Share & Export”
	•	Day navigation (tabs/side steps)
	•	For selected day:
	•	List of activity cards (name, type, time, location, short descr.)
	•	Actions per activity: Replace, Edit notes, Delete
	•	“Add Activity” button (opens activity search modal)
	•	Optional side panel:
	•	Price summary
	•	Special notes
	•	Interactions:
	•	Change ordering / replace activities
	•	Auto-save or explicit save
	•	“Preview” → Itinerary Review screen
	•	“Share & Export” → Share modal

Screen 17 – Itinerary Review (Internal Preview)
	•	Purpose: Let creators see the itinerary as a client would.
	•	Primary Users: Itinerary Creator, Admin.
	•	Key Elements:
	•	Read-only view using the public layout style
	•	Label: “Internal Preview”
	•	Buttons: “Back to editing”, “Share & Export”
	•	Interactions:
	•	No editing here, only navigation
	•	Share → Share & Export modal

⸻

4.7 Sharing & Export Module

Screen 18 – Share & Export Modal
	•	Purpose: Control how the itinerary is shared with the client.
	•	Primary Users: Itinerary Creator, Admin.
	•	Key Elements:
	•	Section: “Shareable link”
	•	Toggle: “Enable public link”
	•	When enabled: URL + “Copy link” button
	•	Optional: link expiry date
	•	Toggle or indicator: “Live updates ON/OFF”
	•	Section: “PDF export”
	•	“Generate PDF” / “Download PDF”
	•	Timestamp of last generation
	•	Interactions:
	•	Turning live updates on/off affects whether clients see real-time changes
	•	PDF generation on demand

⸻

4.8 Client-Facing Public Itinerary

Screen 19 – Public Itinerary Page (Client View)
	•	Purpose: Let clients see their itinerary in a clear, attractive layout.
	•	Primary Users: Clients (no login).
	•	Key Elements:
	•	Sticky header:
	•	Trip name, destination(s)
	•	Dates
	•	“Prepared by [Agency Name]”
	•	Hero section:
	•	Large image (destination/activity)
	•	Friendly line: “Hi [Client], here’s your trip plan”
	•	Tags: duration, travelers
	•	Day sections:
	•	For each day:
	•	“Day 1 – Arrival in X (Date)”
	•	Activities list with type icon, title, time, location, short text, thumbnail image
	•	Footer:
	•	Agency contact: phone, email, maybe WhatsApp
	•	Interactions:
	•	Scroll-only; read-only
	•	Optional: simple text or toast: “Updated just now” when live updates arrive

⸻

5. Technical Considerations (High-Level Only)

(No code, just what the system needs to handle under the hood.)

5.1 Frontend Responsibilities
	•	Render all screens and enforce role-based UI:
	•	Hide/show menu items and buttons depending on user role.
	•	Manage layout:
	•	App shell, sidebar, public page responsiveness.
	•	Handle interactions:
	•	Filters, search, day navigation, add/replace activities.
	•	Listen for live updates on the public itinerary page and update UI state when they arrive (no technical implementation detail here, just the behavior).

⸻

5.2 Backend Responsibilities
	•	Authentication & Tenancy
	•	Verify users; issue tokens/sessions.
	•	Each user and all data are associated with an agency (tenant).
	•	RBAC Enforcement
	•	Store roles + permissions.
	•	Check permissions before allowing actions (e.g., only admins can manage users/roles).
	•	Business Logic
	•	Activities: create, update, search.
	•	Templates: create, update, manage day structure.
	•	Itineraries: create from template, adjust dates, manage day-wise activities.
	•	Sharing: generate share URL tokens, check access to public itineraries.
	•	Export: trigger PDF generation.

⸻

5.3 Data & Multi-Tenancy
	•	All core entities (users, roles, activities, templates, itineraries) are scoped to an agency.
	•	No cross-agency visibility: one agency’s data must never appear in another’s workspace.
	•	Public itinerary links are per-itinerary and read-only.

⸻

5.4 Permissions & Security
	•	Role permissions are applied both:
	•	In the UI (to simplify UX)
	•	On the server (to actually enforce)
	•	Admin-only actions:
	•	Managing roles, users
	•	Publishing templates
	•	Creators:
	•	Managing itineraries, possibly updating activities/templates as allowed
	•	Public itinerary:
	•	Does not expose internal IDs, admin notes, or sensitive agency settings

⸻

5.5 Performance & Future-Proofing
	•	Activity search should handle many activities per agency without feeling slow (especially important for semantic search).
	•	Itinerary templates and itineraries should load quickly even with many days and activities.
	•	Public itinerary pages should be optimized for mobile (common use case: client opens link on phone).
	•	Design leaves room for:
	•	More roles (e.g., “Finance”, “Partner agent”)
	•	Client-side comments / notes (future feature)
	•	Multiple languages (future)

⸻

5.6 Live Client Preview (Concept)
	•	When “Live updates” is ON for an itinerary:
	•	Any change the agent makes and saves should be reflected on the client’s public page automatically.
	•	Client is always read-only.
	•	Required behavior only (no technical mechanism here):
	•	Public page subscribes to updates for that itinerary.
	•	Update messages cause the public page to show the latest itinerary content.
	•	When “Live updates” is OFF:
	•	Client sees the latest published version, but new edits are not pushed live until re-enabled or refreshed.
