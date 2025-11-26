# Travel SaaS Itinerary Builder - Frontend

React + TypeScript frontend for the multi-tenant travel agency itinerary management system.

## 🎯 Project Status: **75% Complete**

See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for detailed completion status.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend API running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1/ws
```

## 📁 Project Structure

```
src/
├── api/                    # API clients
│   ├── client.ts          # Axios instance with interceptors
│   ├── auth.ts
│   ├── users.ts
│   ├── roles.ts
│   ├── activities.ts
│   ├── activityTypes.ts
│   ├── templates.ts
│   ├── itineraries.ts
│   └── share.ts
│
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Chip.tsx
│   │   └── ImageUploader.tsx
│   └── layout/            # Layout components
│       ├── AppShell.tsx
│       ├── Header.tsx
│       └── Sidebar.tsx
│
├── features/              # Feature-based organization
│   ├── auth/
│   │   └── Login.tsx
│   ├── dashboard/
│   │   └── Dashboard.tsx
│   ├── users/
│   │   ├── UserList.tsx
│   │   └── UserForm.tsx
│   ├── roles/
│   │   ├── RoleList.tsx
│   │   └── RoleForm.tsx
│   ├── activities/
│   │   └── ActivityList.tsx
│   ├── templates/
│   │   ├── TemplateList.tsx
│   │   └── TemplateBuilder.tsx
│   └── itineraries/
│       └── ItineraryList.tsx
│       # TODO: ItineraryWizard, ItineraryEditor
│
├── hooks/                 # Custom React hooks
│   └── usePermissions.ts
│
├── store/                 # Zustand state management
│   ├── authStore.ts
│   └── itineraryStore.ts
│
├── types/                 # TypeScript type definitions
│   └── index.ts
│
├── utils/                 # Utility functions
│   └── rbac.ts
│
├── routes/                # React Router setup
│   └── AppRoutes.tsx
│
└── styles/
    └── index.css          # Tailwind CSS
```

## ✅ Completed Features

### Phase 8: Users & Roles (RBAC)
- ✅ User management (CRUD)
- ✅ Role management with **interactive permissions matrix**
- ✅ Permission-based UI rendering
- ✅ `usePermissions` hook for components

### Phase 9: Activity Library
- ✅ Activity CRUD operations
- ✅ **Semantic search** integration (ready for ChromaDB backend)
- ✅ Image upload with drag-and-drop
- ✅ Activity type categorization

### Phase 10: Templates
- ✅ Template grid view with filters (Draft/Published)
- ✅ **Day-wise template builder**
  - Add/remove/reorder activities
  - Day tabs navigation
  - Save draft / Publish workflow

### Phase 11: Itineraries (Partial)
- ✅ Itinerary list with filters
- ✅ Zustand store for complex editing
- ⏳ Wizard (TODO)
- ⏳ Editor (TODO)

### Phase 12: Sharing (Partial)
- ✅ Share API client
- ⏳ ShareModal (TODO)
- ⏳ PublicItinerary (TODO)
- ⏳ WebSocket integration (TODO)

### Phase 13: Dashboard
- ✅ Summary statistics
- ✅ Recent itineraries/templates
- ✅ Quick actions

## 🚧 Remaining Work (3-4 hours)

### High Priority Components

1. **ItineraryWizard** - 2-step creation process
2. **ItineraryEditor** - Day-wise itinerary editing
3. **ShareModal** - Generate share links and PDFs
4. **PublicItinerary** - Client-facing view
5. **useWebSocket** - Live updates hook

See detailed guidance in [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md).

## 🎨 Design System

### Color Palette
- **Primary:** #2563EB (Blue 600) - Main CTAs, active states
- **Secondary:** #10B981 (Green 500) - Success states
- **Error:** #EF4444 (Red 500)
- **Background:** #F3F4F6 (Gray 100)
- **Surface:** #FFFFFF (White)
- **Border:** #E5E7EB (Gray 200)

### Typography
- Font Family: Inter / system-ui
- Sizes: Text base (16px), H1 (24-28px), H2 (20-22px)
- Weights: Regular (400), Medium (500), Semibold (600), Bold (700)

### Spacing
8px system: 4, 8, 12, 16, 24, 32, 48, 64

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type checking
npm run type-check
```

### Key Dependencies

```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "zustand": "^4.x",
  "axios": "^1.x",
  "react-toastify": "^9.x",
  "tailwindcss": "^3.x",
  "typescript": "^5.x"
}
```

## 🏗️ Architecture Patterns

### API Client Pattern
All API calls are centralized in `/src/api/`:
```typescript
import client from './client';

export const usersApi = {
  async getUsers(): Promise<User[]> {
    const response = await client.get('/users');
    return response.data;
  },
  // ... more methods
};
```

### Component Pattern
Feature components follow this structure:
```typescript
// List component
const UserList: React.FC = () => {
  const [data, setData] = useState([]);
  const { hasPermission } = usePermissions();

  // Fetch data, handle CRUD, permission checks
  // Return table/grid with actions
};

// Form component
const UserForm: React.FC<Props> = ({ user, onSubmit, onCancel }) => {
  // Form state, validation, submit handling
};
```

### State Management
- **Local state:** `useState` for component-specific state
- **Global auth:** `authStore` (Zustand) for user, tokens, permissions
- **Complex editing:** `itineraryStore` (Zustand) for day/activity management

### Permission Checks
```typescript
const { hasPermission } = usePermissions();

// In render
{hasPermission('users.create') && <Button>Add User</Button>}

// Component level
if (!canView) {
  return <div>No permission</div>;
}
```

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Login/logout flow
- [ ] Create role with permissions
- [ ] Create user and assign role
- [ ] Permission-based UI visibility
- [ ] Activity search (semantic)
- [ ] Template creation and publishing
- [ ] Itinerary workflow (when complete)
- [ ] Share link generation (when complete)
- [ ] WebSocket live updates (when complete)

### Unit Testing (Future)
- Component tests with React Testing Library
- API client tests with Mock Service Worker
- Hook tests with @testing-library/react-hooks

## 📝 Code Conventions

### TypeScript
- Strict mode enabled
- All API responses are typed
- No `any` types except error handling
- Interface for props, Type for API responses

### React
- Functional components only
- Hooks for all side effects
- Controlled components for forms
- Loading/error states for async operations

### Styling
- Tailwind utility classes
- No inline styles
- Consistent spacing (8px system)
- Mobile-first responsive design

## 🐛 Known Issues & Limitations

1. **Icons:** Currently uses `lucide-react`. If not installed, replace with SVG icons.
2. **Image paths:** ImageUploader uses `import.meta.env.VITE_API_URL`.
3. **WebSocket:** Not yet implemented (Phase 12).
4. **Mobile:** Responsive but not fully optimized for mobile.
5. **Error boundaries:** Not implemented yet (Phase 14).

## 🔗 Related Documentation

- [Backend API Documentation](../backend/README.md)
- [Implementation Plan](../plan.md)
- [Application Flow](../application_flow.md)
- [Phase Tracker](../phases.md)

## 👥 Contributors

Generated with assistance from Claude Code (Anthropic).

## 📄 License

Private project - All rights reserved.
