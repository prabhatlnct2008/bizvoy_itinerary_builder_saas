from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.db.session import get_db
from app.core.deps import get_current_user, get_current_agency_id, require_permission
from app.models.user import User
from app.models.activity import Activity
from app.models.activity_image import ActivityImage
from app.models.activity_type import ActivityType
from app.schemas.activity import (
    ActivityCreate,
    ActivityUpdate,
    ActivityListItem,
    ActivityDetailResponse,
    ActivityResponse,
    ActivityImageResponse,
    ImageUpdateRequest
)
from app.utils.file_storage import file_storage

router = APIRouter()


@router.get("", response_model=List[ActivityListItem])
def list_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.view")),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    activity_type_id: Optional[str] = None,
    location: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None
):
    """List activities with filtering and pagination"""
    query = db.query(Activity).options(
        joinedload(Activity.activity_type),
        joinedload(Activity.images)
    ).filter(Activity.agency_id == agency_id)

    # Apply filters
    if activity_type_id:
        query = query.filter(Activity.activity_type_id == activity_type_id)

    if location:
        query = query.filter(Activity.location_display.ilike(f"%{location}%"))

    if is_active is not None:
        query = query.filter(Activity.is_active == is_active)

    if search:
        query = query.filter(
            (Activity.name.ilike(f"%{search}%")) |
            (Activity.location_display.ilike(f"%{search}%")) |
            (Activity.short_description.ilike(f"%{search}%"))
        )

    # Order and paginate
    activities = query.order_by(Activity.updated_at.desc()).offset(skip).limit(limit).all()

    # Build response
    result = []
    for activity in activities:
        # Find hero image
        hero_image = next((img for img in activity.images if img.is_hero), None)
        if not hero_image and activity.images:
            hero_image = activity.images[0]

        result.append(ActivityListItem(
            id=activity.id,
            name=activity.name,
            activity_type_name=activity.activity_type.name if activity.activity_type else None,
            category_label=activity.category_label,
            location_display=activity.location_display,
            short_description=activity.short_description,
            hero_image_url=file_storage.get_file_url(hero_image.file_path) if hero_image else None,
            is_active=activity.is_active,
            updated_at=activity.updated_at
        ))

    return result


@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    activity_data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.create"))
):
    """Create a new activity"""
    # Verify activity type exists and belongs to agency
    activity_type = db.query(ActivityType).filter(
        ActivityType.id == activity_data.activity_type_id,
        ActivityType.agency_id == agency_id
    ).first()

    if not activity_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid activity type"
        )

    # Create activity
    activity = Activity(
        agency_id=agency_id,
        created_by_id=current_user.id,
        **activity_data.model_dump()
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity


@router.get("/{activity_id}", response_model=ActivityDetailResponse)
def get_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.view"))
):
    """Get activity details with images"""
    activity = db.query(Activity).options(
        joinedload(Activity.activity_type),
        joinedload(Activity.images)
    ).filter(
        Activity.id == activity_id,
        Activity.agency_id == agency_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    # Build response with images
    images = [
        ActivityImageResponse(
            id=img.id,
            activity_id=img.activity_id,
            file_path=img.file_path,
            file_url=file_storage.get_file_url(img.file_path),
            display_order=img.display_order,
            is_hero=img.is_hero,
            uploaded_at=img.uploaded_at
        )
        for img in sorted(activity.images, key=lambda x: x.display_order)
    ]

    return ActivityDetailResponse(
        id=activity.id,
        agency_id=activity.agency_id,
        activity_type_id=activity.activity_type_id,
        activity_type_name=activity.activity_type.name if activity.activity_type else None,
        created_by_id=activity.created_by_id,
        name=activity.name,
        category_label=activity.category_label,
        location_display=activity.location_display,
        short_description=activity.short_description,
        client_description=activity.client_description,
        default_duration_value=activity.default_duration_value,
        default_duration_unit=activity.default_duration_unit,
        rating=activity.rating,
        group_size_label=activity.group_size_label,
        cost_type=activity.cost_type,
        cost_display=activity.cost_display,
        highlights=activity.highlights or [],
        tags=activity.tags or [],
        is_active=activity.is_active,
        internal_notes=activity.internal_notes,
        created_at=activity.created_at,
        updated_at=activity.updated_at,
        images=images
    )


@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: str,
    activity_data: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.edit"))
):
    """Update an activity"""
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.agency_id == agency_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    # Verify activity type if being changed
    if activity_data.activity_type_id:
        activity_type = db.query(ActivityType).filter(
            ActivityType.id == activity_data.activity_type_id,
            ActivityType.agency_id == agency_id
        ).first()

        if not activity_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid activity type"
            )

    # Update fields
    update_data = activity_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(activity, field, value)

    db.commit()
    db.refresh(activity)

    return activity


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.delete"))
):
    """Delete an activity"""
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.agency_id == agency_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    # Delete associated images from storage
    for image in activity.images:
        file_storage.delete_file(image.file_path)

    db.delete(activity)
    db.commit()

    return None


@router.post("/{activity_id}/images", response_model=List[ActivityImageResponse])
async def upload_activity_images(
    activity_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.edit"))
):
    """Upload multiple images for an activity"""
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.agency_id == agency_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    # Get current max display_order
    current_max = db.query(ActivityImage).filter(
        ActivityImage.activity_id == activity_id
    ).count()

    uploaded_images = []

    for idx, file in enumerate(files):
        # Save file
        file_path = await file_storage.save_file(file, agency_id, "activities", activity_id)

        if not file_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to upload {file.filename}. Check file type and size."
            )

        # Create image record
        is_hero = current_max == 0 and idx == 0  # First image is hero if no images exist
        activity_image = ActivityImage(
            activity_id=activity_id,
            file_path=file_path,
            file_url=file_storage.get_file_url(file_path),
            display_order=current_max + idx,
            is_hero=is_hero,
            is_primary=is_hero,
        )

        db.add(activity_image)
        uploaded_images.append(activity_image)

    db.commit()

    # Refresh and return
    for img in uploaded_images:
        db.refresh(img)

    return [
        ActivityImageResponse(
            id=img.id,
            activity_id=img.activity_id,
            file_path=img.file_path,
            file_url=img.file_url,
            display_order=img.display_order,
            is_hero=img.is_hero,
            uploaded_at=img.uploaded_at
        )
        for img in uploaded_images
    ]


@router.put("/{activity_id}/images/{image_id}", response_model=ActivityImageResponse)
def update_activity_image(
    activity_id: str,
    image_id: str,
    image_data: ImageUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.edit"))
):
    """Update image order or hero status"""
    # Verify activity belongs to agency
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.agency_id == agency_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    # Get image
    image = db.query(ActivityImage).filter(
        ActivityImage.id == image_id,
        ActivityImage.activity_id == activity_id
    ).first()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )

    # Update is_hero - only one image can be hero
    if image_data.is_hero is not None:
        if image_data.is_hero:
            # Set all other images to not hero
            db.query(ActivityImage).filter(
                ActivityImage.activity_id == activity_id,
                ActivityImage.id != image_id
            ).update({"is_hero": False, "is_primary": False})

        image.is_hero = image_data.is_hero
        image.is_primary = image_data.is_hero

    # Update display_order
    if image_data.display_order is not None:
        image.display_order = image_data.display_order

    db.commit()
    db.refresh(image)

    return ActivityImageResponse(
        id=image.id,
        activity_id=image.activity_id,
        file_path=image.file_path,
        file_url=file_storage.get_file_url(image.file_path),
        display_order=image.display_order,
        is_hero=image.is_hero,
        uploaded_at=image.uploaded_at
    )


@router.delete("/{activity_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity_image(
    activity_id: str,
    image_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.edit"))
):
    """Delete an activity image"""
    # Verify activity belongs to agency
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.agency_id == agency_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    # Get image
    image = db.query(ActivityImage).filter(
        ActivityImage.id == image_id,
        ActivityImage.activity_id == activity_id
    ).first()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )

    # Delete file from storage
    file_storage.delete_file(image.file_path)

    # Delete record
    db.delete(image)
    db.commit()

    return None
