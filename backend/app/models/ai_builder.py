"""
AI Builder Models

Models for tracking AI-powered itinerary building sessions and draft activities.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Integer, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import JSON
from datetime import datetime
import uuid
import enum
from app.db.session import Base


class AISessionStatus(str, enum.Enum):
    """Status of an AI builder session"""
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class DraftDecision(str, enum.Enum):
    """User decision for a draft activity"""
    pending = "pending"
    create_new = "create_new"
    reuse_existing = "reuse_existing"


class AIBuilderSession(Base):
    """
    Tracks an AI builder session from paste to template creation.

    Flow:
    1. User pastes trip content → session created with status=pending
    2. AI parsing starts → status=processing, current_step updates 1→5
    3. Parsing complete → status=completed, draft_activities populated
    4. User reviews & creates template → template_id populated
    """
    __tablename__ = "ai_builder_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Input data
    destination = Column(String(255), nullable=True)
    trip_title = Column(String(255), nullable=True)
    num_days = Column(Integer, nullable=True)
    raw_content = Column(Text, nullable=False)

    # Processing status
    status = Column(SQLEnum(AISessionStatus), default=AISessionStatus.pending, nullable=False, index=True)
    current_step = Column(Integer, default=1)  # 1-5 for progress stages
    error_message = Column(Text, nullable=True)

    # Results (JSON stored for flexibility)
    parsed_summary = Column(JSON, nullable=True)  # {"stays": 1, "meals": 3, "experiences": 5, "transfers": 2}
    detected_days = Column(Integer, nullable=True)  # Number of days detected by AI

    # Outcome tracking
    template_id = Column(String(36), ForeignKey("templates.id", ondelete="SET NULL"), nullable=True)
    activities_created = Column(Integer, default=0)
    activities_reused = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    agency = relationship("Agency", back_populates="ai_builder_sessions")
    user = relationship("User", foreign_keys=[user_id])
    template = relationship("Template", foreign_keys=[template_id])
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
