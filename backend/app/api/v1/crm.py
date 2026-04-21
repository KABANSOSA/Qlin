"""CRM: лиды и сделки (B2B/B2C), комментарии."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.models.order import Order
from app.models.crm_opportunity import CrmOpportunity, CrmOpportunityComment
from app.schemas.crm_opportunity import (
    CrmOpportunityCreate,
    CrmOpportunityUpdate,
    CrmOpportunityResponse,
    CrmCommentCreate,
    CrmCommentResponse,
)
from app.services.crm_opportunity_service import default_stage, validate_stage

router = APIRouter(prefix="/crm", tags=["admin-crm"])


@router.get("/opportunities", response_model=List[CrmOpportunityResponse])
async def list_opportunities(
    kind: Optional[str] = Query(None, description="lead | deal"),
    segment: Optional[str] = Query(None, description="b2b | b2c"),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(CrmOpportunity).order_by(CrmOpportunity.updated_at.desc())
    if kind in ("lead", "deal"):
        q = q.filter(CrmOpportunity.kind == kind)
    if segment in ("b2b", "b2c"):
        q = q.filter(CrmOpportunity.segment == segment)
    rows = q.offset(offset).limit(limit).all()
    return rows


@router.post("/opportunities", response_model=CrmOpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    body: CrmOpportunityCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    stage = body.stage or default_stage(body.kind)
    try:
        validate_stage(body.kind, stage)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    if body.linked_order_id:
        if not db.query(Order).filter(Order.id == body.linked_order_id).first():
            raise HTTPException(status_code=400, detail="Заказ с таким id не найден")

    row = CrmOpportunity(
        kind=body.kind,
        segment=body.segment,
        stage=stage,
        title=body.title.strip(),
        description=body.description.strip() if body.description else None,
        company_name=body.company_name.strip() if body.company_name else None,
        contact_name=body.contact_name.strip() if body.contact_name else None,
        phone=body.phone.strip() if body.phone else None,
        email=body.email.strip() if body.email else None,
        estimated_value_rub=body.estimated_value_rub,
        linked_order_id=body.linked_order_id,
        created_by_id=current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/opportunities/{opportunity_id}", response_model=CrmOpportunityResponse)
async def update_opportunity(
    opportunity_id: UUID,
    body: CrmOpportunityUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    row = db.query(CrmOpportunity).filter(CrmOpportunity.id == opportunity_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Не найдено")

    data = body.model_dump(exclude_unset=True)
    if "stage" in data and data["stage"] is not None:
        try:
            validate_stage(row.kind, data["stage"])
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
    if "linked_order_id" in data and data["linked_order_id"] is not None:
        if not db.query(Order).filter(Order.id == data["linked_order_id"]).first():
            raise HTTPException(status_code=400, detail="Заказ с таким id не найден")

    text_optional = ("description", "company_name", "contact_name", "phone", "email")
    for k, v in data.items():
        if v is None:
            setattr(row, k, None)
            continue
        if isinstance(v, str):
            v = v.strip()
            if v == "" and k in text_optional:
                v = None
        setattr(row, k, v)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/opportunities/{opportunity_id}/comments", response_model=List[CrmCommentResponse])
async def list_comments(
    opportunity_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not db.query(CrmOpportunity).filter(CrmOpportunity.id == opportunity_id).first():
        raise HTTPException(status_code=404, detail="Не найдено")
    rows = (
        db.query(CrmOpportunityComment, User.phone)
        .outerjoin(User, CrmOpportunityComment.author_id == User.id)
        .filter(CrmOpportunityComment.opportunity_id == opportunity_id)
        .order_by(CrmOpportunityComment.created_at.asc())
        .all()
    )
    out: List[CrmCommentResponse] = []
    for c, phone in rows:
        out.append(
            CrmCommentResponse(
                id=c.id,
                opportunity_id=c.opportunity_id,
                author_id=c.author_id,
                author_phone=phone,
                body=c.body,
                created_at=c.created_at,
            )
        )
    return out


@router.delete("/opportunities/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity(
    opportunity_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    row = db.query(CrmOpportunity).filter(CrmOpportunity.id == opportunity_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Не найдено")
    db.delete(row)
    db.commit()


@router.post(
    "/opportunities/{opportunity_id}/comments",
    response_model=CrmCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_comment(
    opportunity_id: UUID,
    body: CrmCommentCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    opp = db.query(CrmOpportunity).filter(CrmOpportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Не найдено")
    c = CrmOpportunityComment(
        opportunity_id=opportunity_id,
        author_id=current_user.id,
        body=body.body.strip(),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    phone = current_user.phone
    return CrmCommentResponse(
        id=c.id,
        opportunity_id=c.opportunity_id,
        author_id=c.author_id,
        author_phone=phone,
        body=c.body,
        created_at=c.created_at,
    )
