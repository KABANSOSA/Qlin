"""
Pricing service for calculating order prices.
"""
from typing import Dict, Optional, Mapping, Any
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.zone import Zone
from app.core.pricing_constants import (
    ESTIMATE_SQ_M_PER_ROOM,
    PUBLIC_AREA_INCLUDED_SQ_M,
    PUBLIC_BASE_PRICE_RUB,
    PUBLIC_EXTRA_PER_SQ_M,
)


class PricingService:
    """Service for price calculation."""

    @staticmethod
    def _effective_area_sqm(area_sqm: Optional[Decimal], rooms_count: int) -> Decimal:
        if area_sqm is not None and area_sqm > 0:
            return Decimal(area_sqm)
        return Decimal(rooms_count) * Decimal(ESTIMATE_SQ_M_PER_ROOM)

    @staticmethod
    def _public_tariff_base(area: Decimal) -> Decimal:
        """Те же правила, что на странице «Цены» и в превью формы заказа."""
        if area <= PUBLIC_AREA_INCLUDED_SQ_M:
            return PUBLIC_BASE_PRICE_RUB
        return PUBLIC_BASE_PRICE_RUB + (area - PUBLIC_AREA_INCLUDED_SQ_M) * PUBLIC_EXTRA_PER_SQ_M

    @staticmethod
    def calculate_price(
        db: Session,
        zone_id: str,
        cleaning_type: str,
        rooms_count: int = 1,
        bathrooms_count: int = 1,
        area_sqm: Optional[Decimal] = None,
        extra_services: Optional[Mapping[str, Any]] = None,
    ) -> Dict[str, Decimal]:
        """
        Расчёт по публичным правилам (база 3 300 ₽ до 50 м², +30 ₽/м² свыше 50).
        Без площади — оценка rooms_count × 25 м² (как на фронте).

        zone_id: зона должна существовать (привязка заказа); на сумму не влияет.
        cleaning_type: пока не влияет на сумму (единый публичный тариф для всех типов в форме).

        Returns:
            dict with base_price, extra_services_price, discount, total_price
        """
        zone = db.query(Zone).filter(Zone.id == zone_id).first()
        if not zone:
            raise ValueError("Zone not found")

        area = PricingService._effective_area_sqm(area_sqm, rooms_count)
        base_price = PricingService._public_tariff_base(area).quantize(Decimal("0.01"))

        extra_services_price = Decimal("0")
        if bathrooms_count > 1:
            extra_services_price += Decimal("500") * (bathrooms_count - 1)

        extras = dict(extra_services or {})

        def as_int(name: str) -> int:
            raw = extras.get(name, 0)
            try:
                return max(0, int(raw))
            except (TypeError, ValueError):
                return 0

        def as_bool(name: str) -> bool:
            raw = extras.get(name, False)
            if isinstance(raw, bool):
                return raw
            if isinstance(raw, (int, float)):
                return raw != 0
            if isinstance(raw, str):
                return raw.strip().lower() in {"1", "true", "yes", "on", "да"}
            return False

        if as_bool("fridge"):
            extra_services_price += Decimal("500")
        if as_bool("microwave"):
            extra_services_price += Decimal("300")
        if as_bool("oven"):
            extra_services_price += Decimal("300")
        if as_bool("balcony_with_windows"):
            extra_services_price += Decimal("1000")
        if as_bool("balcony_without_windows"):
            extra_services_price += Decimal("500")

        extra_services_price += Decimal("150") * as_int("windows")

        dishes_count = as_int("dishes")
        if dishes_count > 10:
            extra_services_price += Decimal("10") * (dishes_count - 10)

        extra_services_price += Decimal("70") * as_int("ironing")
        extra_services_price += Decimal("200") * as_int("bedding_sets")

        total_price = base_price + extra_services_price

        return {
            "base_price": base_price,
            "extra_services_price": extra_services_price,
            "discount": Decimal("0"),
            "total_price": total_price,
        }
