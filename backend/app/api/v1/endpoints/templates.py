from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.core.deps import get_db, get_current_user, get_current_agency_id, require_permission
from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateDetailResponse,
    TemplateListItem,
    TemplateDayCreate,
    TemplateDayUpdate,
    TemplateDayResponse,
    TemplateDayDetailResponse,
    TemplateDayActivityResponse,
    AttachActivityRequest,
    ReorderRequest,
    DayReorderRequest,
    ActivityListItem
)
from app.schemas.auth import MessageResponse
from app.models.template import Template, TemplateDay, TemplateDayActivity, TemplateStatus
from app.models.user import User
from app.models.activity import Activity
from app.models.activity_type import ActivityType
from app.models.activity_image import ActivityImage
from app.models.itinerary import Itinerary
from app.utils.file_storage import file_storage

router = APIRouter()


@router.get("", response_model=List[TemplateListItem])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.view")),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """List templates with filtering and pagination.

    Status filter:
    - None or empty: excludes archived (shows draft + published)
    - "all": shows all templates including archived
    - "draft", "published", "archived": shows only that status
    """
    query = db.query(Template).filter(Template.agency_id == agency_id)

    # Apply status filter
    if status:
        if status.lower() == "all":
            # Show all templates including archived
            pass
        else:
            # Filter by specific status
            query = query.filter(Template.status == status)
    else:
        # Default: exclude archived templates
        query = query.filter(Template.status != TemplateStatus.archived)

    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Template.name.ilike(search_term)) |
            (Template.destination.ilike(search_term)) |
            (Template.description.ilike(search_term))
        )

    # Order and paginate
    templates = query.order_by(Template.updated_at.desc()).offset(skip).limit(limit).all()

    # Build response with usage count
    result = []
    for template in templates:
        # Count how many itineraries use this template
        usage_count = db.query(func.count(Itinerary.id)).filter(
            Itinerary.template_id == template.id
        ).scalar() or 0

        result.append(TemplateListItem(
            id=template.id,
            name=template.name,
            destination=template.destination,
            duration_nights=template.duration_nights,
            duration_days=template.duration_days,
            status=template.status.value if hasattr(template.status, 'value') else template.status,
            updated_at=template.updated_at,
            usage_count=usage_count
        ))

    return result


@router.post("", response_model=TemplateDetailResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.create"))
):
    """Create new template with days and activities"""
    # Create template
    template = Template(
        agency_id=current_user.agency_id,
        name=data.name,
        destination=data.destination,
        duration_days=data.duration_days,
        duration_nights=data.duration_nights,
        description=data.description,
        approximate_price=data.approximate_price,
        created_by=current_user.id,
        status=TemplateStatus.draft
    )
    db.add(template)
    db.flush()

    # Create days and activities
    for day_data in data.days:
        day = TemplateDay(
            template_id=template.id,
            day_number=day_data.day_number,
            title=day_data.title,
            notes=day_data.notes
        )
        db.add(day)
        db.flush()

        # Create activities for this day
        for activity_data in day_data.activities:
            activity = TemplateDayActivity(
                template_day_id=day.id,
                activity_id=activity_data.activity_id,
                display_order=activity_data.display_order,
                time_slot=activity_data.time_slot,
                custom_notes=activity_data.custom_notes
            )
            db.add(activity)

    db.commit()
    db.refresh(template)

    # Build response
    return _build_template_detail_response(template, db)


@router.get("/{template_id}", response_model=TemplateDetailResponse)
def get_template(
    template_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("templates.view"))
):
    """Get template by ID with full structure"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return _build_template_detail_response(template, db)


@router.put("/{template_id}", response_model=TemplateDetailResponse)
def update_template(
    template_id: str,
    data: TemplateUpdate,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("templates.edit"))
):
    """Update template"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Update basic fields
    if data.name is not None:
        template.name = data.name
    if data.destination is not None:
        template.destination = data.destination
    if data.duration_days is not None:
        template.duration_days = data.duration_days
    if data.duration_nights is not None:
        template.duration_nights = data.duration_nights
    if data.description is not None:
        template.description = data.description
    if data.approximate_price is not None:
        template.approximate_price = data.approximate_price

    # Update days if provided
    if data.days is not None:
        # Delete existing days (cascade will delete activities)
        db.query(TemplateDay).filter(TemplateDay.template_id == template.id).delete()

        # Create new days
        for day_data in data.days:
            day = TemplateDay(
                template_id=template.id,
                day_number=day_data.day_number,
                title=day_data.title,
                notes=day_data.notes
            )
            db.add(day)
            db.flush()

            # Create activities
            for activity_data in day_data.activities:
                activity = TemplateDayActivity(
                    template_day_id=day.id,
                    activity_id=activity_data.activity_id,
                    display_order=activity_data.display_order,
                    time_slot=activity_data.time_slot,
                    custom_notes=activity_data.custom_notes
                )
                db.add(activity)

    db.commit()
    db.refresh(template)

    return _build_template_detail_response(template, db)


@router.post("/{template_id}/publish", response_model=TemplateResponse)
def publish_template(
    template_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("templates.edit"))
):
    """Publish template (change status to published)"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    template.status = TemplateStatus.published
    db.commit()
    db.refresh(template)

    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.delete"))
):
    """Delete template"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    db.delete(template)
    db.commit()
    return None


@router.post("/{template_id}/copy", response_model=TemplateDetailResponse, status_code=status.HTTP_201_CREATED)
def copy_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.create"))
):
    """Clone a template with all days and activities.

    Creates a new template with:
    - Name: "Original Name (Copy)"
    - Status: draft
    - All days and activities copied
    """
    # Get original template with all related data
    original = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Create new template
    new_template = Template(
        agency_id=original.agency_id,
        name=f"{original.name} (Copy)",
        destination=original.destination,
        duration_days=original.duration_days,
        duration_nights=original.duration_nights,
        description=original.description,
        approximate_price=original.approximate_price,
        created_by=current_user.id,
        status=TemplateStatus.draft
    )
    db.add(new_template)
    db.flush()

    # Copy days and activities
    for day in sorted(original.days, key=lambda d: d.day_number):
        new_day = TemplateDay(
            template_id=new_template.id,
            day_number=day.day_number,
            title=day.title,
            notes=day.notes
        )
        db.add(new_day)
        db.flush()

        # Copy activities for this day
        for activity in sorted(day.activities, key=lambda a: a.display_order):
            new_activity = TemplateDayActivity(
                template_day_id=new_day.id,
                activity_id=activity.activity_id,
                display_order=activity.display_order,
                time_slot=activity.time_slot,
                custom_notes=activity.custom_notes
            )
            db.add(new_activity)

    db.commit()
    db.refresh(new_template)

    return _build_template_detail_response(new_template, db)


@router.post("/{template_id}/archive", response_model=TemplateResponse)
def archive_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.delete"))
):
    """Archive a template (soft delete).

    Sets status to 'archived'. Template will be hidden from default list view
    but can be viewed with status=archived filter.
    """
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    template.status = TemplateStatus.archived
    db.commit()
    db.refresh(template)

    return template


@router.post("/{template_id}/unarchive", response_model=TemplateResponse)
def unarchive_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.edit"))
):
    """Unarchive a template (restore from archived state).

    Sets status back to 'draft'.
    """
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    if template.status != TemplateStatus.archived:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template is not archived"
        )

    template.status = TemplateStatus.draft
    db.commit()
    db.refresh(template)

    return template


# Day Management Endpoints

@router.post("/{template_id}/days", response_model=TemplateDayResponse, status_code=status.HTTP_201_CREATED)
def add_template_day(
    template_id: str,
    day_data: TemplateDayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.edit"))
):
    """Add a new day to template.

    If day_number is not provided, it will be auto-assigned as the next number.
    Duration is auto-synced after adding a day.
    """
    # Verify template exists and belongs to agency
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Determine day_number
    if day_data.day_number is not None:
        day_number = day_data.day_number
        # Check if day_number already exists
        existing_day = db.query(TemplateDay).filter(
            TemplateDay.template_id == template_id,
            TemplateDay.day_number == day_number
        ).first()

        if existing_day:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Day {day_number} already exists in this template"
            )
    else:
        # Auto-assign next day number
        max_day = db.query(func.max(TemplateDay.day_number)).filter(
            TemplateDay.template_id == template_id
        ).scalar() or 0
        day_number = max_day + 1

    # Determine title (default to "Day N" if not provided)
    title = day_data.title if day_data.title else f"Day {day_number}"

    # Create day
    day = TemplateDay(
        template_id=template_id,
        day_number=day_number,
        title=title,
        notes=day_data.notes
    )
    db.add(day)
    db.flush()

    # Auto-sync duration: days = source of truth
    total_days = db.query(TemplateDay).filter(
        TemplateDay.template_id == template_id
    ).count()
    template.duration_days = total_days
    template.duration_nights = max(total_days - 1, 0)

    db.commit()
    db.refresh(day)

    return day


@router.put("/{template_id}/days/{day_id}", response_model=TemplateDayResponse)
def update_template_day(
    template_id: str,
    day_id: str,
    day_data: TemplateDayUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.edit"))
):
    """Update a template day"""
    # Verify template belongs to agency
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Get day
    day = db.query(TemplateDay).filter(
        TemplateDay.id == day_id,
        TemplateDay.template_id == template_id
    ).first()

    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Day not found"
        )

    # Update fields
    if day_data.title is not None:
        day.title = day_data.title
    if day_data.notes is not None:
        day.notes = day_data.notes

    db.commit()
    db.refresh(day)

    return day


@router.delete("/{template_id}/days/{day_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template_day(
    template_id: str,
    day_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.edit"))
):
    """Delete a template day and auto-sync duration"""
    # Verify template belongs to agency
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Get day
    day = db.query(TemplateDay).filter(
        TemplateDay.id == day_id,
        TemplateDay.template_id == template_id
    ).first()

    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Day not found"
        )

    db.delete(day)

    # Auto-sync duration: days = source of truth
    remaining_days = db.query(TemplateDay).filter(
        TemplateDay.template_id == template_id
    ).count()
    template.duration_days = remaining_days
    template.duration_nights = max(remaining_days - 1, 0)

    # Renumber remaining days to keep sequence continuous
    remaining = db.query(TemplateDay).filter(
        TemplateDay.template_id == template_id
    ).order_by(TemplateDay.day_number).all()
    for idx, d in enumerate(remaining, start=1):
        d.day_number = idx

    db.commit()

    return None


@router.put("/{template_id}/days/reorder", response_model=TemplateDetailResponse)
def reorder_template_days(
    template_id: str,
    reorder_data: DayReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.edit"))
):
    """Reorder days within a template.

    Provide list of day IDs in the desired order. Day numbers will be
    updated to match the new order (1, 2, 3, ...).
    """
    # Verify template belongs to agency
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Get all days for this template
    days = db.query(TemplateDay).filter(
        TemplateDay.template_id == template_id
    ).all()

    # Create a map of day ID to day object
    day_map = {day.id: day for day in days}

    # Verify all IDs in request exist
    for day_id in reorder_data.day_ids:
        if day_id not in day_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Day {day_id} not found in this template"
            )

    # Verify we have all days (no missing or extra)
    if len(reorder_data.day_ids) != len(days):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide all day IDs in the desired order"
        )

    # Update day_number based on position in array (1-indexed)
    for idx, day_id in enumerate(reorder_data.day_ids, start=1):
        day_map[day_id].day_number = idx

    db.commit()
    db.refresh(template)

    return _build_template_detail_response(template, db)


# Activity Attachment Endpoints

@router.post("/{template_id}/days/{day_id}/activities", response_model=TemplateDayActivityResponse, status_code=status.HTTP_201_CREATED)
def attach_activity_to_day(
    template_id: str,
    day_id: str,
    attach_data: AttachActivityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.edit"))
):
    """Attach an activity to a template day"""
    # Verify template belongs to agency
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Verify day exists
    day = db.query(TemplateDay).filter(
        TemplateDay.id == day_id,
        TemplateDay.template_id == template_id
    ).first()

    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Day not found"
        )

    # Verify activity exists and belongs to agency
    activity = db.query(Activity).options(
        joinedload(Activity.activity_type)
    ).filter(
        Activity.id == attach_data.activity_id,
        Activity.agency_id == agency_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid activity"
        )

    # Check if activity already attached to this day
    existing = db.query(TemplateDayActivity).filter(
        TemplateDayActivity.template_day_id == day_id,
        TemplateDayActivity.activity_id == attach_data.activity_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Activity already attached to this day"
        )

    # Create attachment
    tda = TemplateDayActivity(
        template_day_id=day_id,
        activity_id=attach_data.activity_id,
        display_order=attach_data.display_order,
        custom_notes=attach_data.template_notes
    )
    db.add(tda)
    db.commit()
    db.refresh(tda)

    # Build response with activity details
    activity_item = ActivityListItem(
        id=activity.id,
        name=activity.name,
        activity_type_name=activity.activity_type.name if activity.activity_type else None,
        category_label=activity.category_label,
        location_display=activity.location_display,
        short_description=activity.short_description,
        hero_image_url=None,
        is_active=activity.is_active
    )

    return TemplateDayActivityResponse(
        id=tda.id,
        template_day_id=tda.template_day_id,
        activity_id=tda.activity_id,
        activity=activity_item,
        display_order=tda.display_order,
        time_slot=tda.time_slot,
        custom_notes=tda.custom_notes
    )


@router.delete("/{template_id}/days/{day_id}/activities/{tda_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_activity_from_day(
    template_id: str,
    day_id: str,
    tda_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.edit"))
):
    """Remove an activity from a template day"""
    # Verify template belongs to agency
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Get activity attachment
    tda = db.query(TemplateDayActivity).filter(
        TemplateDayActivity.id == tda_id,
        TemplateDayActivity.template_day_id == day_id
    ).first()

    if not tda:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity attachment not found"
        )

    db.delete(tda)
    db.commit()

    return None


@router.put("/{template_id}/days/{day_id}/activities/reorder", response_model=MessageResponse)
def reorder_day_activities(
    template_id: str,
    day_id: str,
    reorder_data: ReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("templates.edit"))
):
    """Reorder activities within a template day"""
    # Verify template belongs to agency
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.agency_id == agency_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Verify day exists
    day = db.query(TemplateDay).filter(
        TemplateDay.id == day_id,
        TemplateDay.template_id == template_id
    ).first()

    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Day not found"
        )

    # Get all activities for this day
    day_activities = db.query(TemplateDayActivity).filter(
        TemplateDayActivity.template_day_id == day_id
    ).all()

    # Create a map of activity ID to object
    activity_map = {tda.activity_id: tda for tda in day_activities}

    # Verify all IDs in request exist
    for activity_id in reorder_data.activity_ids:
        if activity_id not in activity_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Activity {activity_id} not found in this day"
            )

    # Update display_order based on position in array
    for idx, activity_id in enumerate(reorder_data.activity_ids):
        activity_map[activity_id].display_order = idx

    db.commit()

    return MessageResponse(message="Activities reordered successfully")


def _build_template_detail_response(template: Template, db: Session) -> TemplateDetailResponse:
    """Helper to build detailed template response with nested activity details"""
    days = []
    for day in sorted(template.days, key=lambda d: d.day_number):
        activities = []
        for tda in sorted(day.activities, key=lambda a: a.display_order):
            # Get activity with images
            activity = db.query(Activity).options(
                joinedload(Activity.activity_type),
                joinedload(Activity.images)
            ).filter(Activity.id == tda.activity_id).first()

            if activity:
                # Find hero image
                hero_image = next((img for img in activity.images if img.is_hero), None)
                if not hero_image and activity.images:
                    hero_image = activity.images[0]

                activity_item = ActivityListItem(
                    id=activity.id,
                    name=activity.name,
                    activity_type_name=activity.activity_type.name if activity.activity_type else None,
                    category_label=activity.category_label,
                    location_display=activity.location_display,
                    short_description=activity.short_description,
                    hero_image_url=file_storage.get_file_url(hero_image.file_path) if hero_image else None,
                    is_active=activity.is_active
                )

                activities.append(TemplateDayActivityResponse(
                    id=tda.id,
                    template_day_id=tda.template_day_id,
                    activity_id=tda.activity_id,
                    activity=activity_item,
                    display_order=tda.display_order,
                    time_slot=tda.time_slot,
                    custom_notes=tda.custom_notes
                ))

        days.append(TemplateDayDetailResponse(
            id=day.id,
            template_id=day.template_id,
            day_number=day.day_number,
            title=day.title,
            notes=day.notes,
            activities=activities
        ))

    return TemplateDetailResponse(
        id=template.id,
        agency_id=template.agency_id,
        name=template.name,
        destination=template.destination,
        duration_days=template.duration_days,
        duration_nights=template.duration_nights,
        description=template.description,
        approximate_price=template.approximate_price,
        status=template.status,
        created_by=template.created_by,
        created_at=template.created_at,
        updated_at=template.updated_at,
        days=days
    )
