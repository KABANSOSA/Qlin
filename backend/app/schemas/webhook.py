"""
Webhook schemas for Telegram bot integration.
"""
from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class TelegramWebhook(BaseModel):
    """Schema for Telegram webhook."""
    event_type: str  # order_accept, order_start, order_complete, order_cancel
    order_id: UUID
    cleaner_id: Optional[UUID] = None
    metadata: Optional[dict] = None
    secret: str  # Webhook secret for verification
