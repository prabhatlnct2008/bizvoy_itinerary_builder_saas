from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Body
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Any
import json
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
    ImageUpdateRequest,
    ActivitySearchRequest
)
from app.utils.file_storage import file_storage
from app.services.search_service import search_service

router = APIRouter()


def build_activity_detail_response(activity: Activity) -> ActivityDetailResponse:
    """Map Activity ORM instance to ActivityDetailResponse with image URLs."""
    def ensure_list(value: Any) -> List[Any]:
        """Convert JSON/text field into a list for pydantic."""
        if value is None:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                # Fall back to wrapping the string
                return [value]
        return []

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
        highlights=ensure_list(activity.highlights),
        tags=ensure_list(activity.tags),
        vibe_tags=ensure_list(activity.vibe_tags),
        is_active=activity.is_active,
        internal_notes=activity.internal_notes,
        created_at=activity.created_at,
        updated_at=activity.updated_at,
        images=images
    )


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


@router.post("/search", response_model=List[ActivityDetailResponse])
def search_activities(
    search_request: ActivitySearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.view"))
):
    """Semantic search for activities (top-N) using Chroma."""
    results = search_service.search_activities(
        agency_id=agency_id,
        query=search_request.query,
        limit=search_request.limit,
        db=db
    )

    if not results:
        return []

    # Filter by type/active while preserving similarity ordering
    filtered_activities: List[Activity] = []
    for item in results:
        activity = item.get("activity") if isinstance(item, dict) else None
        if not activity:
            continue
        if search_request.activity_type_id and activity.activity_type_id != search_request.activity_type_id:
            continue
        if search_request.is_active is not None and activity.is_active != search_request.is_active:
            continue
        filtered_activities.append(activity)
        if len(filtered_activities) >= search_request.limit:
            break

    return [build_activity_detail_response(activity) for activity in filtered_activities]


@router.post("/search/reindex")
def reindex_activity_search(
    reindex_request: Optional[dict] = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.edit"))
):
    """Reindex all active activities for the current agency into Chroma."""
    activity_ids = []
    if reindex_request and isinstance(reindex_request, dict):
        activity_ids = reindex_request.get("activity_ids") or []

    if activity_ids:
        # Reindex only the provided IDs (that belong to the agency and are active)
        activities = db.query(Activity).filter(
            Activity.id.in_(activity_ids),
            Activity.agency_id == agency_id,
            Activity.is_active == True
        ).all()

        indexed = 0
        for activity in activities:
            if search_service.index_activity(activity):
                indexed += 1

        return {"indexed": indexed, "requested": len(activity_ids)}

    # Fallback: reindex all active activities
    indexed = search_service.reindex_all_activities(agency_id=agency_id, db=db)
    return {"indexed": indexed}


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

    # Index for semantic search if active
    if activity.is_active:
        search_service.index_activity(activity)

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

    return build_activity_detail_response(activity)


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

    previous_active_status = activity.is_active

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

    # Keep search index in sync
    if activity.is_active:
        search_service.index_activity(activity)
    elif previous_active_status:
        search_service.delete_activity(agency_id, activity.id)

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

    # Remove from search index
    search_service.delete_activity(agency_id, activity.id)

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
