"""
Application configuration using Pydantic settings.
"""
from typing import List, Optional
from urllib.parse import urlparse

from pydantic import Field, ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Пустая строка в .env для CORS_ORIGINS / PUBLIC_SITE_URL ломает CRM («Нет связи с API»).
_DEFAULT_PUBLIC_SITE_URL = "https://qlin.pro"
_DEFAULT_CORS_ORIGINS = (
    "http://localhost:3000,http://localhost:3001,"
    "https://qlin.pro,https://www.qlin.pro,https://crm.qlin.pro"
)


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        # docker-compose / frontend кладут в общий .env переменные вроде POSTGRES_*, NEXT_PUBLIC_*
        extra="ignore",
    )

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

    # Из общего .env / docker-compose (для postgres, фронта) — бэкенд не читает, но они не должны ломать Settings()
    POSTGRES_USER: Optional[str] = Field(default=None, env="POSTGRES_USER")
    POSTGRES_PASSWORD: Optional[str] = Field(default=None, env="POSTGRES_PASSWORD")
    POSTGRES_DB: Optional[str] = Field(default=None, env="POSTGRES_DB")
    NEXT_PUBLIC_API_URL: Optional[str] = Field(default=None, env="NEXT_PUBLIC_API_URL")
    NEXT_PUBLIC_PUBLIC_SITE_URL: Optional[str] = Field(default=None, env="NEXT_PUBLIC_PUBLIC_SITE_URL")
    NEXT_PUBLIC_SITE_URL: Optional[str] = Field(default=None, env="NEXT_PUBLIC_SITE_URL")
    NEXT_PUBLIC_YANDEX_MAPS_API_KEY: Optional[str] = Field(default=None, env="NEXT_PUBLIC_YANDEX_MAPS_API_KEY")

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_CACHE_TTL: int = 3600

    # Публичный URL сайта (ссылки в письмах сброса пароля)
    PUBLIC_SITE_URL: str = Field(default=_DEFAULT_PUBLIC_SITE_URL, env="PUBLIC_SITE_URL")

    # SMTP — для восстановления пароля (если не задано SMTP_HOST — /forgot-password вернёт 503)
    SMTP_HOST: Optional[str] = Field(default=None, env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USER: Optional[str] = Field(default=None, env="SMTP_USER")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    SMTP_FROM: Optional[str] = Field(default=None, env="SMTP_FROM")
    SMTP_USE_TLS: bool = Field(default=True, env="SMTP_USE_TLS")

    # CORS
    CORS_ORIGINS: str = Field(default=_DEFAULT_CORS_ORIGINS, env="CORS_ORIGINS")

    @field_validator("PUBLIC_SITE_URL", mode="before")
    @classmethod
    def public_site_url_non_empty(cls, v: object) -> object:
        if v is None or (isinstance(v, str) and not v.strip()):
            return _DEFAULT_PUBLIC_SITE_URL
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def cors_origins_non_empty(cls, v: object) -> object:
        if v is None or (isinstance(v, str) and not v.strip()):
            return _DEFAULT_CORS_ORIGINS
        return v

    @staticmethod
    def _apex_host(hostname: str) -> str:
        h = (hostname or "").lower().strip()
        if h.startswith("www."):
            h = h[4:]
        return h

    def _ensure_crm_origin(self, out: List[str], seen_lower: set) -> None:
        """Добавить https://crm.<apex> для каждого подходящего хоста из URL."""

        def add_for_host(host: str) -> None:
            host = self._apex_host(host)
            if not host or host in ("localhost", "127.0.0.1"):
                return
            crm_origin = f"https://crm.{host}"
            if crm_origin.lower() not in seen_lower:
                out.append(crm_origin)
                seen_lower.add(crm_origin.lower())

        url_sources: List[str] = []
        for raw in (
            self.PUBLIC_SITE_URL,
            self.NEXT_PUBLIC_PUBLIC_SITE_URL or "",
            self.NEXT_PUBLIC_SITE_URL or "",
        ):
            s = (raw or "").strip()
            if s:
                url_sources.append(s)
        for s in url_sources:
            try:
                add_for_host(urlparse(s).hostname or "")
            except Exception:
                pass
        # Если в CORS_ORIGINS уже есть https://qlin.pro, но PUBLIC_SITE_URL на сервере сломан —
        # всё равно вывести https://crm.qlin.pro из перечисленных origin.
        for origin in list(out):
            try:
                add_for_host(urlparse(origin.strip()).hostname or "")
            except Exception:
                pass

    @property
    def cors_origins_list(self) -> List[str]:
        """
        Список origin для CORS + автоматически https://crm.<домен>,
        если забыли поддомен CRM (типичная причина «Нет связи с API» в crm.*).
        """
        if isinstance(self.CORS_ORIGINS, str):
            out = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        else:
            out = list(self.CORS_ORIGINS) if isinstance(self.CORS_ORIGINS, list) else []
        seen_lower = {o.lower() for o in out}
        self._ensure_crm_origin(out, seen_lower)
        return out

    # Telegram Bot (в .env на проде — реальные значения; для локального Docker см. docker-compose.yml)
    TELEGRAM_BOT_TOKEN: str = Field(
        default="0000000000:local-dev-placeholder",
        env="TELEGRAM_BOT_TOKEN",
    )
    TELEGRAM_WEBHOOK_SECRET: str = Field(
        default="change-me-local-dev",
        env="TELEGRAM_WEBHOOK_SECRET",
    )
    TELEGRAM_API_URL: str = "https://api.telegram.org/bot"

    @field_validator("TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", mode="before")
    @classmethod
    def telegram_non_empty(cls, v: object, info: ValidationInfo) -> object:
        """Пустая строка в .env / Docker не должна ломать загрузку настроек."""
        if v is None or (isinstance(v, str) and not v.strip()):
            if info.field_name == "TELEGRAM_BOT_TOKEN":
                return "0000000000:local-dev-placeholder"
            return "change-me-local-dev"
        return v

    # Payment
    PAYMENT_PROVIDER: str = Field(default="yookassa", env="PAYMENT_PROVIDER")
    YOOKASSA_SHOP_ID: str = Field(default="", env="YOOKASSA_SHOP_ID")
    YOOKASSA_SECRET_KEY: str = Field(default="", env="YOOKASSA_SECRET_KEY")

    # SMS.ru — OTP вход (https://sms.ru)
    SMS_RU_API_ID: Optional[str] = Field(default=None, env="SMS_RU_API_ID")
    # Apple Sign In — проверка aud в identity_token (Bundle ID / Service ID)
    APPLE_CLIENT_ID: Optional[str] = Field(default=None, env="APPLE_CLIENT_ID")

    # Celery
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/1", env="CELERY_BROKER_URL"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/2", env="CELERY_RESULT_BACKEND"
    )

    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")

    # Сид: задать пароль пользователю +79999999999 (роль admin) для первого входа в CRM
    SEED_ADMIN_PASSWORD: Optional[str] = Field(default=None, env="SEED_ADMIN_PASSWORD")


settings = Settings()
