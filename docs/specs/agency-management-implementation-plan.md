# Agency Management Implementation Plan

## Overview

This document outlines the technical implementation plan for the Bizvoy Admin Agency Management feature. The implementation spans both backend (FastAPI/Python) and frontend (React/TypeScript).

---

## Phase 1: Database Schema Updates

### 1.1 Update Agency Model

Add new fields to `backend/app/models/agency.py`:

```python
# New fields to add:
legal_name = Column(String(255), nullable=True)
country = Column(String(100), nullable=True)
timezone = Column(String(100), nullable=True)
default_currency = Column(String(10), nullable=True)
website_url = Column(String(500), nullable=True)
internal_notes = Column(Text, nullable=True)  # Only visible to bizvoy-admin
```

### 1.2 Update User Model

Add new fields to `backend/app/models/user.py`:

```python
# New fields to add:
phone = Column(String(50), nullable=True)
is_bizvoy_admin = Column(Boolean, default=False, nullable=False)  # Platform-level admin
force_password_reset = Column(Boolean, default=False, nullable=False)
```

**Key distinction:**
- `is_superuser` = Agency-level admin (existing)
- `is_bizvoy_admin` = Bizvoy platform admin (new)

---

## Phase 2: Email Service

### 2.1 Create Email Configuration

Add SMTP settings to `backend/app/core/config.py`:

```python
# Email settings
SMTP_HOST: str = "smtp.gmail.com"
SMTP_PORT: int = 587
SMTP_USER: str = ""
SMTP_PASSWORD: str = ""
SMTP_FROM_EMAIL: str = "support@bizvoy.com"
SMTP_FROM_NAME: str = "Bizvoy Support"
APP_URL: str = "http://localhost:5173"  # Frontend URL for login links
```

### 2.2 Create Email Service

Create `backend/app/services/email_service.py`:

- `send_email()` - Generic email sender
- `send_welcome_email()` - Send agency onboarding email with credentials
- `send_password_reset_email()` - Send password reset for resend invitation
- `generate_temporary_password()` - Generate secure random password

---

## Phase 3: Backend API Endpoints

### 3.1 Create Admin Schemas

Create `backend/app/schemas/admin.py`:

- `AgencyCreate` - Create agency with admin user
- `AgencyUpdate` - Update agency details
- `AgencyResponse` - Agency with stats
- `AgencyListResponse` - Paginated agency list
- `AdminDashboardStats` - Dashboard statistics
- `ResendInvitationRequest` - Resend invitation request

### 3.2 Create Admin Dependencies

Add to `backend/app/core/deps.py`:

```python
def require_bizvoy_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require user to be a Bizvoy platform admin"""
    if not current_user.is_bizvoy_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Bizvoy admin privileges required."
        )
    return current_user
```

### 3.3 Create Admin Endpoints

Create `backend/app/api/v1/endpoints/admin.py`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Get admin dashboard stats |
| GET | `/admin/agencies` | List all agencies with pagination/filters |
| POST | `/admin/agencies` | Create new agency + admin user |
| GET | `/admin/agencies/{id}` | Get agency details |
| PUT | `/admin/agencies/{id}` | Update agency |
| POST | `/admin/agencies/{id}/deactivate` | Deactivate agency |
| POST | `/admin/agencies/{id}/reactivate` | Reactivate agency |
| POST | `/admin/agencies/{id}/resend-invitation` | Resend admin credentials |

### 3.4 Update Auth Endpoint

Modify login to check:
1. If user's agency is inactive → reject login
2. If `force_password_reset` is true → return flag to frontend

---

## Phase 4: Frontend Implementation

### 4.1 Create Admin API Client

Create `frontend/src/api/admin.ts`:

- `getAdminDashboard()`
- `getAgencies(params)`
- `getAgency(id)`
- `createAgency(data)`
- `updateAgency(id, data)`
- `deactivateAgency(id)`
- `reactivateAgency(id)`
- `resendInvitation(agencyId, userId)`

### 4.2 Create Admin Store

Create `frontend/src/store/adminStore.ts`:

- Store for admin dashboard data
- Agencies list with pagination
- Current agency details

### 4.3 Create Admin Components

#### Pages:
- `frontend/src/features/admin/AdminDashboard.tsx`
- `frontend/src/features/admin/AgenciesList.tsx`
- `frontend/src/features/admin/AgencyForm.tsx`
- `frontend/src/features/admin/AgencyDetail.tsx`

#### Components:
- `frontend/src/features/admin/components/StatsCard.tsx`
- `frontend/src/features/admin/components/AgencyTable.tsx`
- `frontend/src/features/admin/components/TopAgenciesList.tsx`
- `frontend/src/components/ui/StatusChip.tsx`

### 4.4 Update Routes

Modify `frontend/src/routes/AppRoutes.tsx`:

```tsx
// Add admin-protected route wrapper
const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (!user?.is_bizvoy_admin) {
    return <ForbiddenPage />;
  }
  return children;
};

// Add routes:
<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
<Route path="/admin/agencies" element={<AdminRoute><AgenciesList /></AdminRoute>} />
<Route path="/admin/agencies/new" element={<AdminRoute><AgencyForm /></AdminRoute>} />
<Route path="/admin/agencies/:id" element={<AdminRoute><AgencyDetail /></AdminRoute>} />
```

### 4.5 Update Sidebar

Modify `frontend/src/components/layout/Sidebar.tsx`:

- Add conditional rendering for admin section
- Show "Admin Dashboard" and "Agencies" only for bizvoy-admin users

### 4.6 Create Forbidden Page

Create `frontend/src/features/auth/Forbidden.tsx`:

- Display 403 error with friendly message
- Link back to dashboard

---

## Phase 5: Auth Store Updates

### 5.1 Update Types

Add to `frontend/src/types/index.ts`:

```typescript
interface UserWithRoles {
  // ... existing fields
  is_bizvoy_admin: boolean;
  force_password_reset?: boolean;
}
```

### 5.2 Update Auth Store

Modify login flow to:
1. Extract `is_bizvoy_admin` from JWT
2. Handle `force_password_reset` flag (redirect to password change)

---

## Implementation Order

1. **Database Models** - Update Agency and User models
2. **Email Service** - Create SMTP email service
3. **Backend Schemas** - Create admin schemas
4. **Backend Dependencies** - Add bizvoy-admin check
5. **Backend Endpoints** - Create admin API endpoints
6. **Update Router** - Register admin router
7. **Frontend API** - Create admin API client
8. **Frontend Pages** - Create admin pages
9. **Update Routes** - Add admin routes
10. **Update Sidebar** - Add admin navigation
11. **Testing** - Verify all flows work

---

## File Changes Summary

### Backend (New Files):
- `backend/app/services/email_service.py`
- `backend/app/schemas/admin.py`
- `backend/app/api/v1/endpoints/admin.py`

### Backend (Modified Files):
- `backend/app/models/agency.py` - Add new fields
- `backend/app/models/user.py` - Add is_bizvoy_admin, phone, force_password_reset
- `backend/app/core/config.py` - Add SMTP settings
- `backend/app/core/deps.py` - Add require_bizvoy_admin
- `backend/app/api/v1/router.py` - Include admin router
- `backend/app/api/v1/endpoints/auth.py` - Check agency status

### Frontend (New Files):
- `frontend/src/api/admin.ts`
- `frontend/src/features/admin/AdminDashboard.tsx`
- `frontend/src/features/admin/AgenciesList.tsx`
- `frontend/src/features/admin/AgencyForm.tsx`
- `frontend/src/features/admin/AgencyDetail.tsx`
- `frontend/src/features/admin/components/StatsCard.tsx`
- `frontend/src/features/admin/components/AgencyTable.tsx`
- `frontend/src/features/admin/components/TopAgenciesList.tsx`
- `frontend/src/features/auth/Forbidden.tsx`

### Frontend (Modified Files):
- `frontend/src/types/index.ts` - Add admin types
- `frontend/src/store/authStore.ts` - Handle bizvoy admin
- `frontend/src/routes/AppRoutes.tsx` - Add admin routes
- `frontend/src/components/layout/Sidebar.tsx` - Add admin navigation

---

## Notes

- All admin endpoints require `is_bizvoy_admin = True`
- SMTP credentials should be stored in environment variables
- Agency deactivation is soft-delete (data preserved)
- Temporary passwords are generated securely (12+ chars, mixed case, numbers, symbols)
