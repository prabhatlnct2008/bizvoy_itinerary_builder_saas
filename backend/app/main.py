from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.db.session import engine, Base
import os

# Configure logging
setup_logging()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    redirect_slashes=True  # Normalize / and / routes so both work
)

# Configure CORS (sanitize list and fall back to *)
cors_origins = [o for o in settings.BACKEND_CORS_ORIGINS if o] or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount static files for PDFs
if os.path.exists(settings.PDF_STORAGE_DIR):
    app.mount("/pdfs", StaticFiles(directory=settings.PDF_STORAGE_DIR), name="pdfs")


@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    # Import all models to register them
    from app.db import base  # noqa

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Travel SaaS Itinerary Builder API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# Include API router
from app.api.v1.router import api_router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
