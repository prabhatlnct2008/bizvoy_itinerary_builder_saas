"""
Settings Service for managing agency personalization settings
"""
from typing import Optional
from sqlalchemy.orm import Session
from app.models.agency_personalization_settings import (
    AgencyPersonalizationSettings,
    PersonalizationPolicy,
)
from app.schemas.gamification import AgencyPersonalizationSettingsUpdate
import uuid


class SettingsService:
    """Service for managing agency personalization settings"""

    @staticmethod
    def get_settings(
        db: Session,
        agency_id: str
    ) -> Optional[AgencyPersonalizationSettings]:
        """Get personalization settings for an agency"""
        return db.query(AgencyPersonalizationSettings).filter(
            AgencyPersonalizationSettings.agency_id == agency_id
        ).first()

    @staticmethod
    def update_settings(
        db: Session,
        agency_id: str,
        settings_data: AgencyPersonalizationSettingsUpdate
    ) -> AgencyPersonalizationSettings:
        """Update personalization settings (creates if not exists)"""
        settings = SettingsService.get_settings(db, agency_id)

        if not settings:
            settings = SettingsService.create_default_settings(db, agency_id)

        update_data = settings_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)

        db.commit()
        db.refresh(settings)
        return settings

    @staticmethod
    def create_default_settings(
        db: Session,
        agency_id: str
    ) -> AgencyPersonalizationSettings:
        """Create default settings for a new agency"""
        settings = AgencyPersonalizationSettings(
            id=str(uuid.uuid4()),
            agency_id=agency_id,
            is_enabled=False,
            default_deck_size=20,
            personalization_policy=PersonalizationPolicy.flexible,
            default_currency="USD",
            show_readiness_warnings=True,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings

    @staticmethod
    def is_enabled(db: Session, agency_id: str) -> bool:
        """Check if personalization is enabled for an agency"""
        settings = SettingsService.get_settings(db, agency_id)
        return settings.is_enabled if settings else False
