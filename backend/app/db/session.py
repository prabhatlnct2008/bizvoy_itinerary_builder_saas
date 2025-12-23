from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Determine engine configuration based on database type
connect_args = {}
engine_kwargs = {
    "echo": False,  # Limit SQL logging noise; errors handled via logging config
    "pool_pre_ping": True,  # Verify connections are alive before using
}

if settings.is_sqlite:
    # SQLite-specific settings
    connect_args = {"check_same_thread": False}
else:
    # Postgres-specific pool settings
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 10,
    })

# Create database engine
# For Postgres: postgresql+psycopg://USER:PASS@HOST:5432/DBNAME?sslmode=require
# For SQLite (local dev): sqlite:///./travel_saas.db
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
