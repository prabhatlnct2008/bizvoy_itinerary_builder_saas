# Models package
# Import all models here to ensure SQLAlchemy relationships are properly resolved
# The order matters - base models should be imported before models that reference them

from app.models.agency import Agency
from app.models.user import User
from app.models.role import Permission, Role, RolePermission, UserRole
from app.models.activity_type import ActivityType
from app.models.activity import Activity
from app.models.activity_image import ActivityImage
from app.models.template import Template, TemplateDay, TemplateDayActivity
from app.models.itinerary import Itinerary, ItineraryDay, ItineraryDayActivity
from app.models.itinerary_pricing import ItineraryPricing
from app.models.share import ShareLink, PDFExport
from app.models.company_profile import CompanyProfile

# Gamification models
from app.models.agency_vibe import AgencyVibe
from app.models.agency_personalization_settings import (
    AgencyPersonalizationSettings,
    PersonalizationPolicy,
)
from app.models.personalization_session import PersonalizationSession, SessionStatus
from app.models.user_deck_interaction import UserDeckInteraction, InteractionAction
from app.models.itinerary_cart_item import (
    ItineraryCartItem,
    CartItemStatus,
    FitStatus,
    TimeSlot,
)

__all__ = [
    "Agency",
    "User",
    "Permission",
    "Role",
    "RolePermission",
    "UserRole",
    "ActivityType",
    "Activity",
    "ActivityImage",
    "Template",
    "TemplateDay",
    "TemplateDayActivity",
    "Itinerary",
    "ItineraryDay",
    "ItineraryDayActivity",
    "ItineraryPricing",
    "ShareLink",
    "PDFExport",
    "CompanyProfile",
    # Gamification models
    "AgencyVibe",
    "AgencyPersonalizationSettings",
    "PersonalizationPolicy",
    "PersonalizationSession",
    "SessionStatus",
    "UserDeckInteraction",
    "InteractionAction",
    "ItineraryCartItem",
    "CartItemStatus",
    "FitStatus",
    "TimeSlot",
]
