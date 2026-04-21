"""CRM: лиды и сделки (B2B/B2C), комментарии, задачи."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.models.order import Order
from app.models.crm_opportunity import CrmOpportunity, CrmOpportunityComment, CrmTask
from app.schemas.crm_opportunity import (
    CrmOpportunityCreate,
    CrmOpportunityUpdate,
    CrmOpportunityResponse,
    CrmCommentCreate,
    CrmCommentResponse,
    CrmTaskCreate,
    CrmTaskUpdate,
    CrmTaskResponse,
)
from app.services.crm_opportunity_service import default_stage, validate_stage

router = APIRouter(prefix="/crm", tags=["admin-crm"])


def _opp_to_response(row: CrmOpportunity, db: Session) -> CrmOpportunityResponse:
    assigned_phone: Optional[str] = None
    if row.assigned_to_id:
        u = db.query(User).filter(User.id == row.assigned_to_id).first()
        if u:
            assigned_phone = u.phone
    data = CrmOpportunityResponse.model_validate(row)
    data.assigned_to_phone = assigned_phone
    return data


# ── Opportunities ──────────────────────────────────────────────────────────

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
    return [_opp_to_response(r, db) for r in rows]


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
    if body.assigned_to_id:
        if not db.query(User).filter(User.id == body.assigned_to_id).first():
            raise HTTPException(status_code=400, detail="Пользователь (ответственный) не найден")

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
        source=body.source,
        assigned_to_id=body.assigned_to_id,
        created_by_id=current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _opp_to_response(row, db)


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
    if "assigned_to_id" in data and data["assigned_to_id"] is not None:
        if not db.query(User).filter(User.id == data["assigned_to_id"]).first():
            raise HTTPException(status_code=400, detail="Пользователь (ответственный) не найден")

    text_optional = ("description", "company_name", "contact_name", "phone", "email", "source")
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
    return _opp_to_response(row, db)


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


# ── Comments ───────────────────────────────────────────────────────────────

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
    return CrmCommentResponse(
        id=c.id,
        opportunity_id=c.opportunity_id,
        author_id=c.author_id,
        author_phone=current_user.phone,
        body=c.body,
        created_at=c.created_at,
    )


# ── Tasks ──────────────────────────────────────────────────────────────────

def _task_to_response(task: CrmTask, db: Session) -> CrmTaskResponse:
    creator_phone: Optional[str] = None
    assigned_phone: Optional[str] = None
    opp_title: Optional[str] = None
    if task.creator_id:
        u = db.query(User).filter(User.id == task.creator_id).first()
        if u:
            creator_phone = u.phone
    if task.assigned_to_id:
        u = db.query(User).filter(User.id == task.assigned_to_id).first()
        if u:
            assigned_phone = u.phone
    if task.opportunity_id:
        o = db.query(CrmOpportunity).filter(CrmOpportunity.id == task.opportunity_id).first()
        if o:
            opp_title = o.title
    return CrmTaskResponse(
        id=task.id,
        title=task.title,
        status=task.status,
        deadline=task.deadline,
        opportunity_id=task.opportunity_id,
        opportunity_title=opp_title,
        creator_id=task.creator_id,
        creator_phone=creator_phone,
        assigned_to_id=task.assigned_to_id,
        assigned_to_phone=assigned_phone,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get("/tasks", response_model=List[CrmTaskResponse])
async def list_tasks(
    task_status: Optional[str] = Query(None, alias="status"),
    opportunity_id: Optional[UUID] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(CrmTask).order_by(CrmTask.deadline.asc().nullslast(), CrmTask.created_at.desc())
    if task_status:
        q = q.filter(CrmTask.status == task_status)
    if opportunity_id:
        q = q.filter(CrmTask.opportunity_id == opportunity_id)
    rows = q.offset(offset).limit(limit).all()
    return [_task_to_response(r, db) for r in rows]


@router.post("/tasks", response_model=CrmTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: CrmTaskCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if body.opportunity_id:
        if not db.query(CrmOpportunity).filter(CrmOpportunity.id == body.opportunity_id).first():
            raise HTTPException(status_code=400, detail="Лид/сделка не найдена")
    task = CrmTask(
        title=body.title.strip(),
        status=body.status,
        deadline=body.deadline,
        opportunity_id=body.opportunity_id,
        assigned_to_id=body.assigned_to_id,
        creator_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_to_response(task, db)


@router.patch("/tasks/{task_id}", response_model=CrmTaskResponse)
async def update_task(
    task_id: UUID,
    body: CrmTaskUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    task = db.query(CrmTask).filter(CrmTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    data = body.model_dump(exclude_unset=True)
    if "opportunity_id" in data and data["opportunity_id"] is not None:
        if not db.query(CrmOpportunity).filter(CrmOpportunity.id == data["opportunity_id"]).first():
            raise HTTPException(status_code=400, detail="Лид/сделка не найдена")
    for k, v in data.items():
        setattr(task, k, v)
    task.updated_at = datetime.utcnow()
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_to_response(task, db)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    task = db.query(CrmTask).filter(CrmTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    db.delete(task)
    db.commit()
