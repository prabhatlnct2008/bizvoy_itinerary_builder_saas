from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import get_current_user, get_current_agency_id, require_permission
from app.models.user import User
from app.models.activity_type import ActivityType
from app.schemas.activity_type import ActivityTypeCreate, ActivityTypeUpdate, ActivityTypeResponse

router = APIRouter()


@router.get("/", response_model=List[ActivityTypeResponse])
def list_activity_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.view"))
):
    """List all activity types for the current agency"""
    activity_types = db.query(ActivityType).filter(
        ActivityType.agency_id == agency_id
    ).order_by(ActivityType.name).all()

    return activity_types


@router.post("/", response_model=ActivityTypeResponse, status_code=status.HTTP_201_CREATED)
def create_activity_type(
    activity_type_data: ActivityTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.create"))
):
    """Create a new activity type"""
    # Check if activity type with same name already exists
    existing = db.query(ActivityType).filter(
        ActivityType.agency_id == agency_id,
        ActivityType.name == activity_type_data.name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Activity type '{activity_type_data.name}' already exists"
        )

    # Create new activity type
    activity_type = ActivityType(
        agency_id=agency_id,
        **activity_type_data.model_dump()
    )

    db.add(activity_type)
    db.commit()
    db.refresh(activity_type)

    return activity_type


@router.put("/{activity_type_id}", response_model=ActivityTypeResponse)
def update_activity_type(
    activity_type_id: str,
    activity_type_data: ActivityTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.edit"))
):
    """Update an activity type"""
    activity_type = db.query(ActivityType).filter(
        ActivityType.id == activity_type_id,
        ActivityType.agency_id == agency_id
    ).first()

    if not activity_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity type not found"
        )

    # Check for name conflict if name is being updated
    if activity_type_data.name and activity_type_data.name != activity_type.name:
        existing = db.query(ActivityType).filter(
            ActivityType.agency_id == agency_id,
            ActivityType.name == activity_type_data.name,
            ActivityType.id != activity_type_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Activity type '{activity_type_data.name}' already exists"
            )

    # Update fields
    update_data = activity_type_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(activity_type, field, value)

    db.commit()
    db.refresh(activity_type)

    return activity_type


@router.delete("/{activity_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity_type(
    activity_type_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
    _: None = Depends(require_permission("activities.delete"))
):
    """Delete an activity type"""
    activity_type = db.query(ActivityType).filter(
        ActivityType.id == activity_type_id,
        ActivityType.agency_id == agency_id
    ).first()

    if not activity_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity type not found"
        )

    # Check if any activities use this type
    from app.models.activity import Activity
    activities_count = db.query(Activity).filter(
        Activity.activity_type_id == activity_type_id
    ).count()

    if activities_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete activity type. {activities_count} activity(ies) are using it."
        )

    db.delete(activity_type)
    db.commit()

    return None
