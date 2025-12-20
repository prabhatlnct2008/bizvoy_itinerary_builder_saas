# Project Status: AI Itinerary Builder

## Current Phase: Not Started

## Parallel Development Strategy (Git Worktree)

This project can be developed in parallel streams using Git worktrees. Each phase can have its own branch and worktree, allowing concurrent development.

### Setup Commands

```bash
# Create worktrees for parallel development
git worktree add ../ai-builder-backend claude/ai-builder-backend
git worktree add ../ai-builder-frontend claude/ai-builder-frontend
git worktree add ../ai-builder-admin claude/ai-builder-admin

# After completion, merge all into main feature branch
git checkout claude/ai-itinerary-builder
git merge claude/ai-builder-backend
git merge claude/ai-builder-frontend
git merge claude/ai-builder-admin
```

---

## Phase Overview

| Phase | Stream | Description | Dependencies | Parallelizable |
|:---|:---|:---|:---|:---|
| 1 | Backend | Database Models & Migrations | None | Yes |
| 2A | Backend | API Endpoints (Admin Toggle) | Phase 1 | Yes (with 2B) |
| 2B | Backend | API Endpoints (AI Builder) | Phase 1 | Yes (with 2A) |
| 3 | Backend | AI Parser Service | Phase 2B | No |
| 4 | Backend | Reuse Matcher Service | Phase 2B, 3 | No |
| 5 | Backend | Template Builder Service | Phase 2B, 4 | No |
| 6A | Frontend | Admin UI (AI Modules Card) | Phase 2A | Yes (with 6B) |
| 6B | Frontend | AI Builder Pages (Step 1-4) | Phase 2B | Yes (with 6A) |
| 7 | Frontend | Navigation & Routing | Phase 6A, 6B | No |
| 8 | Integration | End-to-End Testing | All | No |

---

## Parallel Streams

### Stream A: Backend Core (Phases 1-5)
**Branch**: `claude/ai-builder-backend`
**Owner**: Backend Developer

### Stream B: Admin UI (Phase 6A)
**Branch**: `claude/ai-builder-admin`
**Owner**: Frontend Developer 1
**Can start after**: Phase 2A complete

### Stream C: AI Builder UI (Phase 6B)
**Branch**: `claude/ai-builder-frontend`
**Owner**: Frontend Developer 2
**Can start after**: Phase 2B complete (can mock API initially)

---

## Detailed Phase Breakdown

### Phase 1: Database Models & Migrations
**Branch**: `claude/ai-builder-backend`
**Estimated Complexity**: Medium

#### Tasks
- [ ] Create `AIBuilderSession` model in `/backend/app/models/ai_builder.py`
- [ ] Create `AIBuilderDraftActivity` model
- [ ] Add `ai_builder_enabled` field to `Agency` model
- [ ] Add `created_via_ai_builder` and `ai_builder_session_id` to `Activity` model
- [ ] Create Alembic migration script
- [ ] Run migration and verify tables created
- [ ] Add model exports to `/backend/app/models/__init__.py`

#### Acceptance Criteria
- All new tables exist in database
- Foreign key relationships work correctly
- Existing data unaffected

---

### Phase 2A: Admin API Endpoints
**Branch**: `claude/ai-builder-admin` or `claude/ai-builder-backend`
**Estimated Complexity**: Low
**Can Run Parallel With**: Phase 2B

#### Tasks
- [ ] Create `AIModuleToggle` schema in `/backend/app/schemas/ai_builder.py`
- [ ] Add `PATCH /admin/agencies/{id}/ai-modules` endpoint
- [ ] Update `AgencyResponse` schema to include `ai_builder_enabled`
- [ ] Add permission check (bizvoy_admin only)
- [ ] Write unit tests for toggle endpoint

#### Acceptance Criteria
- Bizvoy admin can toggle AI builder for any agency
- Non-admin users get 403
- Toggle persists in database

---

### Phase 2B: AI Builder API Endpoints (Scaffolding)
**Branch**: `claude/ai-builder-backend`
**Estimated Complexity**: Medium
**Can Run Parallel With**: Phase 2A

#### Tasks
- [ ] Create all AI builder schemas in `/backend/app/schemas/ai_builder.py`
- [ ] Create `/backend/app/api/v1/endpoints/ai_builder.py`
- [ ] Implement `GET /ai-builder/status` endpoint
- [ ] Implement `POST /ai-builder/sessions` endpoint (stub)
- [ ] Implement `GET /ai-builder/sessions/{id}` endpoint
- [ ] Implement `GET /ai-builder/sessions/{id}/draft-activities` endpoint
- [ ] Implement `PATCH /ai-builder/sessions/{id}/draft-activities/{id}` endpoint
- [ ] Implement `POST /ai-builder/sessions/{id}/draft-activities/{id}/decision` endpoint
- [ ] Implement `POST /ai-builder/sessions/{id}/bulk-decision` endpoint
- [ ] Implement `POST /ai-builder/sessions/{id}/create-template` endpoint (stub)
- [ ] Add router to `/backend/app/api/v1/router.py`
- [ ] Add permission middleware (agency_admin + ai_builder_enabled)

#### Acceptance Criteria
- All endpoints return correct response shapes
- Permission checks work correctly
- Session CRUD operations functional

---

### Phase 3: AI Parser Service
**Branch**: `claude/ai-builder-backend`
**Estimated Complexity**: High
**Depends On**: Phase 2B

#### Tasks
- [ ] Create `/backend/app/services/ai_builder/` directory
- [ ] Create `parser_service.py`
- [ ] Implement OpenAI prompt builder for trip parsing
- [ ] Implement response parser (JSON → DraftActivity objects)
- [ ] Implement progress tracking (update session.current_step)
- [ ] Add error handling and timeout (60s)
- [ ] Add rate limiting (10 sessions/hour/agency)
- [ ] Wire service to `POST /ai-builder/sessions` endpoint
- [ ] Write unit tests with mocked OpenAI responses

#### Acceptance Criteria
- Raw trip content is parsed into structured activities
- Progress steps update correctly (1→5)
- Errors handled gracefully with user-friendly messages
- Works with various input formats (email, WhatsApp, etc.)

---

### Phase 4: Reuse Matcher Service
**Branch**: `claude/ai-builder-backend`
**Estimated Complexity**: Medium
**Depends On**: Phase 3

#### Tasks
- [ ] Create `matcher_service.py`
- [ ] Implement exact name matching
- [ ] Implement fuzzy name matching (Levenshtein)
- [ ] Integrate with existing SearchService for semantic matching
- [ ] Implement composite scoring algorithm
- [ ] Add type and location bonuses
- [ ] Update draft activities with match suggestions
- [ ] Write unit tests

#### Acceptance Criteria
- Each draft activity gets a match suggestion (if any)
- Match scores are accurate (0-1 range)
- Activities with score > 0.85 clearly marked as good matches

---

### Phase 5: Template Builder Service
**Branch**: `claude/ai-builder-backend`
**Estimated Complexity**: Medium
**Depends On**: Phase 4

#### Tasks
- [ ] Create `template_builder_service.py`
- [ ] Implement activity creation from drafts
- [ ] Implement template creation with days
- [ ] Implement activity linking (reuse vs new)
- [ ] Implement next steps calculation (missing images, prices)
- [ ] Wire service to `POST /ai-builder/sessions/{id}/create-template`
- [ ] Update session with final counts
- [ ] Write unit tests

#### Acceptance Criteria
- Template created with correct structure
- New activities marked with `created_via_ai_builder`
- Reused activities linked correctly
- Next steps checklist accurate

---

### Phase 6A: Admin UI - AI Modules Card
**Branch**: `claude/ai-builder-admin`
**Estimated Complexity**: Low
**Can Run Parallel With**: Phase 6B
**Depends On**: Phase 2A (API)

#### Tasks
- [ ] Add `ai_builder_enabled` to Agency type in `/frontend/src/types/index.ts`
- [ ] Create Toggle component (if not exists) in `/frontend/src/components/ui/`
- [ ] Update `AgencyDetail.tsx` with AI Modules card
- [ ] Implement toggle handler calling `PATCH /admin/agencies/{id}/ai-modules`
- [ ] Add loading state and error handling
- [ ] Add "Active" badge when enabled

#### Acceptance Criteria
- AI Modules card visible on Agency Detail page
- Toggle updates agency's AI builder permission
- Visual feedback for enabled/disabled state

---

### Phase 6B: AI Builder Frontend Pages
**Branch**: `claude/ai-builder-frontend`
**Estimated Complexity**: High
**Can Run Parallel With**: Phase 6A
**Depends On**: Phase 2B (API schemas)

#### Subphase 6B.1: Foundation & Step 1
- [ ] Create `/frontend/src/features/ai-builder/` directory structure
- [ ] Create `StepProgress.tsx` component
- [ ] Create `TripInputForm.tsx` component
- [ ] Create `SampleInputModal.tsx` component
- [ ] Create `AIBuilderHome.tsx` page (Step 1)
- [ ] Create `/frontend/src/api/ai-builder.ts` API client
- [ ] Add types in `/frontend/src/types/ai-builder.ts`

#### Subphase 6B.2: Step 2 - AI Breakdown
- [ ] Create `ProgressChecklist.tsx` component
- [ ] Create `PreviewSummary.tsx` component
- [ ] Create `AIBreakdownPage.tsx` page (Step 2)
- [ ] Implement polling hook `useAIBuilderPolling.ts`
- [ ] Implement progress animation (spinner → checkmark)

#### Subphase 6B.3: Step 3 - Review Activities
- [ ] Create `DayFilterPanel.tsx` component
- [ ] Create `DraftActivityCard.tsx` component
- [ ] Create `MatchSuggestion.tsx` component
- [ ] Create `BulkActionsBar.tsx` component
- [ ] Create `ReviewActivitiesPage.tsx` page (Step 3)
- [ ] Implement bulk action handlers

#### Subphase 6B.4: Step 4 - Success
- [ ] Create `TemplateSummaryCard.tsx` component
- [ ] Create `NextStepsChecklist.tsx` component
- [ ] Create `TemplateCreatedPage.tsx` page (Step 4)
- [ ] Add confetti animation (subtle, B2B appropriate)

#### Acceptance Criteria
- All 4 steps flow correctly
- Form validation works
- Progress indicators animate properly
- Bulk actions update UI correctly
- Next steps link to correct pages

---

### Phase 7: Navigation & Routing
**Branch**: `claude/ai-builder-frontend`
**Estimated Complexity**: Low
**Depends On**: Phases 6A, 6B

#### Tasks
- [ ] Add AI Builder routes to `/frontend/src/routes/AppRoutes.tsx`
- [ ] Update Sidebar navigation in `/frontend/src/components/layout/Sidebar.tsx`
- [ ] Implement permission check for nav item visibility
- [ ] Create `useAIBuilderSession.ts` hook for session state
- [ ] Add route guards (redirect if AI builder disabled)
- [ ] Export feature from `/frontend/src/features/ai-builder/index.ts`

#### Acceptance Criteria
- Nav item visible only to agency_admin with permission
- Routes protected correctly
- Session persists across page navigation

---

### Phase 8: Integration Testing
**Branch**: `claude/ai-itinerary-builder` (main feature branch)
**Estimated Complexity**: Medium
**Depends On**: All previous phases

#### Tasks
- [ ] Merge all feature branches into main
- [ ] End-to-end test: Bizvoy admin enables AI builder for agency
- [ ] End-to-end test: Agency admin sees nav item
- [ ] End-to-end test: Full flow (paste → parse → review → create)
- [ ] Test error scenarios (empty content, parse failure, timeout)
- [ ] Test reuse matching accuracy
- [ ] Test template creation correctness
- [ ] Test next steps links
- [ ] Performance test with large content inputs
- [ ] Fix any integration issues

#### Acceptance Criteria
- Full flow works end-to-end
- All edge cases handled
- Performance acceptable (< 30s for typical trip)
- No console errors

---

## Progress Legend

- [ ] Not started
- [~] In progress
- [x] Completed
- [!] Blocked

---

## Notes & Decisions

### Decision Log
| Date | Decision | Rationale |
|:---|:---|:---|
| TBD | Use GPT-4o-mini for parsing | Cost-effective, fast, good at structured extraction |
| TBD | Polling vs WebSocket | Start with polling (simpler), upgrade if needed |
| TBD | Match threshold 85% | Balance between quality matches and auto-reuse convenience |

### Blockers
_None currently_

### Questions for Stakeholder
1. Should we allow editing the template name on Step 4, or only in the template editor?
2. What's the expected max content size (character limit for raw_content)?
3. Should "Created via AI" tag be visible to clients, or internal only?

---

## Changelog

| Date | Phase | Update |
|:---|:---|:---|
| - | - | Initial plan created |
