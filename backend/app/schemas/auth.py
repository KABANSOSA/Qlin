"""
Authentication schemas.
"""
from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema."""
    user_id: Optional[str] = None
    role: Optional[str] = None
