"""Валидация этапов лида/сделки и создание карточки из заказа."""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.crm_opportunity import CrmOpportunity
from app.models.order import Order
from app.models.user import User
from app.schemas.crm_opportunity import LEAD_STAGES, DEAL_STAGES


def default_stage(kind: str) -> str:
    if kind == "lead":
        return "new"
    return "discovery"


def validate_stage(kind: str, stage: str) -> None:
    allowed = LEAD_STAGES if kind == "lead" else DEAL_STAGES
    if stage not in allowed:
        joined = ", ".join(allowed)
        raise ValueError(f"Недопустимый этап для {kind}: {stage}. Допустимо: {joined}")


def create_opportunity_from_order(db: Session, order: Order) -> Optional[CrmOpportunity]:
    """
    Карточка лида B2C в воронке CRM, привязанная к заказу с сайта/приложения.
    Идемпотентно: повтор для того же order.id не создаёт дубликат.
    """
    customer = db.query(User).filter(User.id == order.customer_id).first()
    if not customer:
        return None

    stage = default_stage("lead")
    validate_stage("lead", stage)

    parts = [customer.first_name, customer.last_name]
    contact_name = " ".join(p for p in parts if p) or None

    existing = db.query(CrmOpportunity).filter(CrmOpportunity.linked_order_id == order.id).first()
    if existing:
        existing.phone = customer.phone
        existing.email = customer.email.strip() if customer.email else None
        existing.contact_name = contact_name
        existing.estimated_value_rub = order.total_price
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    scheduled = order.scheduled_at
    when = scheduled.strftime("%d.%m.%Y %H:%M") if scheduled else "—"

    desc_lines = [
        f"Заказ с сайта/ЛК. Номер: {order.order_number}",
        f"Адрес: {order.address}",
        f"Дата и время: {when}",
        f"Тип уборки: {order.cleaning_type}",
        f"Комнат: {order.rooms_count}, санузлов: {order.bathrooms_count}",
    ]
    if order.special_instructions:
        desc_lines.append(f"Комментарий клиента:\n{order.special_instructions}")
    description = "\n".join(desc_lines)

    row = CrmOpportunity(
        kind="lead",
        segment="b2c",
        stage=stage,
        title=f"Уборка {order.order_number}",
        description=description,
        contact_name=contact_name,
        phone=customer.phone,
        email=customer.email.strip() if customer.email else None,
        estimated_value_rub=order.total_price,
        linked_order_id=order.id,
        created_by_id=customer.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
