"""
User model.
"""
from sqlalchemy import Column, String, Boolean, BigInteger, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class User(Base):
    """User model for customers, cleaners, and admins."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    telegram_id = Column(BigInteger, unique=True, nullable=True)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=True)  # Hashed password
    role = Column(String(20), nullable=False, default="customer", index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    cleaner_profile = relationship("Cleaner", back_populates="user", uselist=False)
    customer_orders = relationship("Order", foreign_keys="Order.customer_id", back_populates="customer")
    cleaner_orders = relationship("Order", foreign_keys="Order.cleaner_id", back_populates="cleaner")
    ratings_given = relationship("Rating", foreign_keys="Rating.customer_id", back_populates="customer")
    ratings_received = relationship("Rating", foreign_keys="Rating.cleaner_id", back_populates="cleaner")
    notifications = relationship("Notification", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, phone={self.phone}, role={self.role})>"
