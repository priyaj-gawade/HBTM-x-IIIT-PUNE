from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/atlas"


    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-key-change-this"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440

    # Gemini AI Keys
    GEMINI_KEY_1: str = ""
    GEMINI_KEY_2: str = ""
    GEMINI_KEY_3: str = ""
    GEMINI_API_KEY: str = ""

    # Nvidia NIM Keys
    NVIDIA_KEY_1: str = ""
    NVIDIA_KEY_2: str = ""
    NVIDIA_KEY_3: str = ""
    NVIDIA_KEY_4: str = ""

    # YouTube Data API (Optional)
    YOUTUBE_API_KEY: str = ""

    # App & Security
    APP_NAME: str = "Atlas AI"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
