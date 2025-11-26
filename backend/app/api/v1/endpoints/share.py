from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
from app.core.deps import get_db, get_current_agency_id, require_permission
from app.schemas.share import ShareLinkCreate, ShareLinkUpdate, ShareLinkResponse, PDFExportResponse
from app.schemas.auth import MessageResponse
from app.models.share import ShareLink, PDFExport
from app.models.itinerary import Itinerary
from app.models.user import User
from app.services.pdf_service import pdf_service
from app.core.config import settings

router = APIRouter()


@router.post("/{itinerary_id}/share", response_model=ShareLinkResponse)
def create_share_link(
    itinerary_id: str,
    data: ShareLinkCreate,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.share"))
):
    """Generate share link for itinerary"""
    # Check itinerary exists
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    # Check if share link already exists
    existing_link = db.query(ShareLink).filter(
        ShareLink.itinerary_id == itinerary_id,
        ShareLink.is_active == True
    ).first()

    if existing_link:
        # Update existing link
        existing_link.live_updates_enabled = data.live_updates_enabled
        existing_link.expires_at = data.expires_at
        db.commit()
        db.refresh(existing_link)
        return existing_link

    # Create new share link
    share_link = ShareLink(
        itinerary_id=itinerary_id,
        token=ShareLink.generate_token(),
        live_updates_enabled=data.live_updates_enabled,
        expires_at=data.expires_at
    )
    db.add(share_link)
    db.commit()
    db.refresh(share_link)

    return share_link


@router.put("/share-links/{link_id}", response_model=ShareLinkResponse)
def update_share_link(
    link_id: str,
    data: ShareLinkUpdate,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.share"))
):
    """Update share link settings"""
    share_link = db.query(ShareLink).join(Itinerary).filter(
        ShareLink.id == link_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not share_link:
        raise HTTPException(status_code=404, detail="Share link not found")

    # Update fields
    if data.is_active is not None:
        share_link.is_active = data.is_active
    if data.live_updates_enabled is not None:
        share_link.live_updates_enabled = data.live_updates_enabled
    if data.expires_at is not None:
        share_link.expires_at = data.expires_at

    db.commit()
    db.refresh(share_link)

    return share_link


@router.post("/{itinerary_id}/export-pdf", response_model=PDFExportResponse)
def export_pdf(
    itinerary_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.export"))
):
    """Generate PDF export of itinerary"""
    # Check itinerary exists
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    # Generate PDF
    try:
        file_path = pdf_service.generate_itinerary_pdf(itinerary, db)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

    # Create export record
    pdf_export = PDFExport(
        itinerary_id=itinerary_id,
        file_path=file_path,
        generated_by=current_user.id
    )
    db.add(pdf_export)
    db.commit()
    db.refresh(pdf_export)

    return pdf_export


@router.get("/{itinerary_id}/pdf/{export_id}")
def download_pdf(
    itinerary_id: str,
    export_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itineraries.export"))
):
    """Download generated PDF"""
    # Get export record
    pdf_export = db.query(PDFExport).join(Itinerary).filter(
        PDFExport.id == export_id,
        PDFExport.itinerary_id == itinerary_id,
        Itinerary.agency_id == agency_id
    ).first()

    if not pdf_export:
        raise HTTPException(status_code=404, detail="PDF export not found")

    # Check file exists
    full_path = os.path.join(settings.PDF_STORAGE_DIR, pdf_export.file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="PDF file not found")

    # Return file
    return FileResponse(
        path=full_path,
        media_type='application/pdf',
        filename=f"itinerary_{itinerary_id}.pdf"
    )
