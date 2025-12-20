# Implementation Plan: AI Itinerary Builder

## 1. System Overview

The AI Itinerary Builder is an AI-powered module that allows agency admins to paste unstructured trip content (emails, Word docs, WhatsApp chats) and automatically generate:
1. **Activities** from the parsed content
2. **Templates** from those activities (with reuse of existing activities where possible)

The flow consists of 4 screens:
1. **Paste Trip** - Input form with destination, title, days, and raw content
2. **AI Breakdown** - Live progress indicators showing AI parsing stages
3. **Review Activities** - Edit suggested activities, choose to reuse or create new
4. **Create Template** - Confirmation with next steps checklist

---

## 2. Architecture Specification

### 2.1 Database Models (SQLAlchemy)

#### New Models

```python
# /backend/app/models/ai_builder.py

class AIBuilderSession(Base):
    """Tracks an AI builder session from paste to template creation"""
    __tablename__ = "ai_builder_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    agency_id: Mapped[str] = mapped_column(String(36), ForeignKey("agencies.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)

    # Input data
    destination: Mapped[str] = mapped_column(String(255), nullable=True)
    trip_title: Mapped[str] = mapped_column(String(255), nullable=True)
    num_days: Mapped[int] = mapped_column(Integer, nullable=True)
    raw_content: Mapped[str] = mapped_column(Text, nullable=False)

    # Processing status
    status: Mapped[str] = mapped_column(
        Enum("pending", "processing", "completed", "failed", name="ai_session_status"),
        default="pending"
    )
    current_step: Mapped[int] = mapped_column(Integer, default=1)  # 1-5 for progress stages
    error_message: Mapped[str] = mapped_column(Text, nullable=True)

    # Results (JSON stored)
    parsed_days: Mapped[str] = mapped_column(Text, nullable=True)  # JSON: detected days
    parsed_activities: Mapped[str] = mapped_column(Text, nullable=True)  # JSON: draft activities

    # Outcome tracking
    template_id: Mapped[str] = mapped_column(String(36), ForeignKey("templates.id"), nullable=True)
    activities_created: Mapped[int] = mapped_column(Integer, default=0)
    activities_reused: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Relationships
    agency: Mapped["Agency"] = relationship(back_populates="ai_builder_sessions")
    user: Mapped["User"] = relationship()
    template: Mapped["Template"] = relationship()
    draft_activities: Mapped[List["AIBuilderDraftActivity"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class AIBuilderDraftActivity(Base):
    """Draft activity extracted by AI, pending user review"""
    __tablename__ = "ai_builder_draft_activities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("ai_builder_sessions.id"), nullable=False)

    # Day assignment
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    # Extracted data
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    activity_type_id: Mapped[str] = mapped_column(String(36), ForeignKey("activity_types.id"), nullable=True)
    location_display: Mapped[str] = mapped_column(String(255), nullable=True)
    short_description: Mapped[str] = mapped_column(Text, nullable=True)
    default_duration_value: Mapped[int] = mapped_column(Integer, nullable=True)
    default_duration_unit: Mapped[str] = mapped_column(String(20), nullable=True)  # minutes/hours/days
    estimated_price: Mapped[float] = mapped_column(Float, nullable=True)
    currency_code: Mapped[str] = mapped_column(String(3), default="INR")

    # Reuse matching
    matched_activity_id: Mapped[str] = mapped_column(String(36), ForeignKey("activities.id"), nullable=True)
    match_score: Mapped[float] = mapped_column(Float, nullable=True)  # 0-1 similarity score

    # User decision
    decision: Mapped[str] = mapped_column(
        Enum("pending", "create_new", "reuse_existing", name="ai_draft_decision"),
        default="pending"
    )

    # Final outcome
    created_activity_id: Mapped[str] = mapped_column(String(36), ForeignKey("activities.id"), nullable=True)

    # Relationships
    session: Mapped["AIBuilderSession"] = relationship(back_populates="draft_activities")
    activity_type: Mapped["ActivityType"] = relationship()
    matched_activity: Mapped["Activity"] = relationship(foreign_keys=[matched_activity_id])
    created_activity: Mapped["Activity"] = relationship(foreign_keys=[created_activity_id])
```

#### Modified Models

```python
# /backend/app/models/agency.py - Add field

class Agency(Base):
    # ... existing fields ...

    # AI Module Permissions
    ai_builder_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationship
    ai_builder_sessions: Mapped[List["AIBuilderSession"]] = relationship(back_populates="agency")


# /backend/app/models/activity.py - Add tracking field

class Activity(Base):
    # ... existing fields ...

    # Source tracking
    created_via_ai_builder: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_builder_session_id: Mapped[str] = mapped_column(String(36), ForeignKey("ai_builder_sessions.id"), nullable=True)
```

---

### 2.2 API Contract (FastAPI)

#### Admin Endpoints (Bizvoy Admin)

| Method | Endpoint | Request Schema | Response Schema | Description |
|:---|:---|:---|:---|:---|
| PATCH | `/admin/agencies/{id}/ai-modules` | `AIModuleToggle` | `AgencyResponse` | Toggle AI builder for agency |

#### AI Builder Endpoints (Agency Admin)

| Method | Endpoint | Request Schema | Response Schema | Description |
|:---|:---|:---|:---|:---|
| GET | `/ai-builder/status` | - | `AIBuilderStatusResponse` | Check if AI builder enabled for user's agency |
| POST | `/ai-builder/sessions` | `AIBuilderSessionCreate` | `AIBuilderSessionResponse` | Start new AI parsing session |
| GET | `/ai-builder/sessions/{id}` | - | `AIBuilderSessionResponse` | Get session status & progress |
| GET | `/ai-builder/sessions/{id}/draft-activities` | - | `List[DraftActivityResponse]` | Get draft activities for review |
| PATCH | `/ai-builder/sessions/{id}/draft-activities/{activity_id}` | `DraftActivityUpdate` | `DraftActivityResponse` | Update draft activity |
| POST | `/ai-builder/sessions/{id}/draft-activities/{activity_id}/decision` | `DraftDecision` | `DraftActivityResponse` | Set reuse/create decision |
| POST | `/ai-builder/sessions/{id}/bulk-decision` | `BulkDecision` | `BulkDecisionResponse` | Apply bulk decisions |
| POST | `/ai-builder/sessions/{id}/create-template` | `TemplateCreateRequest` | `TemplateCreationResponse` | Create template from session |

#### Schemas

```python
# /backend/app/schemas/ai_builder.py

class AIModuleToggle(BaseModel):
    ai_builder_enabled: bool

class AIBuilderStatusResponse(BaseModel):
    enabled: bool
    agency_id: str

class AIBuilderSessionCreate(BaseModel):
    destination: Optional[str] = None
    trip_title: Optional[str] = None
    num_days: Optional[int] = None
    raw_content: str  # Required, min length validation

class AIBuilderSessionResponse(BaseModel):
    id: str
    status: str  # pending, processing, completed, failed
    current_step: int  # 1-5
    error_message: Optional[str]
    destination: Optional[str]
    trip_title: Optional[str]
    num_days: Optional[int]
    detected_summary: Optional[Dict]  # { stays: 1, meals: 3, experiences: 5 }
    activities_created: int
    activities_reused: int
    template_id: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

class DraftActivityResponse(BaseModel):
    id: str
    day_number: int
    order_index: int
    name: str
    activity_type_id: Optional[str]
    activity_type_label: Optional[str]
    location_display: Optional[str]
    short_description: Optional[str]
    default_duration_value: Optional[int]
    default_duration_unit: Optional[str]
    estimated_price: Optional[float]
    currency_code: str
    matched_activity_id: Optional[str]
    matched_activity_name: Optional[str]
    match_score: Optional[float]
    decision: str  # pending, create_new, reuse_existing

class DraftActivityUpdate(BaseModel):
    name: Optional[str]
    activity_type_id: Optional[str]
    location_display: Optional[str]
    short_description: Optional[str]
    default_duration_value: Optional[int]
    default_duration_unit: Optional[str]
    estimated_price: Optional[float]

class DraftDecision(BaseModel):
    decision: str  # create_new | reuse_existing
    reuse_activity_id: Optional[str]  # Required if decision = reuse_existing

class BulkDecision(BaseModel):
    action: str  # accept_all_new | auto_reuse_best | clear_all
    match_threshold: Optional[float] = 0.85  # For auto_reuse_best

class BulkDecisionResponse(BaseModel):
    updated_count: int
    new_count: int
    reuse_count: int

class TemplateCreateRequest(BaseModel):
    template_name: Optional[str]  # Override AI-suggested name

class TemplateCreationResponse(BaseModel):
    template_id: str
    template_name: str
    activities_created: int
    activities_reused: int
    next_steps: List[NextStepItem]

class NextStepItem(BaseModel):
    type: str  # missing_images | estimated_prices | fine_tune
    title: str
    detail: str
    count: Optional[int]
    action_url: Optional[str]
```

---

### 2.3 Services

#### AI Parser Service

```python
# /backend/app/services/ai_builder/parser_service.py

class AIParserService:
    """Parses raw trip content into structured activities using OpenAI"""

    async def parse_trip_content(
        self,
        raw_content: str,
        destination: Optional[str],
        num_days: Optional[int],
        agency_id: str
    ) -> ParseResult:
        """
        Uses GPT-4o-mini to extract:
        - Days/day markers
        - Stays (hotels, accommodations)
        - Meals (breakfast, lunch, dinner)
        - Experiences (activities, tours)
        - Transfers (logistics)

        Returns structured JSON with draft activities grouped by day.
        """
        pass

    def _build_prompt(self, raw_content: str, hints: Dict) -> str:
        """Build the OpenAI prompt with extraction instructions"""
        pass

    def _parse_response(self, response: str) -> List[DraftActivity]:
        """Parse JSON response into draft activity objects"""
        pass
```

#### Reuse Matcher Service

```python
# /backend/app/services/ai_builder/matcher_service.py

class ReuseMatcherService:
    """Finds similar existing activities for reuse suggestions"""

    def __init__(self, search_service: SearchService):
        self.search_service = search_service

    async def find_matches(
        self,
        draft_activities: List[DraftActivity],
        agency_id: str,
        db: Session
    ) -> List[MatchResult]:
        """
        For each draft activity:
        1. Search existing activities by name + location + type
        2. Use semantic search for fuzzy matching
        3. Return top match with score (0-1)
        """
        pass

    def _calculate_match_score(
        self,
        draft: DraftActivity,
        candidate: Activity
    ) -> float:
        """
        Composite score from:
        - Name similarity (fuzzy match)
        - Same activity type
        - Location proximity
        - Duration similarity
        """
        pass
```

#### Template Builder Service

```python
# /backend/app/services/ai_builder/template_builder_service.py

class AITemplateBuilderService:
    """Creates template from reviewed draft activities"""

    async def create_template_from_session(
        self,
        session: AIBuilderSession,
        template_name: Optional[str],
        db: Session
    ) -> Template:
        """
        1. Create new activities for 'create_new' decisions
        2. Link existing activities for 'reuse_existing' decisions
        3. Create Template with TemplateDays and TemplateDayActivities
        4. Mark activities with ai_builder_session_id
        5. Return template with next steps
        """
        pass

    def _create_activity_from_draft(
        self,
        draft: AIBuilderDraftActivity,
        agency_id: str,
        db: Session
    ) -> Activity:
        """Create new Activity from draft"""
        pass

    def _calculate_next_steps(
        self,
        template: Template,
        created_activities: List[Activity]
    ) -> List[NextStepItem]:
        """
        Analyze and return next steps:
        - Missing images count
        - Estimated prices count
        - Fine-tune suggestion
        """
        pass
```

---

### 2.4 Frontend Modules

#### Feature: AI Builder (`/frontend/src/features/ai-builder/`)

```
/ai-builder/
├── pages/
│   ├── AIBuilderHome.tsx         # Step 1: Paste Trip Content
│   ├── AIBreakdownPage.tsx       # Step 2: AI Progress & Preview
│   ├── ReviewActivitiesPage.tsx  # Step 3: Review & Reuse
│   └── TemplateCreatedPage.tsx   # Step 4: Success & Next Steps
├── components/
│   ├── StepProgress.tsx          # 4-step progress header
│   ├── TripInputForm.tsx         # Destination, title, days, content form
│   ├── SampleInputModal.tsx      # Example trip text modal
│   ├── ProgressChecklist.tsx     # Vertical checklist timeline
│   ├── PreviewSummary.tsx        # Quick preview card
│   ├── DayFilterPanel.tsx        # Left sidebar day filter
│   ├── DraftActivityCard.tsx     # Activity review card
│   ├── MatchSuggestion.tsx       # Reuse suggestion box
│   ├── BulkActionsBar.tsx        # Bulk decision buttons
│   ├── TemplateSummaryCard.tsx   # Template details card
│   └── NextStepsChecklist.tsx    # Next steps with actions
├── hooks/
│   ├── useAIBuilderSession.ts    # Session state management
│   └── useAIBuilderPolling.ts    # Poll for progress updates
└── index.ts                      # Exports
```

#### API Client

```typescript
// /frontend/src/api/ai-builder.ts

interface AIBuilderAPI {
  // Check if AI builder enabled
  getStatus(): Promise<AIBuilderStatusResponse>;

  // Session management
  createSession(data: AIBuilderSessionCreate): Promise<AIBuilderSessionResponse>;
  getSession(sessionId: string): Promise<AIBuilderSessionResponse>;

  // Draft activities
  getDraftActivities(sessionId: string): Promise<DraftActivityResponse[]>;
  updateDraftActivity(sessionId: string, activityId: string, data: DraftActivityUpdate): Promise<DraftActivityResponse>;
  setDecision(sessionId: string, activityId: string, data: DraftDecision): Promise<DraftActivityResponse>;
  bulkDecision(sessionId: string, data: BulkDecision): Promise<BulkDecisionResponse>;

  // Template creation
  createTemplate(sessionId: string, data?: TemplateCreateRequest): Promise<TemplateCreationResponse>;
}
```

#### Routes

```typescript
// Add to /frontend/src/routes/AppRoutes.tsx

// AI Builder routes (agency_admin only, requires permission)
<Route path="/ai-builder" element={<AIBuilderHome />} />
<Route path="/ai-builder/session/:sessionId" element={<AIBreakdownPage />} />
<Route path="/ai-builder/session/:sessionId/review" element={<ReviewActivitiesPage />} />
<Route path="/ai-builder/session/:sessionId/complete" element={<TemplateCreatedPage />} />
```

#### Navigation Update

```typescript
// Modify /frontend/src/components/layout/Sidebar.tsx

// Add conditional nav item
{user.role === 'agency_admin' && aiBuilderEnabled && (
  <NavItem
    icon={<Sparkles className="w-5 h-5" />}
    label="AI Itinerary Builder"
    to="/ai-builder"
    tooltip="Paste a trip and let AI build activities + templates for you."
  />
)}
```

---

### 2.5 Admin UI Updates

#### Agency Detail Page

```typescript
// Modify /frontend/src/features/admin/AgencyDetail.tsx

// Add AI Modules card
<Card title="AI Modules">
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium">AI Itinerary Builder</p>
      <p className="text-sm text-slate-500">
        Allows this agency to turn pasted trip content into reusable templates.
      </p>
    </div>
    <Toggle
      checked={agency.ai_builder_enabled}
      onChange={(enabled) => handleAIModuleToggle(enabled)}
    />
    {agency.ai_builder_enabled && (
      <Badge variant="success">Active</Badge>
    )}
  </div>
</Card>
```

---

## 3. Implementation Details

### 3.1 OpenAI Integration

**Model**: GPT-4o-mini (cost-effective, fast)

**Prompt Strategy**:
```
You are a travel itinerary parser. Extract structured activities from the following trip description.

Rules:
1. Identify day markers (Day 1, Day 2, dates, etc.)
2. Classify each item as: Stay, Breakfast, Lunch, Dinner, Local Experience, Outdoor Sports, Transfer
3. Extract: name, location, description, estimated duration
4. Return valid JSON array grouped by day

Input:
{raw_content}

Hints:
- Destination: {destination}
- Expected days: {num_days}
```

**Response Format**:
```json
{
  "days": [
    {
      "day_number": 1,
      "day_title": "Arrival & Check-in",
      "activities": [
        {
          "name": "Airport Pickup",
          "type": "Transfer",
          "location": "Goa Airport",
          "description": "...",
          "duration_value": 30,
          "duration_unit": "minutes"
        }
      ]
    }
  ]
}
```

### 3.2 Reuse Matching Algorithm

1. **Exact Name Match**: If activity name matches exactly, score = 1.0
2. **Fuzzy Name Match**: Using Levenshtein distance, score = similarity ratio
3. **Semantic Search**: Use existing ChromaDB search, score = cosine similarity
4. **Type Bonus**: +0.1 if same activity_type_id
5. **Location Bonus**: +0.1 if location contains same keywords

Final score = weighted average, capped at 1.0

### 3.3 Progress Polling Strategy

- Frontend polls `/ai-builder/sessions/{id}` every 2 seconds during processing
- Backend updates `current_step` (1-5) as each phase completes
- On `status: completed`, stop polling and show preview
- On `status: failed`, show error with retry option

### 3.4 Error Handling

- **Empty content**: Frontend validation before submit
- **AI parse failure**: Return `status: failed` with user-friendly message
- **No activities detected**: Allow retry with edited content
- **Timeout**: 60s limit on OpenAI call, graceful degradation

---

## 4. Security Considerations

1. **Permission Check**: All AI builder endpoints require `agency_admin` role + agency's `ai_builder_enabled = true`
2. **Rate Limiting**: Max 10 sessions per hour per agency
3. **Content Sanitization**: Strip PII indicators before sending to OpenAI
4. **Agency Isolation**: Sessions and drafts filtered by `agency_id`

---

## 5. Database Migration

```python
# alembic revision for AI Builder tables

def upgrade():
    # Add ai_builder_enabled to agencies
    op.add_column('agencies', sa.Column('ai_builder_enabled', sa.Boolean(), default=False))

    # Add AI builder tracking to activities
    op.add_column('activities', sa.Column('created_via_ai_builder', sa.Boolean(), default=False))
    op.add_column('activities', sa.Column('ai_builder_session_id', sa.String(36), nullable=True))

    # Create ai_builder_sessions table
    op.create_table('ai_builder_sessions', ...)

    # Create ai_builder_draft_activities table
    op.create_table('ai_builder_draft_activities', ...)
```
