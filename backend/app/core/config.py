from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Travel SaaS Itinerary Builder"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development, staging, production

    # Database
    # Default to SQLite for local dev; override with DATABASE_URL for Postgres in production
    # Postgres format: postgresql+psycopg://USER:PASS@HOST:5432/DBNAME?sslmode=require
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'travel_saas.db'}"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ===== OpenAI Configuration =====
    # Standard OpenAI (for local dev or direct OpenAI usage)
    OPENAI_API_KEY: Optional[str] = None

    # Azure OpenAI (for Azure deployment)
    USE_AZURE_OPENAI: bool = False
    AZURE_OPENAI_ENDPOINT: Optional[str] = None  # e.g., https://your-resource.openai.azure.com
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_API_VERSION: str = "2024-06-01"
    AZURE_OPENAI_CHAT_DEPLOYMENT: Optional[str] = None  # e.g., gpt-4o-mini
    AZURE_OPENAI_EMBED_DEPLOYMENT: Optional[str] = None  # e.g., text-embedding-3-small

    # Model settings (used for both OpenAI and Azure)
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHAT_MODEL: str = "gpt-4o-mini"

    # ChromaDB
    CHROMADB_PERSIST_DIR: str = "./chroma_data"

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    PDF_STORAGE_DIR: str = "./pdfs"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB

    # CORS - Allow multiple origins for Azure deployment
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Email SMTP settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "support@bizvoy.com"
    SMTP_FROM_NAME: str = "Bizvoy Support"
    SMTP_TLS: bool = True

    # Application URL (for email links)
    APP_URL: str = "http://localhost:5173"

    # Azure Application Insights (optional)
    APPLICATIONINSIGHTS_CONNECTION_STRING: Optional[str] = None
    LOG_LEVEL: str = "INFO"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def effective_openai_api_key(self) -> Optional[str]:
        """Get the effective OpenAI API key (Azure or standard)"""
        if self.USE_AZURE_OPENAI:
            return self.AZURE_OPENAI_API_KEY
        return self.OPENAI_API_KEY

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PDF_STORAGE_DIR, exist_ok=True)
os.makedirs(settings.CHROMADB_PERSIST_DIR, exist_ok=True)
