import os
from datetime import datetime
from jinja2 import Environment, FileSystemLoader

# Optional import for PDF generation
try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False
    print("Warning: weasyprint not available. PDF generation will be disabled.")

from app.core.config import settings
from app.models.itinerary import Itinerary
from sqlalchemy.orm import Session
from typing import Optional


class PDFService:
    def __init__(self):
        # Setup Jinja2 environment
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'pdf')
        self.env = Environment(loader=FileSystemLoader(template_dir))

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

        # Prepare data for template
        template_data = {
            'itinerary': itinerary,
            'agency': itinerary.agency,
            'generated_at': datetime.utcnow(),
            'base_url': settings.UPLOAD_DIR
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

        # Generate PDF
        HTML(string=html_content, base_url=settings.UPLOAD_DIR).write_pdf(pdf_path)

        # Return relative path
        return os.path.join(itinerary.agency_id, filename)


pdf_service = PDFService()
