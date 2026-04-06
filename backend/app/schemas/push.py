from pydantic import BaseModel, Field


class PushTokenRegister(BaseModel):
    """Регистрация токена из expo-notifications (Expo Push Token)."""

    token: str = Field(..., min_length=10, max_length=512)
    platform: str = Field(..., description="ios или android")
