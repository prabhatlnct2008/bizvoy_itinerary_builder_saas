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
from app.models.gamification import (
    PersonalizationSession,
    SessionStatus,
    UserDeckInteraction,
    InteractionAction,
    ItineraryCartItem,
    CartItemStatus,
    FitStatus,
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
    "PersonalizationSession",
    "SessionStatus",
    "UserDeckInteraction",
    "InteractionAction",
    "ItineraryCartItem",
    "CartItemStatus",
    "FitStatus",
]
