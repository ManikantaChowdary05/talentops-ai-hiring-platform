import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "TalentFlow 360"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./talentflow360.db")
    
    # Deterministic Seed
    SYNTHETIC_SEED: int = 20261022
    
    # JWT / Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "talentflow360-hackathon-secure-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # LLM Settings
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini" if os.getenv("GEMINI_API_KEY") else "local")
    
    class Config:
        case_sensitive = True

settings = Settings()
