# Import all models here so Alembic can detect them
from app.db.session import Base  # noqa

# Import models
from app.models.agency import Agency  # noqa
from app.models.user import User  # noqa
from app.models.role import Permission, Role, RolePermission, UserRole  # noqa
from app.models.activity_type import ActivityType  # noqa
from app.models.activity import Activity  # noqa
from app.models.activity_image import ActivityImage  # noqa
from app.models.template import Template, TemplateDay, TemplateDayActivity  # noqa
from app.models.itinerary import Itinerary, ItineraryDay, ItineraryDayActivity  # noqa
from app.models.share import ShareLink, PDFExport  # noqa
from app.models.company_profile import CompanyProfile  # noqa
from app.models.itinerary_pricing import ItineraryPricing  # noqa

# AI Builder models
from app.models.ai_builder import AIBuilderSession, AIBuilderDraftActivity  # noqa
