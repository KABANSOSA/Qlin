"""
Authentication schemas.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class ForgotPasswordRequest(BaseModel):
    """Запрос письма со ссылкой сброса пароля."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Установка нового пароля по токену из письма."""
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=128)


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema."""
    user_id: Optional[str] = None
    role: Optional[str] = None


class OtpRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)


class OtpVerify(BaseModel):
    phone: str = Field(..., min_length=10)
    code: str = Field(..., min_length=4, max_length=8)


class AppleIdentityBody(BaseModel):
    identity_token: str = Field(..., min_length=10)
