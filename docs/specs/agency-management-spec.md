# Bizvoy Admin – Agency Management Spec

## 0. Epic

**Epic: Internal Agency Management & Onboarding**

As a Bizvoy internal admin, I want a secure, admin-only interface where I can create and manage travel agencies and their primary admin users, so that new agencies can be onboarded quickly and receive login credentials via email, without exposing any of these controls to normal agency users.

---

## 1. Roles & Access

### 1.1 Roles

- **bizvoy-admin** (internal role)
  - Can access Admin Dashboard (global analytics).
  - Can access Agency Management:
    - Create agency.
    - Create initial admin user for agency.
    - View agencies.
    - Edit agency details.
    - Soft delete / deactivate agencies.
  - Cannot access normal agency dashboards as an agent unless explicitly granted.

- **agency-admin** (per-agency admin user)
  - Created as part of agency onboarding.
  - Has all existing dashboard permissions for their agency:
    - Activities, Templates, Itineraries, Company Profile, etc.
  - Can update their own Agency Information via the existing Company Profile / Settings area.
  - Cannot see bizvoy-admin dashboards or agency list.

### 1.2 URL Access Rules

- Admin area is separated logically under:
  - `/admin` (main admin dashboard)
  - `/admin/agencies` (agency management list)
  - `/admin/agencies/new` (create agency form)
  - `/admin/agencies/:id` (view/edit agency)

- Access checks:
  - User must be authenticated.
  - User must have role `bizvoy-admin` to access any `/admin/*` route.
  - Non-admin users hitting `/admin/*` see 403 Forbidden page.

---

## 2. Email & Credentials Behavior

### 2.1 SMTP Email Flow

When a bizvoy-admin creates a new agency + admin user:

1. System generates initial credentials for the agency admin user:
   - Username (email) – provided in form.
   - Temporary password – auto-generated secure string.

2. System stores the password hashed in the database.

3. System sends an email via SMTP to the provided admin email address:
   - Subject: Welcome to Bizvoy – Your Agency Account is Ready
   - Body includes:
     - Greeting (agency name + admin name).
     - Login URL.
     - Email/username.
     - Temporary password.
     - Prompt to change password on first login.

4. Optionally trigger a force password reset on first login flag.

### 2.2 Email Template (High-Level)

- **From:** Bizvoy Support <support@bizvoy.com> (configurable)
- **To:** Agency admin email
- **Subject:** Welcome to Bizvoy – Your Agency Account is Ready
- **Body Outline:**
  - Hi {Admin Name},
  - Your agency "{Agency Name}" has been successfully onboarded to Bizvoy.
  - Login details:
    - Login URL (e.g. https://app.bizvoy.com/login)
    - Username/email
    - Temporary password
  - For security, please log in and change your password immediately.
  - If you have any questions, reply to this email or contact support.
  - – The Bizvoy Team

---

## 3. User Stories

### Story A1 – Admin-Only Access

As a bizvoy-admin, I want a dedicated admin area that only I can access so that agency management and internal analytics are not visible to normal agency users.

**Acceptance Criteria:**
- `/admin` and all subroutes are only accessible when user has `bizvoy-admin` role.
- Non-admins hitting `/admin/*` see a 403 error page with a friendly message: "You don't have permission to access this area."
- Admin navigation shows an Admin section with:
  - Dashboard
  - Agencies
- Agency users never see these items.

---

### Story A2 – View Agencies List

As a bizvoy-admin, I want a list of all agencies so that I can quickly see who is onboarded and their current status.

**Acceptance Criteria:**
- `/admin/agencies` shows a table view with columns:
  - Agency Name
  - Primary Contact Name
  - Primary Contact Email
  - Status (Active / Inactive)
  - Created On
  - Number of Users (optional)
  - Number of Itineraries (optional summary stat)
  - Actions (View / Edit / Deactivate)
- Search bar filters by agency name or contact email.
- Filters allow filtering by status (Active / Inactive / All).
- Clicking an agency row or View opens Agency Detail screen.

---

### Story A3 – Create New Agency + Admin User

As a bizvoy-admin, I want to create a new agency and its primary admin user in one flow so that I can onboard new customers quickly.

**Acceptance Criteria:**
- Accessible via button "+ New Agency" at `/admin/agencies` or via `/admin/agencies/new`.
- Form fields (Agency section):
  - Agency Name (required)
  - Legal Name (optional)
  - Country (dropdown)
  - Timezone (dropdown)
  - Default Currency (dropdown)
  - Website URL (optional)
  - Notes (internal only, textarea)
- Form fields (Admin User section):
  - Admin Full Name (required)
  - Admin Email (required)
  - Admin Phone (optional)
- On submit:
  - Validates required fields.
  - Creates Agency record.
  - Creates User record linked to agency:
    - Role: agency-admin.
    - Email as username.
    - Temporary password generated.
  - Assigns all dashboard permissions to that user by default.
  - Triggers SMTP email to admin email with credentials.
- Success state:
  - Show confirmation: "Agency created and admin user notified by email."
  - Redirect to Agency Detail screen.

---

### Story A4 – View & Edit Agency Details

As a bizvoy-admin, I want to view and edit agency details so I can correct information or update it over time.

**Acceptance Criteria:**
- `/admin/agencies/:id` shows Agency Detail page with:
  - Agency card:
    - Agency Name
    - Legal Name
    - Status (Active / Inactive)
    - Country, Timezone, Currency
    - Website URL
    - Internal notes
  - Admin user(s) card:
    - Primary admin name & email
    - Link to view all users of that agency (optional future story).
  - Activity summary:
    - Number of itineraries
    - Number of templates
    - Date of last activity (optional summary only).
- Fields are editable in place or via Edit button.
- Changing status to Inactive:
  - Deactivates agency (see Story A5 behavior).

---

### Story A5 – Deactivate / Delete Agency (Soft)

As a bizvoy-admin, I want to deactivate an agency instead of permanently deleting it so that I don't lose historical data.

**Acceptance Criteria:**
- From Agencies List and Agency Detail, admin can "Deactivate Agency."
- Deactivation behavior:
  - Sets status = Inactive (or similar status field).
  - Agency users can no longer log in / access their dashboard.
  - Itineraries and data remain in the system for historical reporting.
- UI text uses "Deactivate" rather than "Delete" to signal soft behavior.
- Confirmation dialog:
  - "Deactivate {Agency Name}?"
  - Explains: "Users will no longer be able to log in, but their data will remain for reporting purposes."
- Optional: ability to Reactivate an inactive agency later.

---

### Story A6 – Resend Admin Credentials

As a bizvoy-admin, I want to resend login details to the agency admin if they lost the original email.

**Acceptance Criteria:**
- On Agency Detail page, in Admin user card:
  - Button: "Resend Invitation" or "Resend Login Email."
- On click:
  - Option 1: Generate new temporary password and send new email.
  - Option 2: Send password reset email (if password-reset flow exists).
- Show success toast: "Invitation email sent to {email}."

---

### Story A7 – Admin Dashboard (Agency-Level Analytics Overview)

As a bizvoy-admin, I want a high-level dashboard showing agency usage of Bizvoy so that I can see who is actively using the product.

**Acceptance Criteria:**
- `/admin` shows an Admin Dashboard with:
  - Total number of agencies
  - Active vs Inactive agencies
  - Total itineraries created (global)
  - Itineraries created in last 30 days
  - Top 5 agencies by itinerary count (with counts)
  - Optional: small chart of itineraries over time
- Dashboard is read-only and doesn't expose client PII beyond agency names.

---

## 4. Screens & Layout

### 4.1 Common Look & Feel

- **Overall style:**
  - Clean, modern, similar to existing Bizvoy dashboard.
  - Light theme by default.

- **Typography (example tokens):**
  - Base font: system or Inter / Roboto.
  - Page title: 24px, semi-bold.
  - Section titles: 18px, semi-bold.
  - Body text: 14–16px regular.
  - Labels & chips: 12–13px, medium.

- **Colors (example):**
  - Primary: Bizvoy teal/blue (e.g. #0D9488) for buttons & highlights.
  - Neutral background: light gray (#F3F4F6).
  - Cards: white with subtle border (#E5E7EB) and shadow.
  - Status chips:
    - Active: green background, dark green text.
    - Inactive: gray background, dark gray text.
    - Draft / Published / Archived (for templates) keep existing scheme.

- **Components:**
  - Use same button, card, input components as rest of app.
  - Consistent spacing based on 8px grid.

---

### 4.2 Screen: Admin Dashboard (`/admin`)

**Layout:**
- Top bar
  - Title: "Bizvoy Admin Dashboard" (24px, semi-bold).
- Summary cards row (3–4 cards):
  - Card 1: Total Agencies
  - Card 2: Active Agencies
  - Card 3: Total Itineraries
  - Card 4: Itineraries (Last 30 Days)
- Section: Top Agencies by Usage
  - Table or simple list:
    - Agency name
    - Itineraries count
    - Last activity date
- (Optional) Small line chart: Itineraries Created Over Time.

**Interactions:**
- Clicking an agency in Top Agencies list navigates to that Agency's detail page.

---

### 4.3 Screen: Agencies List (`/admin/agencies`)

**Header:**
- Title: "Agencies" (24px).
- Right-aligned button: "+ New Agency" (primary, filled).

**Filters Row:**
- Search input (full text search on name, email).
- Status dropdown: All / Active / Inactive.

**Table:**

Columns:
1. Agency Name (bold, clickable).
2. Primary Contact (name + email, stacked text).
3. Status (chip).
4. Created On (date).
5. Itineraries (count).
6. Actions (three-dot menu).

Row actions menu:
- View / Edit → Agency Detail.
- Deactivate → soft deactivate.
- (Future) Impersonate → login as agency admin (if you add this later).

**Empty state:**
- If no agencies:
  - Illustration + text: "No agencies yet."
  - CTA: "Create your first agency" (same as "+ New Agency").

---

### 4.4 Screen: Create New Agency (`/admin/agencies/new`)

**Layout:**

Two-column card, or single stacked form with clear sections.

**Section 1: Agency Details**
- Header: "Agency Details" (18px, semi-bold).
- Fields:
  - Agency Name (text input, required).
  - Legal Name (text input, optional).
  - Country (select dropdown).
  - Timezone (select dropdown).
  - Default Currency (select dropdown).
  - Website URL (text input, optional).
  - Internal Notes (textarea, optional).
  - Small hint: "Visible only to Bizvoy internal team."

**Section 2: Admin User**
- Header: "Admin User."
- Fields:
  - Admin Full Name (required).
  - Admin Email (required, validated as email).
  - Admin Phone (optional).

**Actions:**
- Bottom sticky bar or buttons aligned right:
  - Cancel (secondary).
  - Create Agency (primary).

**Validation & Feedback:**
- Required fields highlighted on submit if missing.
- On success:
  - Toast: "Agency created and admin user notified by email."
  - Redirect to Agency Detail.

---

### 4.5 Screen: Agency Detail (`/admin/agencies/:id`)

**Header:**
- Title: {Agency Name}.
- Status chip: Active / Inactive.
- Right-side actions:
  - Deactivate or Reactivate (if inactive).

**Layout:**

Two main columns on desktop:

- **Left column – Agency Info**
  - Card: Agency Information.
  - Fields displayed:
    - Agency Name
    - Legal Name
    - Country
    - Timezone
    - Default Currency
    - Website URL (clickable link).
    - Internal Notes.
  - Edit button toggles fields into editable mode.

- **Right column – Admin & Activity**
  - Card: Admin User
    - Name
    - Email
    - Phone (if given)
    - Button: "Resend Invitation."
  - Card: Usage Summary (optional)
    - Total Itineraries
    - Templates
    - Last Activity

On mobile, stack cards vertically.

---

## 5. Permissions & Behavior Summary

- **Routes restricted to bizvoy-admin:**
  - `/admin`
  - `/admin/agencies`
  - `/admin/agencies/new`
  - `/admin/agencies/:id`

- **Agency creation:**
  - Creates Agency record.
  - Creates agency-admin user with all permissions.
  - Sends credentials via SMTP email.

- **Agency update:**
  - Admin can edit agency fields from Agency Detail screen.

- **Deactivate agency:**
  - Set status = Inactive.
  - Prevent login for users under that agency (implementation detail for backend).

- **Resend invitation:**
  - Available from Agency Detail, admin user card.
  - Sends new or reset credentials to admin email.

---

This spec should be enough for design, backend, and frontend to implement the admin-only agency creation URL and supporting screens while keeping UX aligned with the existing Bizvoy dashboard.
