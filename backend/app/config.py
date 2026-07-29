"""
Application configuration using pydantic-settings.
Reads from .env file automatically.
"""
from pydantic_settings import BaseSettings
from pydantic import AnyUrl
from typing import Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Interview Prep System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "change-this-in-production-minimum-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./interview_prep.db"

    # OpenAI
    OPENAI_API_KEY: str = "sk-placeholder"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Mock mode (when no real API key)
    USE_MOCK_AI: bool = True

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Speech
    WHISPER_MODEL: str = "base"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
