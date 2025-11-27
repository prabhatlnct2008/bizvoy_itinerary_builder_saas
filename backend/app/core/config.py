from typing import List
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

    # Database
    # Use absolute path so we don't accidentally create a new SQLite DB when starting from a different CWD
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'travel_saas.db'}"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OpenAI
    OPENAI_API_KEY: str
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # ChromaDB
    CHROMADB_PERSIST_DIR: str = "./chroma_data"

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    PDF_STORAGE_DIR: str = "./pdfs"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB

    # CORS
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

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PDF_STORAGE_DIR, exist_ok=True)
os.makedirs(settings.CHROMADB_PERSIST_DIR, exist_ok=True)
