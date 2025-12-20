# AI Itinerary Builder - Code Changes Review

## Overview

This document contains all code changes for the AI Itinerary Builder feature. The feature allows agencies to paste raw trip content (from PDFs, documents, etc.) and have AI:
1. Parse and enrich activities with full catalog-quality data
2. Compare with existing activities using LLM to find duplicates
3. Structure into a template matching the database schema

---

## Files Changed/Created

| File | Status | Description |
|------|--------|-------------|
| `backend/app/models/ai_builder.py` | **CREATED** | Database models for AI Builder sessions and draft activities |
| `backend/app/schemas/ai_builder.py` | **CREATED** | Pydantic schemas for API request/response |
| `backend/app/api/v1/endpoints/ai_builder.py` | **CREATED** | API endpoints for AI Builder |
| `backend/app/services/ai_builder/__init__.py` | **CREATED** | Service exports |
| `backend/app/services/ai_builder/parser_service.py` | **CREATED** | LLM prompt #1: Activity enrichment |
| `backend/app/services/ai_builder/comparison_service.py` | **CREATED** | LLM prompt #2: Activity comparison |
| `backend/app/services/ai_builder/template_builder_service.py` | **CREATED** | LLM prompt #3: Template structuring |
| `frontend/src/features/ai-builder/` | **CREATED** | Frontend pages and components |

---

## 1. Backend Models (`backend/app/models/ai_builder.py`)

**Status: CREATED**

```python
"""
AI Builder Models

Stores AI itinerary builder sessions and draft activities for review.
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Float, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base


class AISessionStatus(str, enum.Enum):
    """Status of AI builder session"""
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class DraftDecision(str, enum.Enum):
    """User decision for draft activity"""
    pending = "pending"
    create_new = "create_new"
    reuse_existing = "reuse_existing"


class AIBuilderSession(Base):
    """
    AI Builder Session - tracks a single AI itinerary building workflow.

    Flow:
    1. User pastes raw trip content
    2. AI parses and extracts activities with full enrichment
    3. System searches for similar existing activities
    4. LLM compares and suggests matches
    5. User reviews and decides (create new vs reuse)
    6. Template is created with all activities
    """
    __tablename__ = "ai_builder_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Status tracking
    status = Column(SQLEnum(AISessionStatus), default=AISessionStatus.pending, nullable=False, index=True)
    current_step = Column(Integer, default=1)  # 1-5 for progress tracking
    error_message = Column(Text, nullable=True)

    # Input data
    raw_content = Column(Text, nullable=False)  # Original pasted content
    destination = Column(String(255), nullable=True)  # User-provided or detected
    trip_title = Column(String(255), nullable=True)  # User-provided or detected
    num_days = Column(Integer, nullable=True)  # User-provided or detected

    # Parsed results
    detected_days = Column(Integer, nullable=True)  # AI-detected number of days
    parsed_summary = Column(JSON, nullable=True)  # {"stays": 1, "meals": 3, "experiences": 5}

    # Final results
    activities_created = Column(Integer, default=0)
    activities_reused = Column(Integer, default=0)
    template_id = Column(String(36), ForeignKey("templates.id", ondelete="SET NULL"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    agency = relationship("Agency")
    creator = relationship("User")
    template = relationship("Template")
    draft_activities = relationship(
        "AIBuilderDraftActivity",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="AIBuilderDraftActivity.day_number, AIBuilderDraftActivity.order_index"
    )

    def __repr__(self):
        return f"<AIBuilderSession(id={self.id}, status={self.status}, agency_id={self.agency_id})>"


class AIBuilderDraftActivity(Base):
    """
    Draft activity extracted by AI, pending user review.

    Contains ALL fields from Activity model (minus images) so AI can fully enrich.

    Each draft can be:
    - create_new: Create a new Activity from this draft
    - reuse_existing: Link to an existing Activity (matched_activity_id)
    """
    __tablename__ = "ai_builder_draft_activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("ai_builder_sessions.id", ondelete="CASCADE"), nullable=False, index=True)

    # Day assignment
    day_number = Column(Integer, nullable=False)
    order_index = Column(Integer, default=0)
    day_title = Column(String(255), nullable=True)  # e.g., "Arrival & Check-in"

    # ===== CORE ACTIVITY FIELDS (matching Activity model) =====

    # Basic Information
    name = Column(String(200), nullable=False)
    activity_type_id = Column(String(36), ForeignKey("activity_types.id", ondelete="SET NULL"), nullable=True)
    category_label = Column(String(50), nullable=True)  # "transfer", "relaxation", "dining"
    location_display = Column(String(200), nullable=True)

    # Descriptions (AI-enriched)
    short_description = Column(Text, nullable=True)  # 1-3 lines for lists
    client_description = Column(Text, nullable=True)  # Full paragraph for shared view

    # Duration
    default_duration_value = Column(Integer, nullable=True)
    default_duration_unit = Column(String(20), nullable=True)  # minutes/hours/days

    # Meta
    rating = Column(Float, nullable=True)  # 0.0 to 5.0
    group_size_label = Column(String(50), nullable=True)  # "Private", "Shared", "Max 10 people"

    # Cost
    cost_type = Column(String(20), default="included")  # "included" or "extra"
    cost_display = Column(String(100), nullable=True)  # e.g., "From $120 per person"
    price_numeric = Column(Float, nullable=True)
    currency_code = Column(String(10), default="INR")

    # JSON fields (AI-enriched)
    highlights = Column(JSON, nullable=True)  # Array of strings: ["Meet & Greet", "Welcome Drink"]
    tags = Column(JSON, nullable=True)  # Array of strings: ["Family-friendly", "Luxury"]
    vibe_tags = Column(JSON, nullable=True)  # Array of vibe_keys: ["adventure", "luxury"]

    # Additional meta
    marketing_badge = Column(String(50), nullable=True)  # e.g., "Popular", "New", "Limited"
    optimal_time_of_day = Column(String(50), nullable=True)  # e.g., "morning", "evening"

    # ===== MATCHING & COMPARISON FIELDS =====

    # Search results (from semantic/fuzzy search)
    search_matches = Column(JSON, nullable=True)  # Array of {activity_id, name, score}

    # LLM comparison results
    matched_activity_id = Column(String(36), ForeignKey("activities.id", ondelete="SET NULL"), nullable=True)
    match_score = Column(Float, nullable=True)  # 0-1 similarity score from LLM
    match_reasoning = Column(Text, nullable=True)  # LLM explanation for match/no-match

    # User decision
    decision = Column(SQLEnum(DraftDecision), default=DraftDecision.pending, nullable=False)

    # Final outcome (after template creation)
    created_activity_id = Column(String(36), ForeignKey("activities.id", ondelete="SET NULL"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("AIBuilderSession", back_populates="draft_activities")
    activity_type = relationship("ActivityType", foreign_keys=[activity_type_id])
    matched_activity = relationship("Activity", foreign_keys=[matched_activity_id])
    created_activity = relationship("Activity", foreign_keys=[created_activity_id])

    def __repr__(self):
        return f"<AIBuilderDraftActivity(id={self.id}, name={self.name}, day={self.day_number})>"
```

---

## 2. Backend Schemas (`backend/app/schemas/ai_builder.py`)

**Status: CREATED**

```python
"""Schemas for AI Itinerary Builder"""

from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# Status Response
class AIBuilderStatusResponse(BaseModel):
    """Response for AI builder status check"""
    enabled: bool
    agency_id: str
    agency_name: str


# Session Schemas
class AIBuilderSessionCreate(BaseModel):
    """Create a new AI builder session"""
    destination: Optional[str] = None
    trip_title: Optional[str] = None
    num_days: Optional[int] = None
    raw_content: str

    @field_validator('raw_content')
    @classmethod
    def validate_content(cls, v):
        if not v or len(v.strip()) < 50:
            raise ValueError('Trip content must be at least 50 characters')
        if len(v) > 50000:
            raise ValueError('Trip content must be less than 50,000 characters')
        return v.strip()


class AIBuilderSessionResponse(BaseModel):
    """Response for AI builder session"""
    id: str
    status: str  # pending, processing, completed, failed
    current_step: int  # 1-5
    error_message: Optional[str] = None
    destination: Optional[str] = None
    trip_title: Optional[str] = None
    num_days: Optional[int] = None
    detected_days: Optional[int] = None
    parsed_summary: Optional[Dict[str, int]] = None  # {"stays": 1, "meals": 3, "experiences": 5}
    activities_created: int = 0
    activities_reused: int = 0
    template_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Draft Activity Schemas
class DraftActivityResponse(BaseModel):
    """Response for a draft activity with all enriched fields"""
    id: str
    day_number: int
    order_index: int
    day_title: Optional[str] = None

    # Core fields
    name: str
    activity_type_id: Optional[str] = None
    activity_type_label: Optional[str] = None
    category_label: Optional[str] = None
    location_display: Optional[str] = None

    # Descriptions (AI-enriched)
    short_description: Optional[str] = None
    client_description: Optional[str] = None

    # Duration
    default_duration_value: Optional[int] = None
    default_duration_unit: Optional[str] = None
    optimal_time_of_day: Optional[str] = None

    # Cost
    cost_type: Optional[str] = None
    cost_display: Optional[str] = None
    price_numeric: Optional[float] = None
    currency_code: str = "INR"

    # Tags & Highlights (AI-enriched)
    highlights: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    vibe_tags: Optional[List[str]] = None

    # Meta
    group_size_label: Optional[str] = None
    marketing_badge: Optional[str] = None
    rating: Optional[float] = None

    # Match info
    matched_activity_id: Optional[str] = None
    matched_activity_name: Optional[str] = None
    match_score: Optional[float] = None
    match_reasoning: Optional[str] = None

    # Decision
    decision: str  # pending, create_new, reuse_existing

    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DraftActivityUpdate(BaseModel):
    """Update a draft activity - all editable fields"""
    name: Optional[str] = None
    activity_type_id: Optional[str] = None
    category_label: Optional[str] = None
    location_display: Optional[str] = None
    short_description: Optional[str] = None
    client_description: Optional[str] = None
    default_duration_value: Optional[int] = None
    default_duration_unit: Optional[str] = None
    optimal_time_of_day: Optional[str] = None
    cost_type: Optional[str] = None
    cost_display: Optional[str] = None
    price_numeric: Optional[float] = None
    currency_code: Optional[str] = None
    highlights: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    vibe_tags: Optional[List[str]] = None
    group_size_label: Optional[str] = None
    marketing_badge: Optional[str] = None
    rating: Optional[float] = None


class DraftDecision(BaseModel):
    """Set decision for a draft activity"""
    decision: str  # create_new | reuse_existing
    reuse_activity_id: Optional[str] = None  # Required if decision = reuse_existing

    @field_validator('decision')
    @classmethod
    def validate_decision(cls, v):
        if v not in ['create_new', 'reuse_existing']:
            raise ValueError('Decision must be "create_new" or "reuse_existing"')
        return v


class BulkDecision(BaseModel):
    """Apply bulk decision to draft activities"""
    action: str  # accept_all_new | auto_reuse_best | clear_all
    match_threshold: float = 0.85  # For auto_reuse_best

    @field_validator('action')
    @classmethod
    def validate_action(cls, v):
        if v not in ['accept_all_new', 'auto_reuse_best', 'clear_all']:
            raise ValueError('Action must be "accept_all_new", "auto_reuse_best", or "clear_all"')
        return v


class BulkDecisionResponse(BaseModel):
    """Response after applying bulk decision"""
    updated_count: int
    new_count: int
    reuse_count: int


# Template Creation Schemas
class TemplateCreateRequest(BaseModel):
    """Request to create template from session"""
    template_name: Optional[str] = None  # Override AI-suggested name


class NextStepItem(BaseModel):
    """A next step item in the checklist"""
    type: str  # missing_images | estimated_prices | fine_tune
    title: str
    detail: str
    count: Optional[int] = None
    action_url: Optional[str] = None


class TemplateCreationResponse(BaseModel):
    """Response after template creation"""
    template_id: str
    template_name: str
    destination: Optional[str] = None
    num_days: int
    activities_created: int
    activities_reused: int
    next_steps: List[NextStepItem]


# Day grouping for review screen
class DayGroup(BaseModel):
    """Group of activities for a day (for review screen)"""
    day_number: int
    day_title: Optional[str] = None
    activity_count: int


class DraftActivitiesWithDays(BaseModel):
    """Draft activities grouped with day metadata"""
    days: List[DayGroup]
    activities: List[DraftActivityResponse]
    total_activities: int
    total_new: int
    total_reuse: int
    total_pending: int
```

---

## 3. Parser Service - LLM Prompt #1 (`backend/app/services/ai_builder/parser_service.py`)

**Status: CREATED**

This prompt parses raw trip content and generates fully enriched activity data matching the Activity model.

```python
"""
AI Parser Service

Parses raw trip content and generates enriched activity data using LLM.
"""
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_builder import AIBuilderSession, AIBuilderDraftActivity, AISessionStatus
from app.models.activity_type import ActivityType

logger = logging.getLogger(__name__)


class AIParserService:
    """Parses trip content and generates enriched activities using LLM"""

    def __init__(self):
        self.client = self._safe_openai_client()

    def _safe_openai_client(self) -> Optional[OpenAI]:
        """Instantiate OpenAI client if key is present."""
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            logger.warning("OpenAI API key not configured")
            return None
        try:
            return OpenAI(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            return None

    def _build_enrichment_prompt(self, raw_content: str, destination: str, activity_types: List[Dict]) -> str:
        """Build the prompt for activity enrichment"""

        # Format activity types for the prompt
        types_list = "\n".join([f"- {t['id']}: {t['name']}" for t in activity_types])

        prompt = f"""You are a travel activity enrichment AI. Your task is to parse trip content and generate
catalog-quality activity data for a travel agency's activity library.

## DESTINATION:
{destination or "Not specified - infer from content"}

## RAW TRIP CONTENT:
{raw_content}

## AVAILABLE ACTIVITY TYPES (use exact IDs):
{types_list}

## YOUR TASK:
Extract each activity/experience mentioned and generate FULL catalog-quality data.

For EACH activity, generate:
1. **name**: Clear, descriptive name (e.g., "Sunrise Taj Mahal Tour" not just "Taj Mahal")
2. **activity_type_id**: Choose from the list above (use exact ID)
3. **category_label**: One of: transfer, accommodation, dining, experience, relaxation, adventure, cultural, nature
4. **location_display**: Specific location (e.g., "Agra, Uttar Pradesh" or "Jaipur City Palace")

5. **short_description**: 1-2 compelling sentences for list views
6. **client_description**: 3-5 sentence detailed description for travelers

7. **highlights**: Array of 3-5 key highlights (e.g., ["Skip-the-line entry", "Expert guide included", "Photo opportunities"])
8. **tags**: Array of relevant tags (e.g., ["UNESCO Site", "Photography", "History"])
9. **vibe_tags**: Array from: adventure, luxury, cultural, nature, relaxation, family, romantic, budget

10. **duration_value**: Number (e.g., 120 for 2 hours, 480 for full day)
11. **duration_unit**: "minutes" or "hours"
12. **optimal_time_of_day**: "morning", "afternoon", "evening", or "flexible"

13. **cost_type**: "included" (part of package) or "extra" (additional cost)
14. **cost_display**: Human-readable (e.g., "Included in package" or "From ₹2,500 per person")
15. **price_numeric**: Number or null (e.g., 2500)
16. **currency_code**: "INR", "USD", "EUR", etc.

17. **group_size_label**: e.g., "Private", "Small group (max 8)", "Shared"
18. **marketing_badge**: Optional - "Popular", "Must-Do", "Hidden Gem", "Signature Experience", or null
19. **rating**: Estimated rating 3.5-5.0 based on typical quality, or null

20. **day_number**: Which day of the trip (1, 2, 3...)
21. **day_title**: Thematic title for the day (e.g., "Arrival & First Impressions", "Ancient Wonders")

## OUTPUT FORMAT (JSON array, no markdown):
{{
  "destination": "Detected or provided destination",
  "trip_title": "Suggested trip title",
  "num_days": 5,
  "activities": [
    {{
      "day_number": 1,
      "day_title": "Arrival & First Impressions",
      "order_index": 0,
      "name": "Airport Welcome & Transfer",
      "activity_type_id": "uuid-from-list",
      "category_label": "transfer",
      "location_display": "Delhi Airport to Hotel",
      "short_description": "Warm welcome at Delhi airport with private transfer to your hotel.",
      "client_description": "Begin your journey with a seamless arrival experience. Our representative will greet you at Delhi International Airport with a personalized welcome sign. Enjoy a comfortable private transfer to your hotel in an air-conditioned vehicle, with a brief city orientation along the way.",
      "highlights": ["Meet & Greet service", "Private AC vehicle", "Hotel drop-off"],
      "tags": ["Airport Transfer", "Private"],
      "vibe_tags": ["luxury"],
      "duration_value": 60,
      "duration_unit": "minutes",
      "optimal_time_of_day": "flexible",
      "cost_type": "included",
      "cost_display": "Included in package",
      "price_numeric": null,
      "currency_code": "INR",
      "group_size_label": "Private",
      "marketing_badge": null,
      "rating": null
    }}
  ]
}}

## IMPORTANT RULES:
1. Generate REAL catalog-quality descriptions, not placeholders
2. Use professional travel industry language
3. Include specific details from the content when available
4. Estimate realistic durations based on activity type
5. Assign appropriate activity_type_id from the provided list
6. Group activities by day and provide thematic day titles
7. Output valid JSON only - no markdown code blocks"""

        return prompt

    def parse_trip_content(self, session: AIBuilderSession, db: Session) -> bool:
        """
        Parse trip content and create draft activities with full enrichment.

        Returns True on success, False on failure.
        """
        if not self.client:
            session.status = AISessionStatus.failed
            session.error_message = "AI service not configured"
            db.commit()
            return False

        try:
            # Get activity types for the prompt
            activity_types = db.query(ActivityType).filter(
                ActivityType.agency_id == session.agency_id
            ).all()

            types_list = [{"id": at.id, "name": at.name} for at in activity_types]

            # Build and execute prompt
            prompt = self._build_enrichment_prompt(
                raw_content=session.raw_content,
                destination=session.destination,
                activity_types=types_list
            )

            session.current_step = 2  # Parsing
            db.commit()

            completion = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a travel activity enrichment specialist.
Generate professional, catalog-quality activity data from trip descriptions.
Always output valid JSON. Never use markdown code blocks."""
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=8000
            )

            response_text = completion.choices[0].message.content if completion.choices else ""

            # Clean response
            response_text = response_text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            parsed_data = json.loads(response_text)

            # Update session with detected info
            session.current_step = 3
            session.detected_days = parsed_data.get("num_days")
            if not session.destination:
                session.destination = parsed_data.get("destination")
            if not session.trip_title:
                session.trip_title = parsed_data.get("trip_title")

            # Count activity types for summary
            activities = parsed_data.get("activities", [])
            summary = {"stays": 0, "meals": 0, "experiences": 0, "transfers": 0}
            for act in activities:
                cat = act.get("category_label", "").lower()
                if cat in ["accommodation"]:
                    summary["stays"] += 1
                elif cat in ["dining"]:
                    summary["meals"] += 1
                elif cat in ["transfer"]:
                    summary["transfers"] += 1
                else:
                    summary["experiences"] += 1

            session.parsed_summary = summary

            # Create draft activities
            session.current_step = 4
            db.commit()

            for act in activities:
                draft = AIBuilderDraftActivity(
                    session_id=session.id,
                    day_number=act.get("day_number", 1),
                    order_index=act.get("order_index", 0),
                    day_title=act.get("day_title"),
                    name=act.get("name", "Untitled Activity"),
                    activity_type_id=act.get("activity_type_id"),
                    category_label=act.get("category_label"),
                    location_display=act.get("location_display"),
                    short_description=act.get("short_description"),
                    client_description=act.get("client_description"),
                    default_duration_value=act.get("duration_value"),
                    default_duration_unit=act.get("duration_unit"),
                    optimal_time_of_day=act.get("optimal_time_of_day"),
                    cost_type=act.get("cost_type", "included"),
                    cost_display=act.get("cost_display"),
                    price_numeric=act.get("price_numeric"),
                    currency_code=act.get("currency_code", "INR"),
                    highlights=act.get("highlights"),
                    tags=act.get("tags"),
                    vibe_tags=act.get("vibe_tags"),
                    group_size_label=act.get("group_size_label"),
                    marketing_badge=act.get("marketing_badge"),
                    rating=act.get("rating")
                )
                db.add(draft)

            session.current_step = 5
            db.commit()

            return True

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response: {e}")
            session.status = AISessionStatus.failed
            session.error_message = f"Failed to parse AI response: {str(e)}"
            db.commit()
            return False

        except Exception as e:
            logger.error(f"AI parsing failed: {e}")
            session.status = AISessionStatus.failed
            session.error_message = f"AI processing error: {str(e)}"
            db.commit()
            return False


# Singleton
_parser_service = None


def get_parser_service() -> AIParserService:
    """Get or create parser service singleton"""
    global _parser_service
    if _parser_service is None:
        _parser_service = AIParserService()
    return _parser_service
```

---

## 4. Comparison Service - LLM Prompt #2 (`backend/app/services/ai_builder/comparison_service.py`)

**Status: CREATED**

This prompt compares parsed activities with existing library activities to find duplicates.

```python
"""
AI Comparison Service

Compares draft activities with existing library using semantic search + LLM.
"""
import json
import logging
from typing import Optional, Dict, Any, List

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_builder import AIBuilderSession, AIBuilderDraftActivity, DraftDecision
from app.models.activity import Activity
from app.services.search_service import search_service

logger = logging.getLogger(__name__)


class AIComparisonService:
    """Compares draft activities with existing library using LLM"""

    def __init__(self):
        self.client = self._safe_openai_client()

    def _safe_openai_client(self) -> Optional[OpenAI]:
        """Instantiate OpenAI client if key is present."""
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            return None
        try:
            return OpenAI(api_key=api_key)
        except Exception:
            return None

    def _build_comparison_prompt(
        self,
        draft: Dict[str, Any],
        candidates: List[Dict[str, Any]]
    ) -> str:
        """Build prompt for LLM to compare draft with candidates"""

        candidates_text = ""
        for i, cand in enumerate(candidates):
            candidates_text += f"""
### Candidate {i + 1} (ID: {cand['id']})
- Name: {cand['name']}
- Location: {cand.get('location', 'N/A')}
- Category: {cand.get('category', 'N/A')}
- Description: {cand.get('description', 'N/A')[:200]}...
"""

        prompt = f"""You are comparing a NEW activity (from a trip being imported) with EXISTING activities in a library.

## NEW ACTIVITY (being imported):
- Name: {draft['name']}
- Location: {draft.get('location', 'N/A')}
- Category: {draft.get('category', 'N/A')}
- Description: {draft.get('description', 'N/A')}

## EXISTING LIBRARY CANDIDATES:
{candidates_text}

## YOUR TASK:
Determine if the NEW activity is the SAME as any existing candidate.

IMPORTANT MATCHING RULES:
1. **SAME** = They represent the IDENTICAL venue/experience (e.g., "Taj Mahal Sunrise Tour" = "Sunrise Visit to Taj Mahal")
2. **NOT SAME** = Similar but different (e.g., "Taj Mahal" vs "Agra Fort" - both in Agra but different places)
3. **NOT SAME** = Same type but different place (e.g., "Delhi Airport Transfer" vs "Jaipur Airport Transfer")
4. **NOT SAME** = Generic vs Specific (e.g., "Dinner" vs "Dinner at Bukhara Restaurant")

Only match if you are HIGHLY CONFIDENT (>85%) they are the SAME activity.

## OUTPUT FORMAT (JSON only):
{{
  "has_match": true/false,
  "matched_candidate_id": "uuid-or-null",
  "match_score": 0.0-1.0,
  "reasoning": "Brief explanation of why they match or don't match"
}}

If no match, use: {{"has_match": false, "matched_candidate_id": null, "match_score": 0.0, "reasoning": "..."}}"""

        return prompt

    def compare_draft_with_library(
        self,
        draft: AIBuilderDraftActivity,
        agency_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Compare a single draft against the existing activity library.

        1. Use semantic search to find candidates
        2. Use LLM to compare and determine if any are the same

        Returns: {"matched": bool, "activity_id": str|None, "score": float, "reasoning": str}
        """
        # Step 1: Semantic search for candidates
        search_query = f"{draft.name} {draft.location_display or ''} {draft.category_label or ''}"

        try:
            search_results = search_service.search_activities(
                query=search_query,
                agency_id=agency_id,
                limit=5
            )
        except Exception as e:
            logger.warning(f"Search failed for draft {draft.id}: {e}")
            search_results = []

        # Store search results on draft
        draft.search_matches = [
            {"activity_id": r.get("id"), "name": r.get("name"), "score": r.get("score", 0)}
            for r in search_results
        ]

        if not search_results:
            return {"matched": False, "activity_id": None, "score": 0, "reasoning": "No similar activities found"}

        # Step 2: LLM comparison
        if not self.client:
            # No LLM available - use search score threshold
            best = search_results[0]
            if best.get("score", 0) > 0.9:
                return {
                    "matched": True,
                    "activity_id": best["id"],
                    "score": best["score"],
                    "reasoning": "High semantic similarity (LLM unavailable)"
                }
            return {"matched": False, "activity_id": None, "score": 0, "reasoning": "LLM unavailable for comparison"}

        try:
            # Prepare draft data
            draft_data = {
                "name": draft.name,
                "location": draft.location_display,
                "category": draft.category_label,
                "description": draft.short_description or draft.client_description
            }

            # Prepare candidates
            candidates = []
            for r in search_results[:5]:
                activity = db.query(Activity).filter(Activity.id == r["id"]).first()
                if activity:
                    candidates.append({
                        "id": activity.id,
                        "name": activity.name,
                        "location": activity.location_display,
                        "category": activity.category_label,
                        "description": activity.short_description or activity.client_description
                    })

            if not candidates:
                return {"matched": False, "activity_id": None, "score": 0, "reasoning": "No valid candidates found"}

            prompt = self._build_comparison_prompt(draft_data, candidates)

            completion = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at comparing travel activities. Be conservative - only match if truly the same. Output JSON only."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )

            response_text = completion.choices[0].message.content or ""
            response_text = response_text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            result = json.loads(response_text)

            return {
                "matched": result.get("has_match", False),
                "activity_id": result.get("matched_candidate_id"),
                "score": result.get("match_score", 0),
                "reasoning": result.get("reasoning", "")
            }

        except Exception as e:
            logger.error(f"LLM comparison failed: {e}")
            return {"matched": False, "activity_id": None, "score": 0, "reasoning": f"Comparison error: {str(e)}"}

    def compare_all_drafts(self, session: AIBuilderSession, db: Session) -> Dict[str, int]:
        """
        Compare all draft activities in a session with the library.

        Returns: {"total": N, "matched": M, "unmatched": K}
        """
        drafts = db.query(AIBuilderDraftActivity).filter(
            AIBuilderDraftActivity.session_id == session.id
        ).all()

        stats = {"total": len(drafts), "matched": 0, "unmatched": 0}

        for draft in drafts:
            result = self.compare_draft_with_library(draft, session.agency_id, db)

            draft.match_score = result.get("score", 0)
            draft.match_reasoning = result.get("reasoning", "")

            if result["matched"] and result["activity_id"]:
                draft.matched_activity_id = result["activity_id"]
                draft.decision = DraftDecision.reuse_existing
                stats["matched"] += 1
            else:
                draft.decision = DraftDecision.create_new
                stats["unmatched"] += 1

        db.commit()
        return stats


# Singleton
_comparison_service = None


def get_comparison_service() -> AIComparisonService:
    """Get or create comparison service singleton"""
    global _comparison_service
    if _comparison_service is None:
        _comparison_service = AIComparisonService()
    return _comparison_service
```

---

## 5. Template Builder Service - LLM Prompt #3 (`backend/app/services/ai_builder/template_builder_service.py`)

**Status: CREATED**

This prompt structures the final template data to match the exact database schema for `templates`, `template_days`, and `template_day_activities` tables.

```python
"""
Template Builder Service

Creates templates from reviewed draft activities using LLM for optimal structuring.
"""
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_builder import (
    AIBuilderSession,
    AIBuilderDraftActivity,
    DraftDecision as DraftDecisionEnum
)
from app.models.activity import Activity, DurationUnit, CostType
from app.models.template import Template, TemplateDay, TemplateDayActivity, TemplateStatus
from app.models.activity_image import ActivityImage
from app.schemas.ai_builder import TemplateCreationResponse, NextStepItem
from app.services.search_service import search_service

logger = logging.getLogger(__name__)


class AITemplateBuilderService:
    """Creates template from reviewed draft activities using LLM"""

    def __init__(self):
        self.client = self._safe_openai_client()

    def _safe_openai_client(self) -> Optional[OpenAI]:
        """Instantiate OpenAI client if key is present."""
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            logger.warning("OpenAI API key not configured")
            return None
        try:
            return OpenAI(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            return None

    def _build_template_structure_prompt(
        self,
        session: AIBuilderSession,
        activities_by_day: Dict[int, List[Dict[str, Any]]],
        activity_id_map: Dict[str, str]  # draft_index_key -> activity_id
    ) -> str:
        """
        Build prompt for LLM to structure the template.

        The LLM output must exactly match the TemplateCreate schema structure:
        - Template fields: description, approximate_price
        - Days: day_number, title, notes, activities[]
        - Activities: activity_id, item_type, custom_title, custom_payload, custom_icon,
                      display_order, time_slot, custom_notes, start_time, end_time, is_locked_by_agency
        """

        # Format activities for the prompt with their actual activity_ids
        activities_text = ""
        for day_num in sorted(activities_by_day.keys()):
            day_activities = activities_by_day[day_num]
            activities_text += f"\n### Day {day_num}:\n"
            for idx, act in enumerate(day_activities):
                # Get the actual activity_id for this draft
                activity_id = act.get('activity_id', 'unknown')
                activities_text += f"""
Activity #{idx} (activity_id: "{activity_id}")
  - Name: {act['name']}
  - Type: {act.get('activity_type', 'Experience')}
  - Location: {act.get('location', 'N/A')}
  - Duration: {act.get('duration_value', 60)} {act.get('duration_unit', 'minutes')}
  - Optimal time: {act.get('optimal_time', 'flexible')}
  - Description: {act.get('short_description', 'N/A')}
"""

        num_days = session.detected_days or len(activities_by_day)

        prompt = f"""You are a professional travel itinerary planner. Your task is to structure activities into a template
that will be saved to our database.

## Trip Details:
- Destination: {session.destination or 'Multi-destination'}
- Title: {session.trip_title or 'Untitled Trip'}
- Number of Days: {num_days}
- Number of Nights: {max(0, num_days - 1)}

## Activities by Day (with their database IDs):
{activities_text}

## OUTPUT REQUIREMENTS:

You must output JSON that matches our exact database schema:

### Template Level Fields:
- description: string (2-3 professional sentences about the trip)
- approximate_price: number (estimated total cost in local currency, or null)

### For Each Day (template_days table):
- day_number: integer (1, 2, 3...)
- title: string (engaging thematic title like "Ancient Wonders of Rome", not "Day 1")
- notes: string or null (brief overview, travel tips, what to expect)
- activities: array of activity items

### For Each Activity (template_day_activities table):
For LIBRARY_ACTIVITY items (activities from our catalog):
- activity_id: string (USE THE EXACT activity_id PROVIDED ABOVE)
- item_type: "LIBRARY_ACTIVITY"
- display_order: integer (0, 1, 2... for ordering within the day)
- time_slot: string ("Morning", "Afternoon", "Evening", or "Night")
- custom_notes: string or null (specific tips for this activity in context of this trip)
- start_time: string (HH:MM format like "09:00")
- end_time: string (HH:MM format, calculated from start + duration)
- is_locked_by_agency: boolean (true = traveler cannot swap this activity)

For LOGISTICS items (transfers, travel between places):
- activity_id: null
- item_type: "LOGISTICS"
- custom_title: string (e.g., "Airport Transfer", "Train to Florence")
- custom_payload: string (JSON string with extra details, e.g., '{{"notes": "45 min drive"}}')
- custom_icon: string (one of: "car", "plane", "train", "bus", "taxi", "hotel", "info")
- display_order: integer
- time_slot: string or null
- custom_notes: string or null
- start_time: string or null
- end_time: string or null
- is_locked_by_agency: true

For NOTE items (important information without activity):
- activity_id: null
- item_type: "NOTE"
- custom_title: string (the note title)
- custom_payload: string (JSON with note content)
- custom_icon: "info"
- display_order: integer
- time_slot: null
- custom_notes: null
- start_time: null
- end_time: null
- is_locked_by_agency: true

## OUTPUT FORMAT (JSON only, no markdown code blocks):
{{
  "description": "A captivating 2-3 sentence description of this travel experience...",
  "approximate_price": 1500,
  "days": [
    {{
      "day_number": 1,
      "title": "Arrival & First Impressions",
      "notes": "Brief day overview and helpful tips...",
      "activities": [
        {{
          "activity_id": null,
          "item_type": "LOGISTICS",
          "custom_title": "Airport Transfer",
          "custom_payload": "{{\\"notes\\": \\"Private car pickup from airport to hotel (45 mins)\\"}}",
          "custom_icon": "car",
          "display_order": 0,
          "time_slot": "Afternoon",
          "custom_notes": null,
          "start_time": "14:00",
          "end_time": "14:45",
          "is_locked_by_agency": true
        }},
        {{
          "activity_id": "actual-uuid-from-above",
          "item_type": "LIBRARY_ACTIVITY",
          "custom_title": null,
          "custom_payload": null,
          "custom_icon": null,
          "display_order": 1,
          "time_slot": "Afternoon",
          "custom_notes": "Best to arrive early to avoid crowds",
          "start_time": "15:00",
          "end_time": "17:00",
          "is_locked_by_agency": true
        }}
      ]
    }}
  ]
}}

## IMPORTANT RULES:
1. Use EXACT activity_id values from the activity list above - do not make up IDs
2. Use realistic times (breakfast 8-9am, lunch 12-1pm, dinner 7-9pm, etc.)
3. Account for travel time between activities
4. Add LOGISTICS items for:
   - Airport arrival/departure transfers on first/last days
   - Inter-city travel (train/flight when destination changes)
   - Check-in/check-out notes for hotels
5. Day titles should be thematic and engaging, never generic like "Day 1"
6. display_order must be sequential starting from 0 within each day
7. is_locked_by_agency should be true for most activities (travelers cannot swap)
8. custom_payload must be a valid JSON STRING (escaped quotes inside)"""

        return prompt

    def create_template_from_session(
        self,
        session: AIBuilderSession,
        template_name: Optional[str],
        user_id: str,
        db: Session
    ) -> TemplateCreationResponse:
        """
        Create template from reviewed draft activities using LLM for optimal structuring.

        The LLM generates data that directly matches the TemplateCreate schema:
        - Template fields: description, approximate_price
        - Days: day_number, title, notes, activities[]
        - Activities: activity_id, item_type, custom_title, custom_payload, custom_icon,
                      display_order, time_slot, custom_notes, start_time, end_time, is_locked_by_agency
        """
        # Get all draft activities
        drafts = db.query(AIBuilderDraftActivity).filter(
            AIBuilderDraftActivity.session_id == session.id
        ).order_by(
            AIBuilderDraftActivity.day_number,
            AIBuilderDraftActivity.order_index
        ).all()

        # First, create all activities and get their IDs
        created_activities: List[Activity] = []
        activity_map: Dict[str, str] = {}  # draft_id -> activity_id
        activities_created = 0
        activities_reused = 0

        for draft in drafts:
            if draft.decision == DraftDecisionEnum.reuse_existing:
                activity_id = draft.matched_activity_id
                activities_reused += 1
            else:
                activity = self._create_activity_from_draft(
                    draft=draft,
                    agency_id=session.agency_id,
                    session_id=session.id,
                    db=db
                )
                activity_id = activity.id
                created_activities.append(activity)
                activities_created += 1
                draft.created_activity_id = activity_id

            activity_map[draft.id] = activity_id

        db.flush()

        # Prepare activities by day for LLM prompt - now includes activity_id
        activities_by_day: Dict[int, List[Dict[str, Any]]] = {}
        draft_by_day: Dict[int, List[AIBuilderDraftActivity]] = {}

        for draft in drafts:
            if draft.day_number not in activities_by_day:
                activities_by_day[draft.day_number] = []
                draft_by_day[draft.day_number] = []

            activities_by_day[draft.day_number].append({
                "name": draft.name,
                "activity_type": draft.category_label or "Experience",
                "location": draft.location_display,
                "duration_value": draft.default_duration_value or 60,
                "duration_unit": draft.default_duration_unit or "minutes",
                "optimal_time": draft.optimal_time_of_day or "flexible",
                "short_description": draft.short_description,
                "activity_id": activity_map[draft.id],  # Include actual activity_id for LLM
            })
            draft_by_day[draft.day_number].append(draft)

        # Get LLM-generated template structure (now in exact schema format)
        template_structure = self._get_template_structure(session, activities_by_day, activity_map)

        # Determine template name
        final_name = template_name or session.trip_title or f"AI Generated - {session.destination or 'Trip'}"

        # Calculate duration
        max_day = max(d.day_number for d in drafts) if drafts else 1
        duration_days = max_day
        duration_nights = max(0, duration_days - 1)

        # Get template metadata from LLM or use defaults
        template_desc = "Generated from AI Itinerary Builder"
        approximate_price = None

        if template_structure:
            template_desc = template_structure.get("description", template_desc)
            if template_structure.get("approximate_price"):
                approximate_price = Decimal(str(template_structure["approximate_price"]))

        # Create template
        template = Template(
            agency_id=session.agency_id,
            name=final_name,
            destination=session.destination or "Various",
            duration_days=duration_days,
            duration_nights=duration_nights,
            description=template_desc,
            approximate_price=approximate_price,
            status=TemplateStatus.draft,
            created_by=user_id
        )
        db.add(template)
        db.flush()

        # Build a set of valid activity IDs for validation
        valid_activity_ids = set(activity_map.values())

        # Create template days and activities from LLM output
        if template_structure and "days" in template_structure:
            # Use LLM-generated structure directly (matches TemplateCreate schema)
            for llm_day in template_structure["days"]:
                day_number = llm_day.get("day_number", 1)

                # Create template day
                template_day = TemplateDay(
                    template_id=template.id,
                    day_number=day_number,
                    title=llm_day.get("title") or f"Day {day_number}",
                    notes=llm_day.get("notes")
                )
                db.add(template_day)
                db.flush()

                # Create activities from LLM output (already in correct format)
                for act_data in llm_day.get("activities", []):
                    item_type = act_data.get("item_type", "LIBRARY_ACTIVITY")
                    activity_id = act_data.get("activity_id")

                    # Validate activity_id for LIBRARY_ACTIVITY
                    if item_type == "LIBRARY_ACTIVITY":
                        if not activity_id or activity_id not in valid_activity_ids:
                            logger.warning(f"Invalid activity_id {activity_id} from LLM, skipping")
                            continue

                    template_activity = TemplateDayActivity(
                        template_day_id=template_day.id,
                        activity_id=activity_id if item_type == "LIBRARY_ACTIVITY" else None,
                        item_type=item_type,
                        custom_title=act_data.get("custom_title"),
                        custom_payload=act_data.get("custom_payload"),
                        custom_icon=act_data.get("custom_icon"),
                        display_order=act_data.get("display_order", 0),
                        time_slot=act_data.get("time_slot"),
                        custom_notes=act_data.get("custom_notes"),
                        start_time=act_data.get("start_time"),
                        end_time=act_data.get("end_time"),
                        is_locked_by_agency=1 if act_data.get("is_locked_by_agency", True) else 0
                    )
                    db.add(template_activity)
        else:
            # Fallback: create basic structure without LLM enhancements
            logger.warning("LLM structure not available, using fallback template creation")
            for day_number in sorted(draft_by_day.keys()):
                day_drafts = draft_by_day[day_number]

                # Create template day
                template_day = TemplateDay(
                    template_id=template.id,
                    day_number=day_number,
                    title=day_drafts[0].day_title or f"Day {day_number}",
                    notes=None
                )
                db.add(template_day)
                db.flush()

                # Create activities
                for idx, draft in enumerate(day_drafts):
                    template_activity = TemplateDayActivity(
                        template_day_id=template_day.id,
                        activity_id=activity_map[draft.id],
                        item_type="LIBRARY_ACTIVITY",
                        display_order=idx,
                        is_locked_by_agency=1
                    )
                    db.add(template_activity)

        # Update session
        session.template_id = template.id
        session.activities_created = activities_created
        session.activities_reused = activities_reused
        session.completed_at = datetime.utcnow()

        db.commit()

        # Index new activities in search
        for activity in created_activities:
            try:
                search_service.index_activity(activity)
            except Exception as e:
                logger.warning(f"Failed to index activity {activity.id}: {e}")

        # Calculate next steps
        next_steps = self._calculate_next_steps(
            template=template,
            created_activities=created_activities,
            db=db
        )

        return TemplateCreationResponse(
            template_id=template.id,
            template_name=template.name,
            destination=template.destination,
            num_days=template.duration_days,
            activities_created=activities_created,
            activities_reused=activities_reused,
            next_steps=next_steps
        )

    def _get_template_structure(
        self,
        session: AIBuilderSession,
        activities_by_day: Dict[int, List[Dict[str, Any]]],
        activity_id_map: Dict[str, str]
    ) -> Optional[Dict[str, Any]]:
        """
        Get LLM-generated template structure in exact TemplateCreate schema format.
        """
        if not self.client:
            logger.warning("OpenAI client not available, using default structure")
            return None

        try:
            prompt = self._build_template_structure_prompt(session, activities_by_day, activity_id_map)

            completion = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert travel itinerary planner creating data for a travel template database.

Your output must be valid JSON that exactly matches the database schema:
- Template: description, approximate_price
- Days: day_number, title, notes, activities[]
- Activities: activity_id, item_type, custom_title, custom_payload, custom_icon, display_order, time_slot, custom_notes, start_time, end_time, is_locked_by_agency

CRITICAL RULES:
1. Use EXACT activity_id values provided - never invent IDs
2. item_type must be "LIBRARY_ACTIVITY", "LOGISTICS", or "NOTE"
3. custom_payload must be a JSON STRING (with escaped quotes)
4. Reply ONLY with valid JSON - no markdown code blocks, no explanations"""
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=4000
            )

            response_text = completion.choices[0].message.content if completion.choices else ""

            # Clean response
            response_text = response_text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            return json.loads(response_text)

        except Exception as e:
            logger.error(f"Failed to get template structure from LLM: {e}")
            return None

    def _create_activity_from_draft(
        self,
        draft: AIBuilderDraftActivity,
        agency_id: str,
        session_id: str,
        db: Session
    ) -> Activity:
        """Create a new Activity from a draft with all enriched fields"""
        duration_unit = None
        if draft.default_duration_unit:
            unit_str = draft.default_duration_unit.lower()
            if unit_str in ["minutes", "hours", "days", "nights"]:
                duration_unit = DurationUnit(unit_str)
            else:
                duration_unit = DurationUnit.minutes

        cost_type = CostType.included
        if draft.cost_type:
            if draft.cost_type.lower() == "extra":
                cost_type = CostType.extra
        elif draft.price_numeric:
            cost_type = CostType.extra

        activity = Activity(
            agency_id=agency_id,
            activity_type_id=draft.activity_type_id,
            name=draft.name,
            category_label=draft.category_label,
            location_display=draft.location_display,
            short_description=draft.short_description,
            client_description=draft.client_description,
            default_duration_value=draft.default_duration_value,
            default_duration_unit=duration_unit,
            rating=draft.rating,
            group_size_label=draft.group_size_label,
            cost_type=cost_type,
            cost_display=draft.cost_display,
            price_numeric=draft.price_numeric,
            currency_code=draft.currency_code or "INR",
            highlights=draft.highlights,
            tags=draft.tags,
            vibe_tags=draft.vibe_tags,
            marketing_badge=draft.marketing_badge,
            optimal_time_of_day=draft.optimal_time_of_day,
            is_active=True,
            created_via_ai_builder=True,
            ai_builder_session_id=session_id
        )
        db.add(activity)
        db.flush()
        return activity

    def _calculate_next_steps(
        self,
        template: Template,
        created_activities: List[Activity],
        db: Session
    ) -> List[NextStepItem]:
        """Calculate next steps checklist for the user"""
        next_steps = []

        activities_without_images = 0
        for activity in created_activities:
            image_count = db.query(ActivityImage).filter(
                ActivityImage.activity_id == activity.id
            ).count()
            if image_count == 0:
                activities_without_images += 1

        if activities_without_images > 0:
            next_steps.append(NextStepItem(
                type="missing_images",
                title="Add images to activities",
                detail=f"{activities_without_images} {'activity' if activities_without_images == 1 else 'activities'} need images.",
                count=activities_without_images,
                action_url=f"/activities?filter=ai_session_{template.id}"
            ))

        activities_with_estimates = sum(1 for a in created_activities if a.price_numeric)
        if activities_with_estimates > 0:
            next_steps.append(NextStepItem(
                type="estimated_prices",
                title="Confirm prices",
                detail=f"{activities_with_estimates} {'activity has' if activities_with_estimates == 1 else 'activities have'} estimated prices.",
                count=activities_with_estimates,
                action_url=f"/activities?filter=ai_session_{template.id}"
            ))

        next_steps.append(NextStepItem(
            type="fine_tune",
            title="Fine-tune the template",
            detail="Review day flow, adjust timings, and add any missing details.",
            count=None,
            action_url=f"/templates/{template.id}/edit"
        ))

        return next_steps


# Singleton instance
_builder_service = None


def get_builder_service() -> AITemplateBuilderService:
    """Get or create builder service singleton"""
    global _builder_service
    if _builder_service is None:
        _builder_service = AITemplateBuilderService()
    return _builder_service
```

---

## 6. Service Exports (`backend/app/services/ai_builder/__init__.py`)

**Status: CREATED**

```python
"""AI Builder Services"""

from app.services.ai_builder.parser_service import AIParserService, get_parser_service
from app.services.ai_builder.comparison_service import AIComparisonService, get_comparison_service
from app.services.ai_builder.template_builder_service import AITemplateBuilderService

__all__ = [
    "AIParserService",
    "get_parser_service",
    "AIComparisonService",
    "get_comparison_service",
    "AITemplateBuilderService",
]
```

---

## 7. API Endpoints (`backend/app/api/v1/endpoints/ai_builder.py`)

**Status: CREATED**

```python
"""
AI Itinerary Builder API Endpoints

Provides endpoints for the AI-powered itinerary building workflow.
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.deps import get_db, get_current_user, get_current_agency_id, require_permission
from app.models.user import User
from app.models.agency import Agency
from app.models.activity import Activity
from app.models.activity_type import ActivityType
from app.models.ai_builder import (
    AIBuilderSession,
    AIBuilderDraftActivity,
    AISessionStatus,
    DraftDecision as DraftDecisionModel
)
from app.schemas.ai_builder import (
    AIBuilderStatusResponse,
    AIBuilderSessionCreate,
    AIBuilderSessionResponse,
    DraftActivityResponse,
    DraftActivityUpdate,
    DraftDecision,
    BulkDecision,
    BulkDecisionResponse,
    TemplateCreateRequest,
    TemplateCreationResponse,
    DayGroup,
    DraftActivitiesWithDays
)

router = APIRouter()


@router.get("/status", response_model=AIBuilderStatusResponse)
def get_ai_builder_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id)
):
    """Check if AI Builder is enabled for the agency"""
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    # Check if AI Builder module is enabled
    enabled_modules = agency.enabled_modules or []
    is_enabled = "ai_itinerary_builder" in enabled_modules

    return AIBuilderStatusResponse(
        enabled=is_enabled,
        agency_id=agency_id,
        agency_name=agency.name
    )


@router.post("/sessions", response_model=AIBuilderSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    data: AIBuilderSessionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.create"))
):
    """
    Create a new AI builder session and start processing.

    This will:
    1. Create a session record
    2. Kick off background AI processing
    3. Return session ID for polling
    """
    # Verify AI Builder is enabled
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    enabled_modules = agency.enabled_modules or []
    if "ai_itinerary_builder" not in enabled_modules:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Itinerary Builder is not enabled for this agency"
        )

    # Create session
    session = AIBuilderSession(
        agency_id=agency_id,
        created_by=current_user.id,
        raw_content=data.raw_content,
        destination=data.destination,
        trip_title=data.trip_title,
        num_days=data.num_days,
        status=AISessionStatus.pending,
        current_step=1
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Start background processing
    background_tasks.add_task(process_ai_session, session.id)

    return _session_to_response(session)


@router.get("/sessions/{session_id}", response_model=AIBuilderSessionResponse)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id)
):
    """Get session status and details"""
    session = db.query(AIBuilderSession).filter(
        AIBuilderSession.id == session_id,
        AIBuilderSession.agency_id == agency_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return _session_to_response(session)


@router.get("/sessions/{session_id}/activities", response_model=DraftActivitiesWithDays)
def get_session_activities(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id)
):
    """Get all draft activities for a session, grouped by day"""
    session = db.query(AIBuilderSession).filter(
        AIBuilderSession.id == session_id,
        AIBuilderSession.agency_id == agency_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get all drafts
    drafts = db.query(AIBuilderDraftActivity).filter(
        AIBuilderDraftActivity.session_id == session_id
    ).order_by(
        AIBuilderDraftActivity.day_number,
        AIBuilderDraftActivity.order_index
    ).all()

    # Build day groups
    day_groups = {}
    for draft in drafts:
        if draft.day_number not in day_groups:
            day_groups[draft.day_number] = {
                "day_number": draft.day_number,
                "day_title": draft.day_title,
                "activity_count": 0
            }
        day_groups[draft.day_number]["activity_count"] += 1

    days = [DayGroup(**dg) for dg in sorted(day_groups.values(), key=lambda x: x["day_number"])]

    # Convert drafts to responses
    activities = [_draft_to_response(d, db) for d in drafts]

    # Count decisions
    total_new = sum(1 for d in drafts if d.decision == DraftDecisionModel.create_new)
    total_reuse = sum(1 for d in drafts if d.decision == DraftDecisionModel.reuse_existing)
    total_pending = sum(1 for d in drafts if d.decision == DraftDecisionModel.pending)

    return DraftActivitiesWithDays(
        days=days,
        activities=activities,
        total_activities=len(drafts),
        total_new=total_new,
        total_reuse=total_reuse,
        total_pending=total_pending
    )


@router.put("/sessions/{session_id}/activities/{activity_id}", response_model=DraftActivityResponse)
def update_draft_activity(
    session_id: str,
    activity_id: str,
    data: DraftActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.create"))
):
    """Update a draft activity's fields"""
    draft = _get_draft_activity(session_id, activity_id, agency_id, db)

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(draft, field):
            setattr(draft, field, value)

    db.commit()
    db.refresh(draft)

    return _draft_to_response(draft, db)


@router.post("/sessions/{session_id}/activities/{activity_id}/decision", response_model=DraftActivityResponse)
def set_activity_decision(
    session_id: str,
    activity_id: str,
    data: DraftDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.create"))
):
    """Set decision for a draft activity"""
    draft = _get_draft_activity(session_id, activity_id, agency_id, db)

    if data.decision == "reuse_existing":
        if not data.reuse_activity_id:
            raise HTTPException(
                status_code=400,
                detail="reuse_activity_id required for reuse_existing decision"
            )
        # Verify activity exists
        activity = db.query(Activity).filter(
            Activity.id == data.reuse_activity_id,
            Activity.agency_id == agency_id
        ).first()
        if not activity:
            raise HTTPException(status_code=400, detail="Invalid reuse_activity_id")

        draft.decision = DraftDecisionModel.reuse_existing
        draft.matched_activity_id = data.reuse_activity_id
    else:
        draft.decision = DraftDecisionModel.create_new
        draft.matched_activity_id = None

    db.commit()
    db.refresh(draft)

    return _draft_to_response(draft, db)


@router.post("/sessions/{session_id}/bulk-decision", response_model=BulkDecisionResponse)
def apply_bulk_decision(
    session_id: str,
    data: BulkDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.create"))
):
    """Apply bulk decision to all draft activities"""
    session = db.query(AIBuilderSession).filter(
        AIBuilderSession.id == session_id,
        AIBuilderSession.agency_id == agency_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    drafts = db.query(AIBuilderDraftActivity).filter(
        AIBuilderDraftActivity.session_id == session_id
    ).all()

    new_count = 0
    reuse_count = 0

    if data.action == "accept_all_new":
        for draft in drafts:
            draft.decision = DraftDecisionModel.create_new
            draft.matched_activity_id = None
            new_count += 1

    elif data.action == "auto_reuse_best":
        for draft in drafts:
            if draft.match_score and draft.match_score >= data.match_threshold and draft.matched_activity_id:
                draft.decision = DraftDecisionModel.reuse_existing
                reuse_count += 1
            else:
                draft.decision = DraftDecisionModel.create_new
                draft.matched_activity_id = None
                new_count += 1

    elif data.action == "clear_all":
        for draft in drafts:
            draft.decision = DraftDecisionModel.pending
        # Return early for clear
        db.commit()
        return BulkDecisionResponse(updated_count=len(drafts), new_count=0, reuse_count=0)

    db.commit()

    return BulkDecisionResponse(
        updated_count=len(drafts),
        new_count=new_count,
        reuse_count=reuse_count
    )


@router.post("/sessions/{session_id}/create-template", response_model=TemplateCreationResponse)
def create_template_from_session(
    session_id: str,
    data: TemplateCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.create"))
):
    """Create template from reviewed draft activities"""
    from app.services.ai_builder.template_builder_service import get_builder_service

    session = db.query(AIBuilderSession).filter(
        AIBuilderSession.id == session_id,
        AIBuilderSession.agency_id == agency_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != AISessionStatus.completed:
        raise HTTPException(
            status_code=400,
            detail="Session must be completed before creating template"
        )

    if session.template_id:
        raise HTTPException(
            status_code=400,
            detail="Template already created for this session"
        )

    # Check all activities have decisions
    pending_count = db.query(AIBuilderDraftActivity).filter(
        AIBuilderDraftActivity.session_id == session_id,
        AIBuilderDraftActivity.decision == DraftDecisionModel.pending
    ).count()

    if pending_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"{pending_count} activities still pending decision"
        )

    builder_service = get_builder_service()
    result = builder_service.create_template_from_session(
        session=session,
        template_name=data.template_name,
        user_id=current_user.id,
        db=db
    )

    return result


# ============ Helper Functions ============

def _session_to_response(session: AIBuilderSession) -> AIBuilderSessionResponse:
    """Convert session model to response"""
    return AIBuilderSessionResponse(
        id=session.id,
        status=session.status.value,
        current_step=session.current_step,
        error_message=session.error_message,
        destination=session.destination,
        trip_title=session.trip_title,
        num_days=session.num_days,
        detected_days=session.detected_days,
        parsed_summary=session.parsed_summary,
        activities_created=session.activities_created,
        activities_reused=session.activities_reused,
        template_id=session.template_id,
        created_at=session.created_at,
        completed_at=session.completed_at
    )


def _draft_to_response(draft: AIBuilderDraftActivity, db: Session) -> DraftActivityResponse:
    """Convert draft activity model to response with all enriched fields"""
    # Get activity type label
    activity_type_label = None
    if draft.activity_type_id:
        activity_type = db.query(ActivityType).filter(
            ActivityType.id == draft.activity_type_id
        ).first()
        if activity_type:
            activity_type_label = activity_type.name

    # Get matched activity name if exists
    matched_activity_name = None
    if draft.matched_activity_id:
        matched = db.query(Activity).filter(
            Activity.id == draft.matched_activity_id
        ).first()
        if matched:
            matched_activity_name = matched.name

    return DraftActivityResponse(
        id=draft.id,
        day_number=draft.day_number,
        order_index=draft.order_index,
        day_title=draft.day_title,
        # Core fields
        name=draft.name,
        activity_type_id=draft.activity_type_id,
        activity_type_label=activity_type_label,
        category_label=draft.category_label,
        location_display=draft.location_display,
        # Descriptions
        short_description=draft.short_description,
        client_description=draft.client_description,
        # Duration
        default_duration_value=draft.default_duration_value,
        default_duration_unit=draft.default_duration_unit,
        optimal_time_of_day=draft.optimal_time_of_day,
        # Cost
        cost_type=draft.cost_type,
        cost_display=draft.cost_display,
        price_numeric=draft.price_numeric,
        currency_code=draft.currency_code or "INR",
        # Tags & Highlights
        highlights=draft.highlights,
        tags=draft.tags,
        vibe_tags=draft.vibe_tags,
        # Meta
        group_size_label=draft.group_size_label,
        marketing_badge=draft.marketing_badge,
        rating=draft.rating,
        # Match info
        matched_activity_id=draft.matched_activity_id,
        matched_activity_name=matched_activity_name,
        match_score=draft.match_score,
        match_reasoning=draft.match_reasoning,
        # Decision
        decision=draft.decision.value,
        # Timestamps
        created_at=draft.created_at,
        updated_at=draft.updated_at
    )


def _get_draft_activity(
    session_id: str,
    activity_id: str,
    agency_id: str,
    db: Session
) -> AIBuilderDraftActivity:
    """Get draft activity with validation"""
    draft = db.query(AIBuilderDraftActivity).join(AIBuilderSession).filter(
        AIBuilderDraftActivity.id == activity_id,
        AIBuilderDraftActivity.session_id == session_id,
        AIBuilderSession.agency_id == agency_id
    ).first()

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft activity not found"
        )

    return draft


async def process_ai_session(session_id: str):
    """
    Background task to process AI session.

    Flow:
    1. Parse trip content → Generate enriched activity data (parser_service)
    2. Search existing activities for each draft (comparison_service)
    3. LLM comparison → Determine highly similar matches (comparison_service)
    4. Mark session as completed
    """
    from app.db.session import SessionLocal
    from app.services.ai_builder.parser_service import get_parser_service
    from app.services.ai_builder.comparison_service import get_comparison_service

    db = SessionLocal()
    try:
        session = db.query(AIBuilderSession).filter(
            AIBuilderSession.id == session_id
        ).first()

        if not session:
            return

        # Update status to processing
        session.status = AISessionStatus.processing
        db.commit()

        # Step 1-5: Parse trip content and generate enriched activity data
        parser_service = get_parser_service()
        success = parser_service.parse_trip_content(session, db)

        if not success:
            # Parser already updated session with error
            return

        # Refresh session to get draft activities
        db.refresh(session)

        # Step 6: Compare drafts with existing library using LLM
        comparison_service = get_comparison_service()
        comparison_stats = comparison_service.compare_all_drafts(session, db)

        # Update session with stats
        session.activities_reused = comparison_stats.get("matched", 0)

        # Mark as completed
        session.status = AISessionStatus.completed
        session.completed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        if session:
            session.status = AISessionStatus.failed
            session.error_message = f"Processing error: {str(e)}"
            db.commit()
    finally:
        db.close()
```

---

## 8. Frontend Files (Summary)

**Status: CREATED**

The following frontend files were created in `frontend/src/features/ai-builder/`:

| File | Purpose |
|------|---------|
| `pages/AIBuilderEntryPage.tsx` | Step 1: Paste content form |
| `pages/ProcessingPage.tsx` | Step 2: Processing with progress |
| `pages/ReviewActivitiesPage.tsx` | Step 3: Review and decide on activities |
| `pages/TemplateCreatedPage.tsx` | Step 4: Success page with next steps |
| `api/aiBuilderAPI.ts` | API client functions |
| `index.ts` | Feature exports |

---

## Database Migration Required

A new Alembic migration is needed to create the tables:

```sql
-- ai_builder_sessions table
CREATE TABLE ai_builder_sessions (
    id VARCHAR(36) PRIMARY KEY,
    agency_id VARCHAR(36) NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    current_step INTEGER DEFAULT 1,
    error_message TEXT,
    raw_content TEXT NOT NULL,
    destination VARCHAR(255),
    trip_title VARCHAR(255),
    num_days INTEGER,
    detected_days INTEGER,
    parsed_summary JSON,
    activities_created INTEGER DEFAULT 0,
    activities_reused INTEGER DEFAULT 0,
    template_id VARCHAR(36) REFERENCES templates(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- ai_builder_draft_activities table
CREATE TABLE ai_builder_draft_activities (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL REFERENCES ai_builder_sessions(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    order_index INTEGER DEFAULT 0,
    day_title VARCHAR(255),

    -- Core fields (matching Activity model)
    name VARCHAR(200) NOT NULL,
    activity_type_id VARCHAR(36) REFERENCES activity_types(id) ON DELETE SET NULL,
    category_label VARCHAR(50),
    location_display VARCHAR(200),
    short_description TEXT,
    client_description TEXT,
    default_duration_value INTEGER,
    default_duration_unit VARCHAR(20),
    rating FLOAT,
    group_size_label VARCHAR(50),
    cost_type VARCHAR(20) DEFAULT 'included',
    cost_display VARCHAR(100),
    price_numeric FLOAT,
    currency_code VARCHAR(10) DEFAULT 'INR',
    highlights JSON,
    tags JSON,
    vibe_tags JSON,
    marketing_badge VARCHAR(50),
    optimal_time_of_day VARCHAR(50),

    -- Matching fields
    search_matches JSON,
    matched_activity_id VARCHAR(36) REFERENCES activities(id) ON DELETE SET NULL,
    match_score FLOAT,
    match_reasoning TEXT,

    -- Decision
    decision VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_activity_id VARCHAR(36) REFERENCES activities(id) ON DELETE SET NULL,

    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_sessions_agency ON ai_builder_sessions(agency_id);
CREATE INDEX idx_ai_sessions_status ON ai_builder_sessions(status);
CREATE INDEX idx_ai_drafts_session ON ai_builder_draft_activities(session_id);
```

---

## Summary of LLM Prompts

### Prompt #1: Activity Enrichment (parser_service.py)
**Purpose:** Parse raw trip content and generate catalog-quality activity data
**Input:** Raw text, destination, available activity types
**Output:** Array of fully enriched activities with all Activity model fields

### Prompt #2: Activity Comparison (comparison_service.py)
**Purpose:** Compare parsed activities with existing library to find duplicates
**Input:** Draft activity, list of candidate activities from search
**Output:** Match decision with score and reasoning

### Prompt #3: Template Structuring (template_builder_service.py)
**Purpose:** Structure activities into a template matching exact database schema
**Input:** Activities with their database IDs
**Output:** JSON matching TemplateCreate schema (template + days + activities)

---

## Agency Module Enable

To enable AI Builder for an agency, add `"ai_itinerary_builder"` to the agency's `enabled_modules` JSON array:

```sql
UPDATE agencies
SET enabled_modules = JSON_INSERT(COALESCE(enabled_modules, '[]'), '$[#]', 'ai_itinerary_builder')
WHERE id = 'agency-uuid';
```
