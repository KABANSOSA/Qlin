"""Schemas for admin cleaner management."""

from typing import Optional
from pydantic import BaseModel, Field, field_validator


class AdminCreateCleanerBody(BaseModel):
    """Создание уборщика: пользователь + профиль cleaners (для списка в CRM)."""

    phone: str = Field(..., min_length=10, max_length=20)
    first_name: Optional[str] = Field(None, max_length=100)
    password: Optional[str] = Field(None, max_length=128)

    @field_validator("password")
    @classmethod
    def password_min_if_set(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) < 8:
            raise ValueError("Пароль не короче 8 символов")
        return v
