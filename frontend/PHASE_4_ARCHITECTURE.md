# Phase 4 - Templates Module Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        ROUTING LAYER                             │   │
│  │  /templates          →  TemplateList                            │   │
│  │  /templates/new      →  TemplateBuilder (create mode)           │   │
│  │  /templates/:id      →  TemplateBuilder (edit mode)             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   ↓                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        VIEW LAYER                                │   │
│  │                                                                   │   │
│  │  ┌────────────────────┐         ┌─────────────────────────┐     │   │
│  │  │   TemplateList     │         │   TemplateBuilder       │     │   │
│  │  │                    │         │                         │     │   │
│  │  │  • Grid Layout     │         │  ┌─────────────────┐   │     │   │
│  │  │  • Filter Tabs     │         │  │  Left Column    │   │     │   │
│  │  │  • Status Filter   │         │  │  (Metadata)     │   │     │   │
│  │  │                    │         │  └─────────────────┘   │     │   │
│  │  │  Uses:             │         │  ┌─────────────────┐   │     │   │
│  │  │  └─ TemplateCard   │         │  │ Middle Column   │   │     │   │
│  │  │                    │         │  │ (Day Timeline)  │   │     │   │
│  │  └────────────────────┘         │  └─────────────────┘   │     │   │
│  │                                  │  ┌─────────────────┐   │     │   │
│  │                                  │  │ Right Column    │   │     │   │
│  │                                  │  │ (Activities)    │   │     │   │
│  │                                  │  └─────────────────┘   │     │   │
│  │                                  └─────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   ↓                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    COMPONENT LAYER                               │   │
│  │                                                                   │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐       │   │
│  │  │ TemplateCard│  │ DayTimeline  │  │ DayActivityList  │       │   │
│  │  │             │  │              │  │                  │       │   │
│  │  │ • Display   │  │ • Navigation │  │ • Drag & Drop    │       │   │
│  │  │ • Actions   │  │ • Selection  │  │ • Reordering     │       │   │
│  │  │ • Status    │  │ • Count      │  │ • Editing        │       │   │
│  │  └─────────────┘  └──────────────┘  └──────────────────┘       │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────┐        │   │
│  │  │           ActivityPicker (Modal)                     │        │   │
│  │  │                                                       │        │   │
│  │  │  • Search      • Filter      • Select                │        │   │
│  │  └─────────────────────────────────────────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   ↓                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    STATE MANAGEMENT LAYER                        │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │             templateStore (Zustand)                        │ │   │
│  │  │                                                             │ │   │
│  │  │  State:                        Actions:                    │ │   │
│  │  │  • currentTemplate             • setTemplate()             │ │   │
│  │  │  • days[]                      • setDays()                 │ │   │
│  │  │  • selectedDayIndex            • updateDay()               │ │   │
│  │  │  • hasUnsavedChanges           • addActivityToDay()        │ │   │
│  │  │                                • removeActivityFromDay()    │ │   │
│  │  │                                • moveActivity()             │ │   │
│  │  │                                • reorderActivities()        │ │   │
│  │  │                                • clearTemplate()            │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   ↓                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        API LAYER                                 │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │              templatesApi                                 │   │   │
│  │  │                                                            │   │   │
│  │  │  • getTemplates()         • publishTemplate()            │   │   │
│  │  │  • getTemplate(id)        • deleteTemplate()             │   │   │
│  │  │  • createTemplate()                                      │   │   │
│  │  │  • updateTemplate()                                      │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │              activitiesApi                                │   │   │
│  │  │                                                            │   │   │
│  │  │  • getActivities()        • searchActivities()           │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │              activityTypesApi                             │   │   │
│  │  │                                                            │   │   │
│  │  │  • getActivityTypes()                                    │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   ↓                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           HTTP CLIENT (Axios)                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND API                                   │
│                                                                           │
│  POST   /api/v1/templates                 - Create template             │
│  GET    /api/v1/templates                 - List templates              │
│  GET    /api/v1/templates/:id             - Get template                │
│  PUT    /api/v1/templates/:id             - Update template             │
│  DELETE /api/v1/templates/:id             - Delete template             │
│  POST   /api/v1/templates/:id/publish     - Publish template            │
│                                                                           │
│  GET    /api/v1/activities                - List activities             │
│  POST   /api/v1/activities/search         - Search activities           │
│  GET    /api/v1/activity-types            - List activity types         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Creating a New Template

```
User                TemplateBuilder         Store                API
  │                       │                   │                   │
  │  Fill form            │                   │                   │
  │──────────────────────>│                   │                   │
  │                       │                   │                   │
  │  Change days          │                   │                   │
  │──────────────────────>│                   │                   │
  │                       │  setDays()        │                   │
  │                       │──────────────────>│                   │
  │                       │                   │                   │
  │  Select day           │                   │                   │
  │──────────────────────>│                   │                   │
  │                       │  setSelectedDayIndex()                │
  │                       │──────────────────>│                   │
  │                       │                   │                   │
  │  Add activity         │                   │                   │
  │──────────────────────>│                   │                   │
  │                       │  addActivityToDay()                   │
  │                       │──────────────────>│                   │
  │                       │                   │                   │
  │  Save                 │                   │                   │
  │──────────────────────>│                   │                   │
  │                       │                   │  createTemplate() │
  │                       │───────────────────────────────────────>│
  │                       │                   │                   │
  │                       │                   │     Success       │
  │                       │<───────────────────────────────────────│
  │                       │  markSaved()      │                   │
  │                       │──────────────────>│                   │
  │                       │                   │                   │
  │  Navigate to list     │                   │                   │
  │<──────────────────────│                   │                   │
```

### Editing an Existing Template

```
User                TemplateBuilder         Store                API
  │                       │                   │                   │
  │  Navigate to edit     │                   │                   │
  │──────────────────────>│                   │                   │
  │                       │                   │  getTemplate(id)  │
  │                       │───────────────────────────────────────>│
  │                       │                   │                   │
  │                       │                   │     Template      │
  │                       │<───────────────────────────────────────│
  │                       │  setTemplate()    │                   │
  │                       │──────────────────>│                   │
  │                       │                   │                   │
  │  Modify activities    │                   │                   │
  │──────────────────────>│                   │                   │
  │                       │  updateActivity() │                   │
  │                       │──────────────────>│                   │
  │                       │                   │                   │
  │  Reorder (drag)       │                   │                   │
  │──────────────────────>│                   │                   │
  │                       │  reorderActivities()                  │
  │                       │──────────────────>│                   │
  │                       │                   │                   │
  │  Save                 │                   │                   │
  │──────────────────────>│                   │                   │
  │                       │                   │  updateTemplate() │
  │                       │───────────────────────────────────────>│
  │                       │                   │                   │
  │                       │                   │     Success       │
  │                       │<───────────────────────────────────────│
  │                       │  markSaved()      │                   │
  │                       │──────────────────>│                   │
```

### Adding Activity to Day

```
User            ActivityPicker    DayActivityList    Store         API
  │                   │                 │              │            │
  │  Click Add        │                 │              │            │
  │──────────────────────────────────────>│            │            │
  │                   │                 │              │            │
  │  Modal opens      │                 │              │            │
  │<───────────────────│                 │              │            │
  │                   │                 │              │            │
  │  (Load activities)│                 │              │            │
  │                   │─────────────────────────────────────────────>│
  │                   │                 │              │   List     │
  │                   │<─────────────────────────────────────────────│
  │                   │                 │              │            │
  │  Search/Filter    │                 │              │            │
  │──────────────────>│                 │              │            │
  │                   │                 │              │            │
  │  Select activity  │                 │              │            │
  │──────────────────>│                 │              │            │
  │                   │                 │              │            │
  │                   │   onSelectActivity(activity)   │            │
  │                   │─────────────────────────────────>│           │
  │                   │                 │              │            │
  │                   │                 │  addActivityToDay()       │
  │                   │                 │              │<───────────│
  │                   │                 │              │            │
  │  Modal closes     │                 │              │            │
  │<───────────────────│                 │              │            │
  │                   │                 │              │            │
  │  Activity appears │                 │              │            │
  │<────────────────────────────────────────────────────│           │
```

## Component Hierarchy

```
App
└── BrowserRouter
    └── Routes
        └── ProtectedRoute
            └── AppShell
                ├── Sidebar (has Templates link)
                └── Outlet
                    ├── TemplateList
                    │   └── TemplateCard (x N)
                    │       ├── Chip (status)
                    │       └── Button (actions)
                    │
                    └── TemplateBuilder
                        ├── Header
                        │   ├── Button (Back)
                        │   ├── Button (Cancel)
                        │   ├── Button (Save Draft)
                        │   └── Button (Save & Publish)
                        │
                        ├── Left Column
                        │   ├── Input (name)
                        │   ├── Input (destination)
                        │   ├── Input (days)
                        │   ├── Input (nights)
                        │   ├── Input (price)
                        │   └── textarea (description)
                        │
                        ├── Middle Column
                        │   └── DayTimeline
                        │       └── Day button (x N)
                        │
                        ├── Right Column
                        │   ├── Input (day title)
                        │   ├── textarea (day notes)
                        │   ├── Button (Add Activity)
                        │   └── DayActivityList
                        │       └── Activity card (x N)
                        │           ├── GripVertical (drag)
                        │           ├── ChevronUp (move up)
                        │           ├── ChevronDown (move down)
                        │           ├── X (remove)
                        │           ├── Input (time slot)
                        │           └── textarea (notes)
                        │
                        └── Modal
                            └── ActivityPicker
                                ├── Input (search)
                                ├── Button (search)
                                ├── Dropdown (filter)
                                └── Activity list
                                    └── Activity card (x N)
```

## State Structure

```typescript
templateStore = {
  // Current template being edited
  currentTemplate: {
    id: "uuid",
    name: "Kerala Premium 5D/4N",
    destination: "Kerala, India",
    duration_days: 5,
    duration_nights: 4,
    description: "...",
    approximate_price: 15000,
    status: "draft",
    // ... metadata
  },

  // Array of days with activities
  days: [
    {
      day_number: 1,
      title: "Arrival in Kochi",
      notes: "Welcome to Kerala",
      activities: [
        {
          activity_id: "uuid-1",
          display_order: 0,
          time_slot: "9:00 AM",
          custom_notes: "Airport pickup"
        },
        {
          activity_id: "uuid-2",
          display_order: 1,
          time_slot: "2:00 PM",
          custom_notes: null
        }
      ]
    },
    // ... more days
  ],

  // Currently selected day (index)
  selectedDayIndex: 0,

  // Unsaved changes flag
  hasUnsavedChanges: true
}
```

## API Request/Response

### Create Template Request
```json
POST /api/v1/templates
{
  "name": "Kerala Premium 5D/4N",
  "destination": "Kerala, India",
  "duration_days": 5,
  "duration_nights": 4,
  "description": "Explore the serene backwaters...",
  "approximate_price": 15000,
  "status": "draft",
  "days": [
    {
      "day_number": 1,
      "title": "Arrival in Kochi",
      "notes": "Welcome day",
      "activities": [
        {
          "activity_id": "uuid-1",
          "display_order": 0,
          "time_slot": "9:00 AM",
          "custom_notes": "Airport pickup"
        }
      ]
    }
  ]
}
```

### Get Template Response
```json
GET /api/v1/templates/:id
{
  "id": "template-uuid",
  "agency_id": "agency-uuid",
  "name": "Kerala Premium 5D/4N",
  "destination": "Kerala, India",
  "duration_days": 5,
  "duration_nights": 4,
  "description": "...",
  "approximate_price": 15000,
  "status": "published",
  "created_by": "user-uuid",
  "created_at": "2025-11-26T10:00:00Z",
  "updated_at": "2025-11-26T12:00:00Z",
  "days": [
    {
      "id": "day-uuid",
      "template_id": "template-uuid",
      "day_number": 1,
      "title": "Arrival in Kochi",
      "notes": "Welcome day",
      "activities": [
        {
          "id": "tda-uuid",
          "template_day_id": "day-uuid",
          "activity_id": "activity-uuid",
          "display_order": 0,
          "time_slot": "9:00 AM",
          "custom_notes": "Airport pickup"
        }
      ]
    }
  ]
}
```

## Technology Stack

```
┌─────────────────────────────────────┐
│         Frontend Stack              │
├─────────────────────────────────────┤
│ React 18.2                          │
│ TypeScript 5.3                      │
│ React Router 6.21                   │
│ Zustand 4.5                         │
│ Axios 1.6                           │
│ Tailwind CSS 3.4                    │
│ Lucide React 0.309                  │
│ React Toastify 10.0                 │
│ Vite 5.0                            │
└─────────────────────────────────────┘
```

## Performance Considerations

### Optimization Techniques
1. **Memoization Ready**: Components can be wrapped with React.memo if needed
2. **Code Splitting**: Route-based splitting via lazy loading ready
3. **State Updates**: Zustand ensures efficient re-renders
4. **API Calls**: Cached where appropriate
5. **Drag and Drop**: Native HTML5 (no heavy libraries)

### Bundle Size
- No additional heavy dependencies
- Reuses existing design system
- Minimal new code footprint

## Security Considerations

1. **Authentication**: All routes protected
2. **Authorization**: Permission-based access
3. **Data Validation**: Client and server-side
4. **XSS Prevention**: React escapes by default
5. **CSRF Protection**: Token-based (backend)
6. **Agency Isolation**: Data scoped to agency

## Accessibility

1. **Keyboard Navigation**: Tab order maintained
2. **ARIA Labels**: On interactive elements
3. **Focus States**: Clear visual indicators
4. **Color Contrast**: WCAG AA compliant
5. **Screen Readers**: Semantic HTML

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Mobile Responsiveness

- **Desktop First**: Optimized for desktop workflow
- **Tablet Support**: Collapsible columns
- **Mobile**: Limited support (builder is complex)

---

**Architecture Version**: 1.0
**Last Updated**: November 26, 2025
**Status**: Production Ready ✅
