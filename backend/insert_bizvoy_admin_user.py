#!/usr/bin/env python3
"""
Script to create a Bizvoy Admin user.
Run via shell: python insert_bizvoy_admin_user.py
"""
import sys
import getpass
import uuid
from datetime import datetime

# Add the app directory to path for imports
sys.path.insert(0, '.')

from app.db.session import SessionLocal, engine
from app.models.user import User
from app.models.agency import Agency
from app.core.security import get_password_hash

BIZVOY_AGENCY_ID = "bizvoy-platform"
BIZVOY_AGENCY_NAME = "Bizvoy Platform"


def get_or_create_bizvoy_agency(db):
    """Get or create the Bizvoy Platform agency for admin users."""
    agency = db.query(Agency).filter(Agency.id == BIZVOY_AGENCY_ID).first()

    if not agency:
        print(f"Creating Bizvoy Platform agency...")
        agency = Agency(
            id=BIZVOY_AGENCY_ID,
            name=BIZVOY_AGENCY_NAME,
            contact_email="admin@bizvoy.com",
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(agency)
        db.commit()
        db.refresh(agency)
        print(f"Created agency: {agency.name}")
    else:
        print(f"Using existing agency: {agency.name}")

    return agency


def create_bizvoy_admin_user():
    """Create a Bizvoy admin user with interactive prompts."""
    print("\n" + "=" * 50)
    print("  Bizvoy Admin User Creation Script")
    print("=" * 50 + "\n")

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
        # Get or create Bizvoy agency
        agency = get_or_create_bizvoy_agency(db)

        # Check if user already exists
        existing_user = db.query(User).filter(
            User.agency_id == BIZVOY_AGENCY_ID,
            User.email == email
        ).first()

        if existing_user:
            print(f"\nError: User with email '{email}' already exists in Bizvoy Platform.")
            sys.exit(1)

        # Create the user
        hashed_password = get_password_hash(password)

        user = User(
            id=str(uuid.uuid4()),
            agency_id=BIZVOY_AGENCY_ID,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            is_active=True,
            is_superuser=True,
            is_bizvoy_admin=True,
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
        print(f"  Agency: {agency.name}")
        print(f"  Is Bizvoy Admin: {user.is_bizvoy_admin}")
        print("\n  You can now login at /login and will be redirected to /admin")
        print("=" * 50 + "\n")

    except Exception as e:
        db.rollback()
        print(f"\nError creating user: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_bizvoy_admin_user()
