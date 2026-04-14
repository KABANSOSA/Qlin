"""
Rating model.
"""
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base import Base


class Rating(Base):
    """Rating and review model."""

    __tablename__ = "ratings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, unique=True, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    cleaner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    order = relationship("Order", back_populates="rating")
    customer = relationship("User", foreign_keys=[customer_id], back_populates="ratings_given")
    cleaner = relationship("User", foreign_keys=[cleaner_id], back_populates="ratings_received")

    __table_args__ = (
        UniqueConstraint('order_id', name='uq_ratings_order_id'),
    )

    def __repr__(self):
        return f"<Rating(id={self.id}, order_id={self.order_id}, rating={self.rating})>"
