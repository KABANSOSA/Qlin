"""
Pricing rule model.
"""
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class PricingRule(Base):
    """Pricing rule model."""

    __tablename__ = "pricing_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=True, index=True)
    cleaning_type = Column(String(50), nullable=False)
    base_price_per_sqm = Column(Numeric(10, 2), nullable=True)
    base_price_per_room = Column(Numeric(10, 2), nullable=True)
    min_price = Column(Numeric(10, 2), nullable=False)
    max_price = Column(Numeric(10, 2), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    valid_from = Column(DateTime(timezone=True), server_default=func.now())
    valid_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    zone = relationship("Zone", back_populates="pricing_rules")

    def __repr__(self):
        return f"<PricingRule(id={self.id}, zone_id={self.zone_id}, cleaning_type={self.cleaning_type})>"
