"""
Order model.
"""
from sqlalchemy import Column, String, Boolean, Integer, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base import Base


class Order(Base):
    """Order model."""

    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(20), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    cleaner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=True)

    # Address
    address = Column(Text, nullable=False)
    address_lat = Column(Numeric(10, 8), nullable=True)
    address_lon = Column(Numeric(11, 8), nullable=True)
    apartment = Column(String(20), nullable=True)
    entrance = Column(String(10), nullable=True)
    floor = Column(Integer, nullable=True)
    intercom = Column(String(20), nullable=True)

    # Cleaning details
    cleaning_type = Column(String(50), nullable=False)
    rooms_count = Column(Integer, default=1, nullable=False)
    bathrooms_count = Column(Integer, default=1, nullable=False)
    area_sqm = Column(Numeric(8, 2), nullable=True)
    has_pets = Column(Boolean, default=False, nullable=False)
    has_balcony = Column(Boolean, default=False, nullable=False)
    special_instructions = Column(Text, nullable=True)

    # Time
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Price
    base_price = Column(Numeric(10, 2), nullable=False)
    extra_services_price = Column(Numeric(10, 2), default=0, nullable=False)
    discount = Column(Numeric(10, 2), default=0, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)

    # Status
    status = Column(String(20), nullable=False, default="pending", index=True)
    # pending, assigned, in_progress, completed, cancelled, paid

    # Payment
    payment_status = Column(String(20), default="pending", nullable=False)
    # pending, paid, refunded
    payment_method = Column(String(50), nullable=True)
    payment_id = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], back_populates="customer_orders")
    cleaner = relationship("User", foreign_keys=[cleaner_id], back_populates="cleaner_orders")
    zone = relationship("Zone", back_populates="orders")
    events = relationship("OrderEvent", back_populates="order", order_by="OrderEvent.created_at")
    payments = relationship("Payment", back_populates="order")
    rating = relationship("Rating", back_populates="order", uselist=False)

    def __repr__(self):
        return f"<Order(id={self.id}, order_number={self.order_number}, status={self.status})>"
