from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.session import engine, Base
import os

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    redirect_slashes=False  # Prevent 307 redirects that break CORS
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
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
