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
