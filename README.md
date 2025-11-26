# Travel SaaS Itinerary Builder

A multi-tenant travel agency SaaS platform for creating and managing customized itineraries with AI-powered semantic search.

## Implementation Status

### ✅ **Completed Phases**

#### Phase 0: Project Setup
- ✅ Backend FastAPI structure with modular architecture
- ✅ Frontend React + TypeScript + Vite setup
- ✅ Tailwind CSS configuration with design system
- ✅ Dependencies and configuration files
- ✅ Database session management
- ✅ Environment configuration

#### Phase 1: Core Backend - Auth & Tenancy
- ✅ Agency model (multi-tenant foundation)
- ✅ User model with agency association
- ✅ JWT authentication (access & refresh tokens)
- ✅ Password hashing with bcrypt
- ✅ Login and token refresh endpoints
- ✅ Authentication dependencies and middleware
- ✅ Database initialization script with demo data

#### Phase 2: RBAC (Roles & Permissions)
- ✅ Permission model (system-wide permissions)
- ✅ Role model (agency-scoped roles)
- ✅ RolePermission & UserRole junction tables
- ✅ Permission checking service
- ✅ Role CRUD endpoints with permission enforcement
- ✅ User endpoints with permission checks
- ✅ Permission seeding in database initialization

### 🚧 **Remaining Phases** (Not Yet Implemented)

- Phase 3: Activity Library & Semantic Search
- Phase 4: Itinerary Templates
- Phase 5: Client Itineraries
- Phase 6: Sharing, PDF Export & WebSocket
- Phases 7-13: Complete Frontend Implementation
- Phase 14: Polish & Testing

## Quick Start Guide

### Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API key (required for Phase 3+)

### Step 1: Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

### Step 2: Configure Environment

Edit `backend/.env` and set:

```bash
SECRET_KEY="your-secret-key-here"  # Generate: python -c "import secrets; print(secrets.token_urlsafe(32))"
OPENAI_API_KEY="your-openai-key"   # Optional for now, required for Phase 3
```

### Step 3: Initialize Database

```bash
# From backend directory with venv activated
python -m app.db.init_db
```

This creates:
- All database tables
- System permissions (users.*, roles.*, activities.*, templates.*, itineraries.*)
- Demo agency: "Demo Travel Agency"
- Admin user: `admin@demo.com` / `admin123`

### Step 4: Start Backend Server

```bash
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
API docs: http://localhost:8000/docs

### Step 5: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Default VITE_API_URL=http://localhost:8000 should work
```

### Step 6: Start Frontend Server

```bash
npm run dev
```

Frontend runs at: http://localhost:5173

## Default Credentials

- **Email:** admin@demo.com
- **Password:** admin123
- **Permissions:** Full admin access (is_superuser=True)

## Current API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login (returns JWT tokens) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/forgot-password` | Password reset (stub) |
| POST | `/api/v1/auth/reset-password` | Reset password (stub) |

### Users (Requires permissions)

| Method | Endpoint | Permission Required | Description |
|--------|----------|---------------------|-------------|
| GET | `/api/v1/users` | users.view | List all users in agency |
| POST | `/api/v1/users` | users.create | Create new user |
| GET | `/api/v1/users/{id}` | users.view | Get user details |
| PUT | `/api/v1/users/{id}` | users.edit | Update user |
| DELETE | `/api/v1/users/{id}` | users.delete | Delete user |

### Roles & Permissions

| Method | Endpoint | Permission Required | Description |
|--------|----------|---------------------|-------------|
| GET | `/api/v1/roles/permissions` | roles.view | List all system permissions |
| GET | `/api/v1/roles` | roles.view | List all roles in agency |
| POST | `/api/v1/roles` | roles.create | Create new role |
| GET | `/api/v1/roles/{id}` | roles.view | Get role with permissions |
| PUT | `/api/v1/roles/{id}` | roles.edit | Update role |
| DELETE | `/api/v1/roles/{id}` | roles.delete | Delete role |

## Testing the API

### 1. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demo.com", "password": "admin123"}'
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### 2. Get Users (with authentication)

```bash
curl -X GET http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Create a Role

```bash
curl -X POST http://localhost:8000/api/v1/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Itinerary Creator",
    "description": "Can create and edit itineraries",
    "permission_ids": ["perm-id-1", "perm-id-2"]
  }'
```

## Project Structure

### Backend

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── endpoints/
│   │   │   ├── auth.py          ✅ Implemented
│   │   │   ├── users.py         ✅ Implemented
│   │   │   ├── roles.py         ✅ Implemented
│   │   │   ├── activities.py    ❌ Not implemented
│   │   │   ├── templates.py     ❌ Not implemented
│   │   │   ├── itineraries.py   ❌ Not implemented
│   │   │   └── share.py         ❌ Not implemented
│   │   └── router.py            ✅ Implemented
│   ├── core/
│   │   ├── config.py           ✅ Implemented
│   │   ├── security.py         ✅ Implemented (JWT + bcrypt)
│   │   └── deps.py             ✅ Implemented (auth + permissions)
│   ├── db/
│   │   ├── base.py             ✅ Implemented
│   │   ├── session.py          ✅ Implemented
│   │   └── init_db.py          ✅ Implemented
│   ├── models/
│   │   ├── agency.py           ✅ Implemented
│   │   ├── user.py             ✅ Implemented
│   │   ├── role.py             ✅ Implemented
│   │   ├── activity.py         ⚠️  Partially implemented
│   │   ├── template.py         ❌ Not implemented
│   │   └── itinerary.py        ❌ Not implemented
│   ├── schemas/
│   │   ├── auth.py             ✅ Implemented
│   │   ├── user.py             ✅ Implemented
│   │   ├── role.py             ✅ Implemented
│   │   └── ...                 ❌ Others not implemented
│   ├── services/
│   │   ├── rbac_service.py     ✅ Implemented
│   │   └── ...                 ❌ Others not implemented
│   └── main.py                 ✅ Implemented
├── requirements.txt            ✅ Complete
├── .env.example               ✅ Complete
└── pytest.ini                 ✅ Complete
```

### Frontend

```
frontend/
├── src/
│   ├── main.tsx               ✅ Basic setup
│   ├── App.tsx                ✅ Basic setup
│   ├── styles/index.css       ✅ Tailwind configured
│   ├── api/                   ❌ Not implemented
│   ├── components/            ❌ Not implemented
│   ├── features/              ❌ Not implemented
│   ├── hooks/                 ❌ Not implemented
│   ├── store/                 ❌ Not implemented
│   └── routes/                ❌ Not implemented
├── package.json               ✅ Complete
├── vite.config.ts             ✅ Complete
├── tailwind.config.js         ✅ Complete
└── tsconfig.json              ✅ Complete
```

## Database Schema (Current Implementation)

### agencies
- id (PK)
- name (unique)
- subdomain
- contact_email
- contact_phone
- is_active
- created_at / updated_at

### users
- id (PK)
- agency_id (FK → agencies)
- email (unique per agency)
- hashed_password
- full_name
- is_active
- is_superuser
- created_at / updated_at

### permissions
- id (PK)
- module (e.g., "users", "roles")
- action (e.g., "view", "create")
- codename (unique, e.g., "users.view")

### roles
- id (PK)
- agency_id (FK → agencies)
- name (unique per agency)
- description
- created_at / updated_at

### role_permissions
- role_id (FK → roles)
- permission_id (FK → permissions)

### user_roles
- user_id (FK → users)
- role_id (FK → roles)

## How Authentication Works

1. **Login:** User provides email/password → Backend validates → Returns JWT tokens
2. **Authorization:** Frontend includes `Authorization: Bearer {token}` header
3. **Token Validation:** Backend validates JWT → Extracts user_id → Loads user from DB
4. **Permission Check:** Backend checks if user has required permission for endpoint
5. **Multi-tenancy:** All queries are scoped to user's agency_id

## How RBAC Works

1. **System Permissions:** Predefined permissions (module.action format)
2. **Agency Roles:** Each agency creates custom roles
3. **Role Permissions:** Roles are assigned specific permissions
4. **User Roles:** Users are assigned one or more roles
5. **Superuser Bypass:** Users with `is_superuser=True` have all permissions

## Next Steps for Development

To complete the implementation, the following phases need to be developed in order:

### Phase 3: Activity Library & Semantic Search
- Complete activity models and schemas
- Implement ChromaDB integration
- Create OpenAI embeddings service
- Build semantic search endpoints
- Add file upload for activity images

### Phase 4: Itinerary Templates
- Create template models (Template, TemplateDay, TemplateDayActivity)
- Build template CRUD endpoints
- Implement template builder with day-wise activities

### Phase 5: Client Itineraries
- Create itinerary models (Itinerary, ItineraryDay, ItineraryDayActivity)
- Build itinerary CRUD endpoints
- Implement template-to-itinerary conversion service

### Phase 6: Sharing, PDF Export & WebSocket
- Create share link models
- Implement PDF generation with WeasyPrint
- Build WebSocket service for real-time updates
- Create public itinerary endpoint

### Phases 7-13: Frontend Implementation
- Build complete React frontend with all features
- Implement authentication flow
- Create RBAC UI
- Build activity, template, and itinerary management interfaces

### Phase 14: Testing & Polish
- Write unit and integration tests
- Add error handling and validation
- Improve UX/UI
- Performance optimization

## Environment Variables Reference

### Backend (.env)

```bash
# Required
SECRET_KEY=your-secret-key              # Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
DATABASE_URL=sqlite:///./travel_saas.db

# Optional (defaults work for development)
DEBUG=True
API_V1_PREFIX=/api/v1
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Required for Phase 3+
OPENAI_API_KEY=your-openai-api-key
EMBEDDING_MODEL=text-embedding-3-small
CHROMADB_PERSIST_DIR=./chroma_data

# File Storage
UPLOAD_DIR=./uploads
PDF_STORAGE_DIR=./pdfs
MAX_UPLOAD_SIZE=10485760

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

### "No module named 'app'"
- Ensure virtual environment is activated
- Run from `backend/` directory

### Database errors
- Delete `travel_saas.db` and run `python -m app.db.init_db` again

### Login fails with 401
- Check that database was initialized
- Verify credentials: admin@demo.com / admin123

### CORS errors
- Ensure backend is running
- Check BACKEND_CORS_ORIGINS includes frontend URL

## Development Tips

1. **API Testing:** Use http://localhost:8000/docs for interactive API testing
2. **Database Inspection:** Use SQLite browser or `sqlite3 travel_saas.db`
3. **Token Debugging:** Decode JWT at https://jwt.io
4. **Hot Reload:** Both backend and frontend auto-reload on code changes

## Production Considerations

Before deploying to production:

1. **Security:**
   - Change SECRET_KEY to a cryptographically secure value
   - Set DEBUG=False
   - Use PostgreSQL instead of SQLite
   - Enable HTTPS
   - Implement rate limiting

2. **Storage:**
   - Use cloud storage (S3/R2) for uploads and PDFs
   - Configure proper backup strategy

3. **Performance:**
   - Add Redis for caching
   - Use connection pooling
   - Enable CDN for frontend assets

4. **Monitoring:**
   - Add error tracking (Sentry)
   - Setup logging
   - Configure health checks

## License

Proprietary - All rights reserved

---

**Current Version:** 0.3.0 (Foundation Complete)
**Last Updated:** January 2025
