"""
Cleaner model.
"""
from sqlalchemy import Column, String, Boolean, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class Cleaner(Base):
    """Cleaner profile model."""

    __tablename__ = "cleaners"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    rating = Column(Numeric(3, 2), default=0.0, nullable=False)
    total_orders = Column(Integer, default=0, nullable=False)
    completed_orders = Column(Integer, default=0, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False, index=True)
    current_location_lat = Column(Numeric(10, 8), nullable=True)
    current_location_lon = Column(Numeric(11, 8), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="cleaner_profile")

    def __repr__(self):
        return f"<Cleaner(id={self.id}, user_id={self.user_id}, rating={self.rating})>"
