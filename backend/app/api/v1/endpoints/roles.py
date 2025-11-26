from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_agency_id, require_permission
from app.schemas.role import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    RoleWithPermissionsResponse,
    PermissionResponse
)
from app.schemas.auth import MessageResponse
from app.models.role import Role, Permission, RolePermission
from app.models.user import User

router = APIRouter()


@router.get("/permissions", response_model=List[PermissionResponse])
def get_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("roles.view"))
):
    """Get all system permissions"""
    permissions = db.query(Permission).all()
    return permissions


@router.get("", response_model=List[RoleResponse])
def get_roles(
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("roles.view")),
    skip: int = 0,
    limit: int = 100
):
    """Get all roles in the agency"""
    roles = db.query(Role).filter(
        Role.agency_id == agency_id
    ).offset(skip).limit(limit).all()
    return roles


@router.post("", response_model=RoleWithPermissionsResponse)
def create_role(
    role_data: RoleCreate,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("roles.create"))
):
    """Create a new role"""
    # Check if role name already exists in agency
    existing_role = db.query(Role).filter(
        Role.agency_id == agency_id,
        Role.name == role_data.name
    ).first()

    if existing_role:
        raise HTTPException(status_code=400, detail="Role name already exists in this agency")

    # Create role
    role = Role(
        agency_id=agency_id,
        name=role_data.name,
        description=role_data.description
    )
    db.add(role)
    db.commit()
    db.refresh(role)

    # Assign permissions
    if role_data.permission_ids:
        for permission_id in role_data.permission_ids:
            role_permission = RolePermission(
                role_id=role.id,
                permission_id=permission_id
            )
            db.add(role_permission)
        db.commit()
        db.refresh(role)

    # Get permissions for response
    permissions = []
    for rp in role.role_permissions:
        permissions.append(PermissionResponse.model_validate(rp.permission))

    response = RoleWithPermissionsResponse(
        **role.__dict__,
        permissions=permissions
    )
    return response


@router.get("/{role_id}", response_model=RoleWithPermissionsResponse)
def get_role(
    role_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("roles.view"))
):
    """Get role by ID with permissions"""
    role = db.query(Role).filter(
        Role.id == role_id,
        Role.agency_id == agency_id
    ).first()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Get permissions
    permissions = []
    for rp in role.role_permissions:
        permissions.append(PermissionResponse.model_validate(rp.permission))

    response = RoleWithPermissionsResponse(
        **role.__dict__,
        permissions=permissions
    )
    return response


@router.put("/{role_id}", response_model=RoleWithPermissionsResponse)
def update_role(
    role_id: str,
    role_data: RoleUpdate,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("roles.edit"))
):
    """Update role"""
    role = db.query(Role).filter(
        Role.id == role_id,
        Role.agency_id == agency_id
    ).first()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Update fields
    if role_data.name is not None:
        role.name = role_data.name
    if role_data.description is not None:
        role.description = role_data.description

    # Update permissions if provided
    if role_data.permission_ids is not None:
        # Remove existing permissions
        db.query(RolePermission).filter(RolePermission.role_id == role.id).delete()

        # Add new permissions
        for permission_id in role_data.permission_ids:
            role_permission = RolePermission(
                role_id=role.id,
                permission_id=permission_id
            )
            db.add(role_permission)

    db.commit()
    db.refresh(role)

    # Get permissions for response
    permissions = []
    for rp in role.role_permissions:
        permissions.append(PermissionResponse.model_validate(rp.permission))

    response = RoleWithPermissionsResponse(
        **role.__dict__,
        permissions=permissions
    )
    return response


@router.delete("/{role_id}", response_model=MessageResponse)
def delete_role(
    role_id: str,
    agency_id: str = Depends(get_current_agency_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("roles.delete"))
):
    """Delete role"""
    role = db.query(Role).filter(
        Role.id == role_id,
        Role.agency_id == agency_id
    ).first()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    db.delete(role)
    db.commit()
    return MessageResponse(message="Role deleted successfully")
