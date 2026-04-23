"""
Rating / review schemas.
"""
from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    """Клиент оценивает завершённый заказ."""

    rating: int = Field(..., ge=1, le=5, description="Оценка от 1 до 5")
    comment: Optional[str] = Field(
        default=None, max_length=2000, description="Текстовый отзыв"
    )


class RatingResponse(BaseModel):
    id: UUID
    order_id: UUID
    customer_id: UUID
    cleaner_id: UUID
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CleanerRatingStats(BaseModel):
    """Средняя оценка и количество отзывов клинера."""

    cleaner_id: UUID
    average_rating: float
    total_reviews: int
