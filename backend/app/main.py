from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.db.session import engine, Base, SessionLocal
import os
import logging

# Configure logging
setup_logging()
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    redirect_slashes=True  # Normalize / and / routes so both work
)

# Configure CORS (sanitize list and fall back to *)
cors_origins = [o for o in settings.BACKEND_CORS_ORIGINS if o] or ["*"]
logger.info(f"CORS origins configured: {cors_origins}")
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
    logger.info(f"Starting application in {settings.ENVIRONMENT} mode")
    logger.info(f"Database type: {'SQLite' if settings.is_sqlite else 'PostgreSQL'}")

    # Import all models to register them
    from app.db import base  # noqa

    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified successfully")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Travel SaaS Itinerary Builder API",
        "version": "1.0.0",
        "docs": "/docs",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for Azure App Service and load balancers.
    Returns status and basic diagnostics.
    """
    health_status = {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "unknown",
    }

    # Check database connectivity
    try:
        db = SessionLocal()
        db.execute("SELECT 1" if not settings.is_sqlite else "SELECT 1")
        db.close()
        health_status["database"] = "connected"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["database"] = f"error: {str(e)}"
        logger.error(f"Health check database error: {e}")

    # Check OpenAI configuration
    if settings.USE_AZURE_OPENAI:
        health_status["openai"] = "azure" if settings.AZURE_OPENAI_API_KEY else "not_configured"
    else:
        health_status["openai"] = "standard" if settings.OPENAI_API_KEY else "not_configured"

    return health_status


@app.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe - just returns OK if app is running."""
    return {"status": "ok"}


@app.get("/health/ready")
async def readiness_check():
    """Kubernetes readiness probe - checks if app can serve traffic."""
    try:
        db = SessionLocal()
        db.execute("SELECT 1" if not settings.is_sqlite else "SELECT 1")
        db.close()
        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {"status": "not_ready", "error": str(e)}


# Include API router
from app.api.v1.router import api_router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
