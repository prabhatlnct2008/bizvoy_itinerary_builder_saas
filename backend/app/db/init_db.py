from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.agency import Agency
from app.models.user import User
from app.models.activity_type import ActivityType
from app.services.rbac_service import seed_permissions


def init_db(db: Session) -> None:
    """Initialize database with demo data"""

    # Seed system permissions first
    print("Seeding system permissions...")
    seed_permissions(db)

    # Check if demo agency exists
    demo_agency = db.query(Agency).filter(Agency.name == "Demo Travel Agency").first()

    if not demo_agency:
        # Create demo agency
        demo_agency = Agency(
            name="Demo Travel Agency",
            subdomain="demo",
            contact_email="contact@demotravel.com",
            contact_phone="+1234567890",
            is_active=True
        )
        db.add(demo_agency)
        db.commit()
        db.refresh(demo_agency)
        print("Demo agency created")

    # Check if admin user exists
    admin_user = db.query(User).filter(
        User.email == "admin@demo.com",
        User.agency_id == demo_agency.id
    ).first()

    if not admin_user:
        # Create admin user
        admin_user = User(
            agency_id=demo_agency.id,
            email="admin@demo.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Admin User",
            is_active=True,
            is_superuser=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print("Admin user created: admin@demo.com / admin123")

    # Seed default activity types
    default_activity_types = [
        {"name": "Stay", "description": "Accommodation and lodging", "icon": "bed"},
        {"name": "Meal", "description": "Dining experiences and food", "icon": "utensils"},
        {"name": "Experience", "description": "Activities and tours", "icon": "compass"},
        {"name": "Transfer", "description": "Transportation and transfers", "icon": "car"},
        {"name": "Other", "description": "Miscellaneous activities", "icon": "star"}
    ]

    for type_data in default_activity_types:
        existing_type = db.query(ActivityType).filter(
            ActivityType.agency_id == demo_agency.id,
            ActivityType.name == type_data["name"]
        ).first()

        if not existing_type:
            activity_type = ActivityType(
                agency_id=demo_agency.id,
                **type_data
            )
            db.add(activity_type)

    db.commit()
    print("Default activity types seeded")

    print("Database initialization complete")


if __name__ == "__main__":
    from app.db.session import SessionLocal
    from app.db.base import Base
    from app.db.session import engine

    # Create tables
    Base.metadata.create_all(bind=engine)

    # Initialize data
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
