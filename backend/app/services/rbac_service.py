from sqlalchemy.orm import Session
from app.models.user import User
from app.models.role import Permission, RolePermission, UserRole
from typing import List


def has_permission(user: User, codename: str, db: Session) -> bool:
    """Check if user has a specific permission"""
    # Superusers (agency admins) have all permissions
    if user.is_superuser:
        return True

    # Query user's permissions through their roles
    permission = db.query(Permission).join(
        RolePermission, RolePermission.permission_id == Permission.id
    ).join(
        UserRole, UserRole.role_id == RolePermission.role_id
    ).filter(
        UserRole.user_id == user.id,
        Permission.codename == codename
    ).first()

    return permission is not None


def get_user_permissions(user: User, db: Session) -> List[str]:
    """Get all permission codenames for a user"""
    # Superusers have all permissions
    if user.is_superuser:
        all_permissions = db.query(Permission).all()
        return [p.codename for p in all_permissions]

    # Query user's permissions through their roles
    permissions = db.query(Permission).join(
        RolePermission, RolePermission.permission_id == Permission.id
    ).join(
        UserRole, UserRole.role_id == RolePermission.role_id
    ).filter(
        UserRole.user_id == user.id
    ).all()

    return [p.codename for p in permissions]


def seed_permissions(db: Session) -> None:
    """Seed initial system permissions"""
    modules = ["users", "roles", "activities", "templates", "itineraries"]
    actions = ["view", "create", "edit", "delete", "export", "share"]

    permissions_to_create = []

    for module in modules:
        for action in actions:
            # Skip invalid combinations
            if module in ["users", "roles"] and action in ["export", "share"]:
                continue
            if module == "activities" and action in ["export", "share"]:
                continue
            if module == "templates" and action in ["export", "share"]:
                continue

            codename = f"{module}.{action}"

            # Check if permission already exists
            existing = db.query(Permission).filter(Permission.codename == codename).first()
            if not existing:
                permission = Permission(
                    module=module,
                    action=action,
                    codename=codename
                )
                permissions_to_create.append(permission)

    if permissions_to_create:
        db.add_all(permissions_to_create)
        db.commit()
        print(f"Created {len(permissions_to_create)} permissions")
