"""Лиды и сделки в CRM (отдельно от заказов уборки)."""

import uuid
from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class CrmOpportunity(Base):
    __tablename__ = "crm_opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kind = Column(String(10), nullable=False, index=True)  # lead | deal
    segment = Column(String(10), nullable=False, index=True)  # b2b | b2c
    stage = Column(String(32), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    company_name = Column(String(200), nullable=True)
    contact_name = Column(String(120), nullable=True)
    phone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    estimated_value_rub = Column(Numeric(12, 2), nullable=True)
    source = Column(String(50), nullable=True)  # website | phone_call | referral | advertising | social | other

    # Поля сделки (kind=deal)
    address = Column(String(500), nullable=True)
    area_sqm = Column(Numeric(8, 1), nullable=True)

    linked_order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    comments = relationship(
        "CrmOpportunityComment",
        back_populates="opportunity",
        order_by="CrmOpportunityComment.created_at",
        cascade="all, delete-orphan",
    )
    tasks = relationship(
        "CrmTask",
        back_populates="opportunity",
        order_by="CrmTask.deadline",
        cascade="all, delete-orphan",
    )
    linked_order = relationship("Order", foreign_keys=[linked_order_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])


class CrmOpportunityComment(Base):
    __tablename__ = "crm_opportunity_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(
        UUID(as_uuid=True),
        ForeignKey("crm_opportunities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    opportunity = relationship("CrmOpportunity", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])


class CrmTask(Base):
    __tablename__ = "crm_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(300), nullable=False)
    status = Column(String(32), nullable=False, default="todo", index=True)  # todo | in_progress | done | cancelled
    deadline = Column(DateTime(timezone=True), nullable=True)

    opportunity_id = Column(
        UUID(as_uuid=True),
        ForeignKey("crm_opportunities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    opportunity = relationship("CrmOpportunity", back_populates="tasks")
    creator = relationship("User", foreign_keys=[creator_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
