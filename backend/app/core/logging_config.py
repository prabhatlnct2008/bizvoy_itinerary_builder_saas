"""
Logging Configuration

Configures logging for the application with optional Azure Application Insights support.
"""
import logging
import sys
from app.core.config import settings


def setup_logging():
    """Configure application logging."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Base logging configuration
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]  # Ensure stdout for Azure App Service
    )

    # Quiet noisy SQLAlchemy logs unless errors
    logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.ERROR)

    # Quiet other noisy loggers in production
    if settings.is_production:
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("httpx").setLevel(logging.WARNING)

    # Setup Azure Application Insights if configured
    if settings.APPLICATIONINSIGHTS_CONNECTION_STRING:
        try:
            _setup_azure_app_insights()
            logging.info("Azure Application Insights logging enabled")
        except ImportError:
            logging.warning(
                "Azure Application Insights connection string configured but "
                "opencensus-ext-azure is not installed. Install with: "
                "pip install opencensus-ext-azure"
            )
        except Exception as e:
            logging.warning(f"Failed to setup Azure Application Insights: {e}")


def _setup_azure_app_insights():
    """Setup Azure Application Insights exporter."""
    from opencensus.ext.azure.log_exporter import AzureLogHandler

    # Get root logger
    root_logger = logging.getLogger()

    # Add Azure handler
    azure_handler = AzureLogHandler(
        connection_string=settings.APPLICATIONINSIGHTS_CONNECTION_STRING
    )
    azure_handler.setLevel(logging.INFO)
    root_logger.addHandler(azure_handler)


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the given name."""
    return logging.getLogger(name)
