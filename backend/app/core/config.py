"""
Application configuration using Pydantic settings.
"""
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings."""

    # App
    APP_NAME: str = "QLIN"
    DEBUG: bool = Field(default=False, env="DEBUG")
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DB_ECHO: bool = Field(default=False, env="DB_ECHO")

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_CACHE_TTL: int = 3600

    # CORS
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:3001",
        env="CORS_ORIGINS",
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into list."""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, list) else []

    # Telegram Bot
    TELEGRAM_BOT_TOKEN: str = Field(..., env="TELEGRAM_BOT_TOKEN")
    TELEGRAM_WEBHOOK_SECRET: str = Field(..., env="TELEGRAM_WEBHOOK_SECRET")
    TELEGRAM_API_URL: str = "https://api.telegram.org/bot"

    # Payment
    PAYMENT_PROVIDER: str = Field(default="yookassa", env="PAYMENT_PROVIDER")
    YOOKASSA_SHOP_ID: str = Field(default="", env="YOOKASSA_SHOP_ID")
    YOOKASSA_SECRET_KEY: str = Field(default="", env="YOOKASSA_SECRET_KEY")

    # Celery
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/1", env="CELERY_BROKER_URL"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/2", env="CELERY_RESULT_BACKEND"
    )

    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
