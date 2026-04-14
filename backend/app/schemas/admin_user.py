"""Схемы для управления администраторами CRM."""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class AdminCreateAdminBody(BaseModel):
    """Новый админ или повышение клиента до admin."""

    phone: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=8, max_length=128)
    first_name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[EmailStr] = None
