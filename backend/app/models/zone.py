"""
Zone model.
"""
from sqlalchemy import Column, String, Boolean, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base import Base


class Zone(Base):
    """Service zone model."""

    __tablename__ = "zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    polygon_coordinates = Column(JSONB, nullable=True)  # GeoJSON polygon
    base_price = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="zone")
    pricing_rules = relationship("PricingRule", back_populates="zone")

    def __repr__(self):
        return f"<Zone(id={self.id}, name={self.name}, city={self.city})>"
