"""
Order event model for audit trail.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class OrderEvent(Base):
    """Order event model for tracking state changes."""

    __tablename__ = "order_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    from_status = Column(String(20), nullable=True)
    to_status = Column(String(20), nullable=False)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    actor_type = Column(String(20), nullable=True)  # customer, cleaner, admin, system
    event_metadata = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    order = relationship("Order", back_populates="events")
    actor = relationship("User")

    def __repr__(self):
        return f"<OrderEvent(id={self.id}, order_id={self.order_id}, event_type={self.event_type})>"
