from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user, get_current_agency_id, require_permission
from app.core.security import get_password_hash
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserWithRolesResponse
from app.schemas.auth import MessageResponse
from app.models.user import User
from app.models.role import UserRole

router = APIRouter()


@router.get("", response_model=List[UserWithRolesResponse])
def get_users(
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users.view")),
    skip: int = 0,
    limit: int = 100
):
    """Get all users in the agency"""
    users = db.query(User).filter(
        User.agency_id == agency_id
    ).offset(skip).limit(limit).all()

    # Build response with role names
    result = []
    for user in users:
        role_names = [user_role.role.name for user_role in user.user_roles]
        result.append(UserWithRolesResponse(
            **user.__dict__,
            roles=role_names
        ))

    return result


@router.post("", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_permission("users.create")),
    db: Session = Depends(get_db)
):
    """Create a new user in the agency"""
    # Check if email already exists in this agency
    existing_user = db.query(User).filter(
        User.agency_id == current_user.agency_id,
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered in this agency"
        )

    # Create user
    user = User(
        agency_id=current_user.agency_id,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        is_active=user_data.is_active,
        is_superuser=user_data.is_superuser
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Assign roles if provided
    if user_data.role_ids:
        for role_id in user_data.role_ids:
            user_role = UserRole(user_id=user.id, role_id=role_id)
            db.add(user_role)
        db.commit()

    return user


@router.get("/{user_id}", response_model=UserWithRolesResponse)
def get_user(
    user_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users.view"))
):
    """Get user by ID"""
    user = db.query(User).filter(
        User.id == user_id,
        User.agency_id == agency_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get role names
    role_names = []
    for user_role in user.user_roles:
        role_names.append(user_role.role.name)

    response = UserWithRolesResponse(
        **user.__dict__,
        roles=role_names
    )
    return response


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_data: UserUpdate,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users.edit"))
):
    """Update user"""
    user = db.query(User).filter(
        User.id == user_id,
        User.agency_id == agency_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update fields
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.password is not None:
        user.hashed_password = get_password_hash(user_data.password)
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.is_superuser is not None:
        user.is_superuser = user_data.is_superuser

    # Update roles if provided
    if user_data.role_ids is not None:
        # Remove existing roles
        db.query(UserRole).filter(UserRole.user_id == user.id).delete()
        # Add new roles
        for role_id in user_data.role_ids:
            user_role = UserRole(user_id=user.id, role_id=role_id)
            db.add(user_role)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users.delete"))
):
    """Delete user"""
    user = db.query(User).filter(
        User.id == user_id,
        User.agency_id == agency_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return MessageResponse(message="User deleted successfully")
