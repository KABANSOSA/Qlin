"""
Order schemas.
"""
from typing import Literal, Optional
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
    extra_services: Optional[dict] = Field(
        default=None,
        description="Доп. услуги: fridge,microwave,oven,balcony_with_windows,balcony_without_windows,windows,dishes,ironing,bedding_sets",
    )
    scheduled_at: datetime
    service_city: Optional[Literal["khabarovsk", "yuzhno_sakhalinsk"]] = Field(
        default=None,
        description="Город обслуживания — подбор зоны и тарифа (Хабаровск / Южно-Сахалинск)",
    )
    payment_method: Optional[Literal["cash", "transfer"]] = Field(
        default=None,
        description="Способ оплаты: cash — наличными, transfer — банковский перевод",
    )


class OrderUpdate(BaseModel):
    """Schema for order update."""
    address: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    special_instructions: Optional[str] = None
    payment_method: Optional[Literal["cash", "transfer"]] = None


class OrderStatusUpdate(BaseModel):
    """Schema for order status update."""
    status: str
    metadata: Optional[dict] = None


class AssignOrderBody(BaseModel):
    """Назначение уборщика на заказ (CRM / админ)."""

    cleaner_id: UUID


class AdminSetOrderStatusBody(BaseModel):
    """Смена этапа воронки из CRM (диспетчер)."""

    status: str = Field(
        ...,
        min_length=1,
        description="pending | assigned | in_progress | completed | cancelled",
    )


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
    special_instructions: Optional[str] = None

    class Config:
        from_attributes = True


class OrderAdminResponse(OrderResponse):
    """Расширенный заказ для CRM/админки: контакт клиента + клинер + маржинальность."""

    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    cleaner_phone: Optional[str] = None
    cleaner_name: Optional[str] = None

    cleaner_payout: Optional[Decimal] = None
    supply_cost: Decimal = Decimal("0")
    other_cost: Decimal = Decimal("0")
    margin_rub: Optional[Decimal] = None
    margin_pct: Optional[float] = None


class OrderCostsUpdate(BaseModel):
    """Ручная корректировка себестоимости заказа (админ)."""

    cleaner_payout: Optional[Decimal] = Field(default=None, ge=0)
    supply_cost: Optional[Decimal] = Field(default=None, ge=0)
    other_cost: Optional[Decimal] = Field(default=None, ge=0)
