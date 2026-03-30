"""
Order schemas.
"""
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal
from uuid import UUID


class OrderCreate(BaseModel):
    """Schema for order creation."""
    zone_id: UUID
    address: str = Field(..., min_length=5)
    address_lat: Optional[Decimal] = None
    address_lon: Optional[Decimal] = None
    apartment: Optional[str] = None
    entrance: Optional[str] = None
    floor: Optional[int] = None
    intercom: Optional[str] = None
    cleaning_type: str = Field(..., min_length=1)
    rooms_count: int = Field(default=1, ge=1)
    bathrooms_count: int = Field(default=1, ge=0)
    area_sqm: Optional[Decimal] = None
    has_pets: bool = False
    has_balcony: bool = False
    special_instructions: Optional[str] = None
    scheduled_at: datetime


class OrderUpdate(BaseModel):
    """Schema for order update."""
    address: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    special_instructions: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    """Schema for order status update."""
    status: str
    metadata: Optional[dict] = None


class OrderResponse(BaseModel):
    """Schema for order response."""
    id: UUID
    order_number: str
    customer_id: UUID
    cleaner_id: Optional[UUID] = None
    zone_id: Optional[UUID] = None
    address: str
    address_lat: Optional[Decimal] = None
    address_lon: Optional[Decimal] = None
    apartment: Optional[str] = None
    cleaning_type: str
    rooms_count: int
    bathrooms_count: int
    area_sqm: Optional[Decimal] = None
    scheduled_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    base_price: Decimal
    extra_services_price: Decimal
    discount: Decimal
    total_price: Decimal
    status: str
    payment_status: str
    payment_method: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderAdminResponse(OrderResponse):
    """Расширенный заказ для CRM/админки: контакт клиента и комментарий."""

    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    special_instructions: Optional[str] = None
