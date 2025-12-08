import os
import sys
import base64
import requests
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from typing import Optional, List, Dict, Any

# Help macOS find Homebrew-installed native libs required by WeasyPrint
if sys.platform == "darwin":
    homebrew_lib = "/opt/homebrew/lib"
    dyld_path = os.environ.get("DYLD_LIBRARY_PATH", "")
    if os.path.isdir(homebrew_lib) and homebrew_lib not in dyld_path.split(":"):
        os.environ["DYLD_LIBRARY_PATH"] = (
            f"{homebrew_lib}:{dyld_path}" if dyld_path else homebrew_lib
        )

# Optional import for PDF generation
try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except Exception as exc:
    WEASYPRINT_AVAILABLE = False
    print(
        f"Warning: weasyprint not available ({exc}). "
        "PDF generation will be disabled."
    )

from app.core.config import settings
from app.models.itinerary import Itinerary
from app.models.company_profile import CompanyProfile
from app.models.itinerary_pricing import ItineraryPricing
from sqlalchemy.orm import Session


class PDFService:
    def __init__(self):
        # Setup Jinja2 environment
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'pdf')
        self.env = Environment(loader=FileSystemLoader(template_dir))
        # Add custom filters
        self.env.filters['format_currency'] = self.format_currency
        self.env.filters['format_date'] = self.format_date
        self.env.filters['format_date_full'] = self.format_date_full
        self.env.filters['format_date_range'] = self.format_date_range

    @staticmethod
    def format_currency(value: float, currency: str = "INR") -> str:
        """Format currency with appropriate symbol"""
        if value is None:
            return ""
        symbols = {
            "INR": "₹",
            "USD": "$",
            "EUR": "€",
            "GBP": "£"
        }
        symbol = symbols.get(currency, currency + " ")
        return f"{symbol}{value:,.0f}"

    @staticmethod
    def format_date(date_obj) -> str:
        """Format date as 'Dec 15, 2024'"""
        if isinstance(date_obj, str):
            from datetime import datetime as dt
            date_obj = dt.fromisoformat(date_obj).date()
        return date_obj.strftime('%b %d, %Y')

    @staticmethod
    def format_date_full(date_obj) -> str:
        """Format date as 'Monday, December 15'"""
        if isinstance(date_obj, str):
            from datetime import datetime as dt
            date_obj = dt.fromisoformat(date_obj).date()
        return date_obj.strftime('%A, %B %d')

    @staticmethod
    def format_date_range(start_date, end_date) -> str:
        """Format date range as 'Dec 15, 2024 - Dec 21, 2024'"""
        start_str = PDFService.format_date(start_date)
        end_str = PDFService.format_date(end_date)
        return f"{start_str} - {end_str}"

    def image_to_base64(self, image_path: str) -> Optional[str]:
        """Convert image to base64 data URI for embedding in PDF"""
        if not image_path:
            return None

        try:
            # Handle relative paths - prepend upload directory
            if image_path.startswith('/uploads/'):
                full_path = os.path.join(settings.UPLOAD_DIR, image_path[9:])
            elif not os.path.isabs(image_path):
                full_path = os.path.join(settings.UPLOAD_DIR, image_path)
            else:
                full_path = image_path

            if os.path.exists(full_path):
                with open(full_path, 'rb') as f:
                    image_data = f.read()

                # Determine mime type
                ext = os.path.splitext(full_path)[1].lower()
                mime_types = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp'
                }
                mime_type = mime_types.get(ext, 'image/jpeg')

                base64_data = base64.b64encode(image_data).decode('utf-8')
                return f"data:{mime_type};base64,{base64_data}"
            else:
                print(f"Image file not found: {full_path}")
                return None
        except Exception as e:
            print(f"Error converting image to base64: {e}")
            return None

    def prepare_activity_data(self, activity_item, db: Session) -> Dict[str, Any]:
        """Prepare activity data with embedded images"""
        activity = activity_item.activity

        # Parse highlights
        highlights = []
        if activity.highlights:
            if isinstance(activity.highlights, list):
                highlights = activity.highlights
            else:
                try:
                    import json
                    highlights = json.loads(activity.highlights)
                except:
                    highlights = []

        # Process images and convert to base64
        images = []
        hero_image = None
        other_images = []

        for img in activity.images:
            img_data = {
                'base64': self.image_to_base64(img.file_path),
                'is_primary': getattr(img, 'is_primary', False),
                'is_hero': getattr(img, 'is_hero', False)
            }
            if img_data['base64']:
                images.append(img_data)
                if (img_data['is_hero'] or img_data['is_primary']) and not hero_image:
                    hero_image = img_data
                else:
                    other_images.append(img_data)

        # If no hero image set, use first image
        if not hero_image and images:
            hero_image = images[0]
            other_images = images[1:]

        # Format duration
        duration_text = None
        if activity.default_duration_value:
            unit = activity.default_duration_unit.value if activity.default_duration_unit else ''
            if unit == 'minutes':
                duration_text = f"{activity.default_duration_value} mins"
            elif unit == 'hours':
                duration_text = f"{activity.default_duration_value} hour{'s' if activity.default_duration_value != 1 else ''}"
            else:
                duration_text = f"{activity.default_duration_value} {unit}"

        # Format cost
        cost_text = "Included"
        if activity.cost_type and activity.cost_type.value != 'included':
            cost_text = activity.cost_display or "Extra"

        return {
            'id': activity_item.id,
            'time_slot': activity_item.time_slot or '—',
            'name': activity.name,
            'category_label': activity.category_label,
            'location_display': activity.location_display,
            'duration_text': duration_text,
            'description': activity.client_description or activity.short_description,
            'rating': float(activity.rating) if activity.rating else None,
            'group_size_label': activity.group_size_label or 'Private',
            'cost_text': cost_text,
            'cost_type': activity.cost_type.value if activity.cost_type else 'included',
            'highlights': highlights,
            'hero_image': hero_image,
            'other_images': other_images[:2],  # Max 2 thumbnails
            'custom_notes': activity_item.custom_notes
        }

    def prepare_day_data(self, day, db: Session) -> Dict[str, Any]:
        """Prepare day data with activities"""
        activities = []
        for activity_item in day.activities:
            activities.append(self.prepare_activity_data(activity_item, db))

        return {
            'day_number': day.day_number,
            'actual_date': day.actual_date,
            'title': day.title or f"Day {day.day_number}",
            'notes': day.notes,
            'activities_count': len(activities),
            'activities': activities
        }

    def count_activities_by_type(self, days, type_keyword: str) -> int:
        """Count activities by type keyword"""
        count = 0
        for day in days:
            for activity_item in day.activities:
                activity = activity_item.activity
                activity_type = activity.activity_type.name.lower() if activity.activity_type else ""
                category = (activity.category_label or "").lower()
                if type_keyword in activity_type or type_keyword in category:
                    count += 1
        return count

    def generate_itinerary_pdf(
        self,
        itinerary: Itinerary,
        db: Session
    ) -> str:
        """
        Generate PDF for itinerary

        Args:
            itinerary: Itinerary object with all relationships loaded
            db: Database session

        Returns:
            Relative file path to generated PDF
        """
        if not WEASYPRINT_AVAILABLE:
            raise RuntimeError("WeasyPrint is not installed. Install the weasyprint dependency to enable PDF export.")

        # Load company profile
        company_profile = db.query(CompanyProfile).filter(
            CompanyProfile.agency_id == itinerary.agency_id
        ).first()

        # Load pricing
        pricing = itinerary.pricing

        # Prepare days data
        days_data = []
        total_activities = 0
        for day in itinerary.days:
            day_data = self.prepare_day_data(day, db)
            days_data.append(day_data)
            total_activities += day_data['activities_count']

        # Calculate trip overview stats
        total_days = len(itinerary.days)
        total_nights = max(0, total_days - 1)

        accommodation_count = (
            self.count_activities_by_type(itinerary.days, "accommodation") +
            self.count_activities_by_type(itinerary.days, "hotel") +
            self.count_activities_by_type(itinerary.days, "stay")
        )
        meal_count = (
            self.count_activities_by_type(itinerary.days, "dining") +
            self.count_activities_by_type(itinerary.days, "meal") +
            self.count_activities_by_type(itinerary.days, "breakfast") +
            self.count_activities_by_type(itinerary.days, "lunch") +
            self.count_activities_by_type(itinerary.days, "dinner")
        )
        transfer_count = (
            self.count_activities_by_type(itinerary.days, "transfer") +
            self.count_activities_by_type(itinerary.days, "transport")
        )
        activity_count = max(0, total_activities - accommodation_count - meal_count - transfer_count)

        trip_overview = {
            'total_days': total_days,
            'total_nights': total_nights,
            'accommodation_count': accommodation_count,
            'activity_count': activity_count,
            'meal_count': meal_count,
            'transfer_count': transfer_count
        }

        # Parse client name
        name_parts = (itinerary.client_name or '').split(' ')
        first_name = name_parts[0] if name_parts else ''
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

        # Prepare company profile data
        company_data = None
        if company_profile:
            company_data = {
                'company_name': company_profile.company_name or itinerary.agency.name,
                'tagline': company_profile.tagline,
                'description': company_profile.description,
                'logo_base64': self.image_to_base64(company_profile.logo_path),
                'email': company_profile.email if company_profile.show_email else None,
                'phone': company_profile.phone if company_profile.show_phone else None,
                'website_url': company_profile.website_url if company_profile.show_website else None,
                'payment_qr_base64': self.image_to_base64(company_profile.payment_qr_path),
                'payment_note': company_profile.payment_note,
                'bank_account_name': company_profile.bank_account_name,
                'bank_name': company_profile.bank_name,
                'bank_account_number': company_profile.bank_account_number,
                'bank_ifsc_swift': company_profile.bank_ifsc_swift,
                'bank_reference_note': company_profile.bank_reference_note,
                'has_bank_details': bool(company_profile.bank_account_number or company_profile.bank_name)
            }
        else:
            company_data = {
                'company_name': itinerary.agency.name,
                'email': itinerary.agency.contact_email,
                'phone': itinerary.agency.contact_phone
            }

        # Prepare pricing data
        pricing_data = None
        if pricing:
            pricing_data = {
                'base_package': float(pricing.base_package) if pricing.base_package else None,
                'taxes_fees': float(pricing.taxes_fees) if pricing.taxes_fees else None,
                'discount_code': pricing.discount_code,
                'discount_amount': float(pricing.discount_amount) if pricing.discount_amount else None,
                'total': float(pricing.total) if pricing.total else None,
                'currency': pricing.currency or 'INR'
            }
        elif itinerary.total_price:
            pricing_data = {
                'total': float(itinerary.total_price),
                'currency': 'INR'
            }

        # Prepare template data
        template_data = {
            'itinerary': itinerary,
            'client_first_name': first_name,
            'client_last_name': last_name,
            'days': days_data,
            'trip_overview': trip_overview,
            'company': company_data,
            'pricing': pricing_data,
            'generated_at': datetime.utcnow(),
            'datetime': datetime
        }

        # Render HTML from template
        template = self.env.get_template('itinerary.html')
        html_content = template.render(**template_data)

        # Generate filename
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"{itinerary.id}_{timestamp}.pdf"

        # Ensure directory exists
        pdf_dir = os.path.join(settings.PDF_STORAGE_DIR, itinerary.agency_id)
        os.makedirs(pdf_dir, exist_ok=True)

        # Full path
        pdf_path = os.path.join(pdf_dir, filename)

        # Generate PDF with A4 size
        HTML(string=html_content).write_pdf(pdf_path)

        # Return relative path
        return os.path.join(itinerary.agency_id, filename)


pdf_service = PDFService()
