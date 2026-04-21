from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


CrmKind = Literal["lead", "deal"]
CrmSegment = Literal["b2b", "b2c"]
CrmSource = Literal["website", "phone_call", "referral", "advertising", "social", "other"]
CrmTaskStatus = Literal["todo", "in_progress", "done", "cancelled"]

LEAD_STAGES = ("new", "contacted", "qualified", "lost")
DEAL_STAGES = ("discovery", "proposal", "negotiation", "won", "lost")
TASK_STATUSES = ("todo", "in_progress", "done", "cancelled")


class CrmOpportunityCreate(BaseModel):
    kind: CrmKind
    segment: CrmSegment
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    company_name: Optional[str] = Field(None, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=120)
    phone: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    estimated_value_rub: Optional[Decimal] = None
    linked_order_id: Optional[UUID] = None
    source: Optional[str] = Field(None, max_length=50)
    assigned_to_id: Optional[UUID] = None
    stage: Optional[str] = Field(
        default=None,
        max_length=32,
        description="Если не задан — начальный этап для лида/сделки",
    )


class CrmOpportunityUpdate(BaseModel):
    stage: Optional[str] = Field(None, max_length=32)
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    description: Optional[str] = None
    company_name: Optional[str] = Field(None, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=120)
    phone: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    estimated_value_rub: Optional[Decimal] = None
    linked_order_id: Optional[UUID] = None
    source: Optional[str] = Field(None, max_length=50)
    assigned_to_id: Optional[UUID] = None
    segment: Optional[CrmSegment] = None


class CrmOpportunityResponse(BaseModel):
    id: UUID
    kind: str
    segment: str
    stage: str
    title: str
    description: Optional[str] = None
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    estimated_value_rub: Optional[Decimal] = None
    linked_order_id: Optional[UUID] = None
    source: Optional[str] = None
    created_by_id: Optional[UUID] = None
    assigned_to_id: Optional[UUID] = None
    assigned_to_phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CrmCommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=8000)


class CrmCommentResponse(BaseModel):
    id: UUID
    opportunity_id: UUID
    author_id: Optional[UUID] = None
    author_phone: Optional[str] = None
    body: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Tasks ──────────────────────────────────────────────────────────────────

class CrmTaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    status: CrmTaskStatus = "todo"
    deadline: Optional[datetime] = None
    opportunity_id: Optional[UUID] = None
    assigned_to_id: Optional[UUID] = None


class CrmTaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    status: Optional[CrmTaskStatus] = None
    deadline: Optional[datetime] = None
    opportunity_id: Optional[UUID] = None
    assigned_to_id: Optional[UUID] = None


class CrmTaskResponse(BaseModel):
    id: UUID
    title: str
    status: str
    deadline: Optional[datetime] = None
    opportunity_id: Optional[UUID] = None
    opportunity_title: Optional[str] = None
    creator_id: Optional[UUID] = None
    creator_phone: Optional[str] = None
    assigned_to_id: Optional[UUID] = None
    assigned_to_phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
