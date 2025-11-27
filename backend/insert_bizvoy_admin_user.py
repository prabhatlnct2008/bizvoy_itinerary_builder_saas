#!/usr/bin/env python3
"""
Script to create a Bizvoy Admin user.
Run via shell: python insert_bizvoy_admin_user.py

Bizvoy Admin users are platform administrators who manage agencies.
They do NOT belong to any agency (agency_id is null).
"""
import sys
import getpass
import uuid
from datetime import datetime

# Add the app directory to path for imports
sys.path.insert(0, '.')

from app.db.session import SessionLocal
from app.models.user import User
from app.models.agency import Agency  # Required for SQLAlchemy relationship resolution
from app.core.security import get_password_hash


def create_bizvoy_admin_user():
    """Create a Bizvoy admin user with interactive prompts."""
    print("\n" + "=" * 50)
    print("  Bizvoy Admin User Creation Script")
    print("=" * 50)
    print("\n  Note: Bizvoy admins are platform administrators")
    print("  who manage agencies. They don't belong to any agency.\n")

    # Get email
    email = input("Enter admin email: ").strip()
    if not email:
        print("Error: Email is required.")
        sys.exit(1)

    # Validate email format (basic check)
    if "@" not in email or "." not in email:
        print("Error: Invalid email format.")
        sys.exit(1)

    # Get full name
    full_name = input("Enter full name: ").strip()
    if not full_name:
        full_name = "Bizvoy Admin"

    # Get password (hidden input)
    password = getpass.getpass("Enter password: ")
    if len(password) < 6:
        print("Error: Password must be at least 6 characters.")
        sys.exit(1)

    # Confirm password
    password_confirm = getpass.getpass("Confirm password: ")
    if password != password_confirm:
        print("Error: Passwords do not match.")
        sys.exit(1)

    # Create database session
    db = SessionLocal()

    try:
        # Check if user already exists (bizvoy admins have no agency, so check globally)
        existing_user = db.query(User).filter(
            User.email == email,
            User.is_bizvoy_admin == True
        ).first()

        if existing_user:
            print(f"\nError: Bizvoy admin with email '{email}' already exists.")
            sys.exit(1)

        # Create the user
        hashed_password = get_password_hash(password)

        user = User(
            id=str(uuid.uuid4()),
            agency_id=None,  # Bizvoy admins don't belong to any agency
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            is_active=True,
            is_superuser=False,  # Not an agency admin
            is_bizvoy_admin=True,  # Platform administrator
            force_password_reset=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print("\n" + "=" * 50)
        print("  Bizvoy Admin User Created Successfully!")
        print("=" * 50)
        print(f"\n  Email: {user.email}")
        print(f"  Name: {user.full_name}")
        print(f"  User ID: {user.id}")
        print(f"  Agency: None (Platform Admin)")
        print(f"  Is Bizvoy Admin: {user.is_bizvoy_admin}")
        print("\n  Login at /login -> redirects to /admin dashboard")
        print("=" * 50 + "\n")

    except Exception as e:
        db.rollback()
        print(f"\nError creating user: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_bizvoy_admin_user()
