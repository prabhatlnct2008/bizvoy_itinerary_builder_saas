"""
Vibe Service for managing agency vibes
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.agency_vibe import AgencyVibe
from app.schemas.gamification import AgencyVibeCreate, AgencyVibeUpdate
import uuid


# Global vibe seeds
GLOBAL_VIBES = [
    {"vibe_key": "adventure", "display_name": "Adventure", "emoji": "🏔️", "color_hex": "#FF6B35"},
    {"vibe_key": "luxury", "display_name": "Luxury", "emoji": "💎", "color_hex": "#C77DFF"},
    {"vibe_key": "culture", "display_name": "Culture", "emoji": "🎭", "color_hex": "#4EA8DE"},
    {"vibe_key": "relaxation", "display_name": "Relaxation", "emoji": "🧘", "color_hex": "#90E0EF"},
    {"vibe_key": "foodie", "display_name": "Foodie", "emoji": "🍽️", "color_hex": "#F77F00"},
    {"vibe_key": "nature", "display_name": "Nature", "emoji": "🌿", "color_hex": "#38B000"},
    {"vibe_key": "family", "display_name": "Family-Friendly", "emoji": "👨‍👩‍👧‍👦", "color_hex": "#FFB703"},
    {"vibe_key": "romantic", "display_name": "Romantic", "emoji": "💕", "color_hex": "#E63946"},
    {"vibe_key": "nightlife", "display_name": "Nightlife", "emoji": "🎉", "color_hex": "#9D4EDD"},
    {"vibe_key": "wellness", "display_name": "Wellness", "emoji": "💆", "color_hex": "#06FFA5"},
]


class VibeService:
    """Service for managing agency vibes"""

    @staticmethod
    def get_agency_vibes(db: Session, agency_id: str) -> List[AgencyVibe]:
        """Get all vibes for an agency"""
        return db.query(AgencyVibe).filter(
            AgencyVibe.agency_id == agency_id
        ).order_by(AgencyVibe.display_order).all()

    @staticmethod
    def get_enabled_vibes(db: Session, agency_id: str) -> List[AgencyVibe]:
        """Get only enabled vibes for an agency"""
        return db.query(AgencyVibe).filter(
            AgencyVibe.agency_id == agency_id,
            AgencyVibe.is_enabled == True
        ).order_by(AgencyVibe.display_order).all()

    @staticmethod
    def create_vibe(
        db: Session,
        agency_id: str,
        vibe_data: AgencyVibeCreate
    ) -> AgencyVibe:
        """Create a new custom vibe"""
        vibe = AgencyVibe(
            id=str(uuid.uuid4()),
            agency_id=agency_id,
            vibe_key=vibe_data.vibe_key,
            display_name=vibe_data.display_name,
            emoji=vibe_data.emoji,
            color_hex=vibe_data.color_hex,
            is_global=False,
            is_enabled=vibe_data.is_enabled,
            display_order=vibe_data.display_order,
        )
        db.add(vibe)
        db.commit()
        db.refresh(vibe)
        return vibe

    @staticmethod
    def update_vibe(
        db: Session,
        vibe_id: str,
        vibe_data: AgencyVibeUpdate
    ) -> Optional[AgencyVibe]:
        """Update an existing vibe"""
        vibe = db.query(AgencyVibe).filter(AgencyVibe.id == vibe_id).first()
        if not vibe:
            return None

        update_data = vibe_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(vibe, field, value)

        db.commit()
        db.refresh(vibe)
        return vibe

    @staticmethod
    def delete_vibe(db: Session, vibe_id: str) -> bool:
        """Delete a custom vibe (can't delete global vibes)"""
        vibe = db.query(AgencyVibe).filter(
            AgencyVibe.id == vibe_id,
            AgencyVibe.is_global == False
        ).first()

        if not vibe:
            return False

        db.delete(vibe)
        db.commit()
        return True

    @staticmethod
    def reorder_vibes(db: Session, agency_id: str, vibe_order: List[str]) -> bool:
        """Reorder vibes by ID list"""
        for index, vibe_id in enumerate(vibe_order):
            vibe = db.query(AgencyVibe).filter(
                AgencyVibe.id == vibe_id,
                AgencyVibe.agency_id == agency_id
            ).first()
            if vibe:
                vibe.display_order = index

        db.commit()
        return True

    @staticmethod
    def seed_global_vibes(db: Session, agency_id: str) -> int:
        """Seed global vibes for a new agency"""
        # Check if already seeded
        existing = db.query(AgencyVibe).filter(
            AgencyVibe.agency_id == agency_id
        ).first()

        if existing:
            return 0

        count = 0
        for idx, vibe_data in enumerate(GLOBAL_VIBES):
            vibe = AgencyVibe(
                id=str(uuid.uuid4()),
                agency_id=agency_id,
                vibe_key=vibe_data["vibe_key"],
                display_name=vibe_data["display_name"],
                emoji=vibe_data["emoji"],
                color_hex=vibe_data["color_hex"],
                is_global=True,
                is_enabled=True,
                display_order=idx,
            )
            db.add(vibe)
            count += 1

        db.commit()
        return count
