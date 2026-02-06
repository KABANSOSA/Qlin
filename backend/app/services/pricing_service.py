"""
Pricing service for calculating order prices.
"""
from typing import Dict, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.pricing_rule import PricingRule
from app.models.zone import Zone


class PricingService:
    """Service for price calculation."""

    @staticmethod
    def calculate_price(
        db: Session,
        zone_id: str,
        cleaning_type: str,
        rooms_count: int = 1,
        bathrooms_count: int = 1,
        area_sqm: Optional[Decimal] = None,
    ) -> Dict[str, Decimal]:
        """
        Calculate order price based on zone, type, and parameters.
        
        Returns:
            dict with base_price, extra_services_price, discount, total_price
        """
        # Get zone
        zone = db.query(Zone).filter(Zone.id == zone_id).first()
        if not zone:
            raise ValueError("Zone not found")

        # Get pricing rule
        rule = (
            db.query(PricingRule)
            .filter(
                PricingRule.zone_id == zone_id,
                PricingRule.cleaning_type == cleaning_type,
                PricingRule.is_active == True,
                PricingRule.valid_from <= datetime.utcnow(),
                (PricingRule.valid_until.is_(None) | (PricingRule.valid_until >= datetime.utcnow())),
            )
            .first()
        )

        if not rule:
            # Use zone base price as fallback
            base_price = zone.base_price
        else:
            # Calculate based on rule
            if rule.base_price_per_sqm and area_sqm:
                base_price = rule.base_price_per_sqm * area_sqm
            elif rule.base_price_per_room:
                base_price = rule.base_price_per_room * rooms_count
            else:
                base_price = rule.min_price

            # Apply min/max constraints
            if rule.min_price and base_price < rule.min_price:
                base_price = rule.min_price
            if rule.max_price and base_price > rule.max_price:
                base_price = rule.max_price

        # Extra services (bathrooms, pets, etc.)
        extra_services_price = Decimal("0")
        if bathrooms_count > 1:
            extra_services_price += Decimal("500") * (bathrooms_count - 1)

        # Total
        total_price = base_price + extra_services_price

        return {
            "base_price": base_price,
            "extra_services_price": extra_services_price,
            "discount": Decimal("0"),
            "total_price": total_price,
        }
