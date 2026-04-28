"""
Admin endpoints.
"""
from typing import List, Dict, Any
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import func, inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, load_only

from app.db.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.models.order import Order
from app.models.payment import Payment
from app.models.cleaner import Cleaner
from app.schemas.order import (
    OrderResponse,
    OrderAdminResponse,
    OrderCostsUpdate,
    AssignOrderBody,
    AdminSetOrderStatusBody,
)
from app.schemas.cleaner_admin import AdminCreateCleanerBody
from app.schemas.admin_user import AdminCreateAdminBody
from app.core.security import get_password_hash
from app.services.order_service import OrderService

router = APIRouter()

# Колонки `orders` до миграции 005; без `load_only` ORM тянет и margin-поля и падает на старой схеме.
_ORDER_LOAD_BASE = (
    Order.id,
    Order.order_number,
    Order.customer_id,
    Order.cleaner_id,
    Order.zone_id,
    Order.address,
    Order.address_lat,
    Order.address_lon,
    Order.apartment,
    Order.entrance,
    Order.floor,
    Order.intercom,
    Order.cleaning_type,
    Order.rooms_count,
    Order.bathrooms_count,
    Order.area_sqm,
    Order.has_pets,
    Order.has_balcony,
    Order.special_instructions,
    Order.scheduled_at,
    Order.started_at,
    Order.completed_at,
    Order.base_price,
    Order.extra_services_price,
    Order.discount,
    Order.total_price,
    Order.status,
    Order.payment_status,
    Order.payment_method,
    Order.payment_id,
    Order.created_at,
    Order.updated_at,
)
_ORDER_LOAD_MARGIN = (Order.cleaner_payout, Order.supply_cost, Order.other_cost)


def _order_row_load_only(has_margin: bool):
    cols = list(_ORDER_LOAD_BASE)
    if has_margin:
        cols.extend(_ORDER_LOAD_MARGIN)
    return load_only(*cols)


def _orders_supports_margin_fields(db: Session) -> bool:
    """
    Backward-compatible guard: some environments may run old schema
    without cost fields on `orders` yet.
    """
    required = ("cleaner_payout", "supply_cost", "other_cost")
    if not all(hasattr(Order, field) for field in required):
        return False
    bind = db.get_bind()
    if bind is None:
        return False
    columns = {c["name"] for c in inspect(bind).get_columns("orders")}
    return all(field in columns for field in required)


def _compute_margin(order: Order) -> tuple:
    """Return (margin_rub, margin_pct) from order cost fields."""
    total = float(getattr(order, "total_price", 0) or 0)
    payout = float(getattr(order, "cleaner_payout", 0) or 0)
    supply = float(getattr(order, "supply_cost", 0) or 0)
    other = float(getattr(order, "other_cost", 0) or 0)
    costs = payout + supply + other
    margin_rub = round(total - costs, 2)
    margin_pct = round((margin_rub / total) * 100, 1) if total else 0.0
    return Decimal(str(margin_rub)), margin_pct


@router.get("/orders", response_model=List[OrderAdminResponse])
async def get_all_orders(
    status: str = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get all orders (admin only), с контактами клиента и именем/телефоном клинера для CRM."""
    from sqlalchemy.orm import aliased

    CustomerUser = aliased(User)
    CleanerUser = aliased(User)

    has_margin = _orders_supports_margin_fields(db)

    query = (
        db.query(
            Order,
            CustomerUser.phone,
            CustomerUser.email,
            CleanerUser.phone,
            CleanerUser.first_name,
        )
        .join(CustomerUser, Order.customer_id == CustomerUser.id)
        .outerjoin(CleanerUser, Order.cleaner_id == CleanerUser.id)
        .options(_order_row_load_only(has_margin))
    )
    if status:
        query = query.filter(Order.status == status)

    rows = query.order_by(Order.created_at.desc()).limit(limit).offset(offset).all()
    out: List[OrderAdminResponse] = []
    for order, cust_phone, cust_email, cl_phone, cl_name in rows:
        base = OrderResponse.model_validate(order)
        if has_margin:
            margin_rub, margin_pct = _compute_margin(order)
            cleaner_payout = order.cleaner_payout
            supply_cost = order.supply_cost or 0
            other_cost = order.other_cost or 0
        else:
            margin_rub, margin_pct = Decimal("0"), 0.0
            cleaner_payout = None
            supply_cost = Decimal("0")
            other_cost = Decimal("0")
        out.append(
            OrderAdminResponse(
                **base.model_dump(),
                customer_phone=cust_phone,
                customer_email=cust_email,
                cleaner_phone=cl_phone,
                cleaner_name=cl_name,
                cleaner_payout=cleaner_payout,
                supply_cost=supply_cost,
                other_cost=other_cost,
                margin_rub=margin_rub,
                margin_pct=margin_pct,
            )
        )
    return out


@router.get("/cleaners", response_model=List[dict])
async def list_cleaners_for_dispatch(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Уборщики с профилем — для назначения заказа в CRM."""
    rows = (
        db.query(User, Cleaner)
        .join(Cleaner, Cleaner.user_id == User.id)
        .filter(User.role == "cleaner", User.is_active.is_(True))
        .order_by(User.phone.asc())
        .all()
    )
    out = []
    for u, c in rows:
        out.append(
            {
                "user_id": str(u.id),
                "phone": u.phone,
                "first_name": u.first_name or "",
                "is_available": c.is_available,
                "rating": float(c.rating) if c.rating is not None else None,
            }
        )
    return out


@router.post("/cleaners", response_model=dict, status_code=status.HTTP_201_CREATED)
async def admin_create_cleaner(
    body: AdminCreateCleanerBody,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Завести уборщика: `users` с ролью `cleaner` + строка в `cleaners`.
    Без этого `GET /admin/cleaners` пустой и в CRM не из кого выбирать.
    Пароль опционален — без него вход по паролю недоступен (например, позже Telegram).
    """
    if db.query(User).filter(User.phone == body.phone).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким телефоном уже есть",
        )
    pwd = get_password_hash(body.password) if body.password else None
    user = User(
        phone=body.phone,
        first_name=body.first_name,
        role="cleaner",
        is_active=True,
        password_hash=pwd,
    )
    db.add(user)
    db.flush()
    profile = Cleaner(user_id=user.id)
    db.add(profile)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось создать: конфликт данных (телефон занят?)",
        )
    db.refresh(user)
    return {
        "user_id": str(user.id),
        "phone": user.phone,
        "first_name": user.first_name or "",
        "role": user.role,
    }


@router.post("/orders/{order_id}/assign")
async def admin_assign_order(
    order_id: UUID,
    body: AssignOrderBody,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Назначить исполнителя: заказ **pending** → **assigned**, `cleaner_id` на заказе.
    Дальше уборщик видит заказ в своих; клиенту — уведомление (если настроено).
    """
    cleaner = db.query(User).filter(User.id == body.cleaner_id, User.role == "cleaner").first()
    if not cleaner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь не найден или не является уборщиком",
        )
    ok = OrderService.assign_order(db, order_id, body.cleaner_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заказ не найден, уже назначен или занят другим процессом",
        )
    return {"status": "assigned", "order_id": str(order_id), "cleaner_id": str(body.cleaner_id)}


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def admin_patch_order_status(
    order_id: UUID,
    body: AdminSetOrderStatusBody,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Смена этапа воронки вручную (диспетчер CRM): FSM + откаты/быстрый финиш."""
    try:
        order = OrderService.admin_set_order_status(
            db, order_id, body.status.strip(), current_user.id
        )
        return OrderResponse.model_validate(order)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/orders/{order_id}/costs", response_model=OrderAdminResponse)
async def admin_update_order_costs(
    order_id: UUID,
    body: OrderCostsUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Ручная корректировка себестоимости заказа (выплата клинеру, расходники, прочее)."""
    from sqlalchemy.orm import aliased

    has_margin = _orders_supports_margin_fields(db)
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .options(_order_row_load_only(has_margin))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if has_margin:
        if body.cleaner_payout is not None:
            order.cleaner_payout = body.cleaner_payout
        if body.supply_cost is not None:
            order.supply_cost = body.supply_cost
        if body.other_cost is not None:
            order.other_cost = body.other_cost

    db.commit()
    if has_margin:
        db.refresh(order)

    CustomerUser = aliased(User)
    CleanerUser = aliased(User)
    row = (
        db.query(CustomerUser.phone, CustomerUser.email, CleanerUser.phone, CleanerUser.first_name)
        .select_from(Order)
        .join(CustomerUser, Order.customer_id == CustomerUser.id)
        .outerjoin(CleanerUser, Order.cleaner_id == CleanerUser.id)
        .filter(Order.id == order_id)
        .first()
    )
    cust_phone, cust_email, cl_phone, cl_name = row if row else (None, None, None, None)
    base = OrderResponse.model_validate(order)
    if has_margin:
        margin_rub, margin_pct = _compute_margin(order)
        cleaner_payout = order.cleaner_payout
        supply_cost = order.supply_cost or 0
        other_cost = order.other_cost or 0
    else:
        margin_rub, margin_pct = Decimal("0"), 0.0
        cleaner_payout = None
        supply_cost = Decimal("0")
        other_cost = Decimal("0")
    return OrderAdminResponse(
        **base.model_dump(),
        customer_phone=cust_phone,
        customer_email=cust_email,
        cleaner_phone=cl_phone,
        cleaner_name=cl_name,
        cleaner_payout=cleaner_payout,
        supply_cost=supply_cost,
        other_cost=other_cost,
        margin_rub=margin_rub,
        margin_pct=margin_pct,
    )


@router.get("/stats", response_model=Dict[str, Any])
async def get_admin_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Сводка для CRM: клиенты, заказы по статусам, выручка, период-метрики."""
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    customers = db.query(func.count(User.id)).filter(User.role == "customer").scalar() or 0
    cleaners_count = db.query(func.count(User.id)).filter(User.role == "cleaner").scalar() or 0
    orders_total = db.query(func.count(Order.id)).scalar() or 0

    status_rows = db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    by_status = {row[0]: row[1] for row in status_rows}

    paid_sum = (
        db.query(func.coalesce(func.sum(Order.total_price), 0))
        .filter(Order.payment_status == "paid")
        .scalar()
    ) or Decimal("0")

    orders_today = (
        db.query(func.count(Order.id))
        .filter(Order.created_at >= today_start)
        .scalar()
    ) or 0

    orders_this_week = (
        db.query(func.count(Order.id))
        .filter(Order.created_at >= week_start)
        .scalar()
    ) or 0

    orders_this_month = (
        db.query(func.count(Order.id))
        .filter(Order.created_at >= month_start)
        .scalar()
    ) or 0

    revenue_this_week = (
        db.query(func.coalesce(func.sum(Order.total_price), 0))
        .filter(Order.payment_status == "paid", Order.created_at >= week_start)
        .scalar()
    ) or Decimal("0")

    revenue_this_month = (
        db.query(func.coalesce(func.sum(Order.total_price), 0))
        .filter(Order.payment_status == "paid", Order.created_at >= month_start)
        .scalar()
    ) or Decimal("0")

    avg_order_value = (
        db.query(func.avg(Order.total_price))
        .filter(Order.status.notin_(["cancelled"]))
        .scalar()
    )

    # ---- Margin metrics (safe on pre-migration databases) ----
    total_payout = Decimal("0")
    total_supply = Decimal("0")
    total_other = Decimal("0")
    total_margin_rub = 0.0
    total_margin_pct = 0.0
    month_margin_rub = 0.0
    month_margin_pct = 0.0

    if _orders_supports_margin_fields(db):
        total_payout = (
            db.query(func.coalesce(func.sum(Order.cleaner_payout), 0))
            .filter(Order.status.notin_(["cancelled"]))
            .scalar()
        ) or Decimal("0")

        total_supply = (
            db.query(func.coalesce(func.sum(Order.supply_cost), 0))
            .filter(Order.status.notin_(["cancelled"]))
            .scalar()
        ) or Decimal("0")

        total_other = (
            db.query(func.coalesce(func.sum(Order.other_cost), 0))
            .filter(Order.status.notin_(["cancelled"]))
            .scalar()
        ) or Decimal("0")

        total_revenue_all = (
            db.query(func.coalesce(func.sum(Order.total_price), 0))
            .filter(Order.status.notin_(["cancelled"]))
            .scalar()
        ) or Decimal("0")

        total_costs = float(total_payout) + float(total_supply) + float(total_other)
        total_margin_rub = float(total_revenue_all) - total_costs
        total_margin_pct = (
            round((total_margin_rub / float(total_revenue_all)) * 100, 1)
            if float(total_revenue_all) > 0
            else 0.0
        )

        margin_this_month_rev = (
            db.query(func.coalesce(func.sum(Order.total_price), 0))
            .filter(Order.status.notin_(["cancelled"]), Order.created_at >= month_start)
            .scalar()
        ) or Decimal("0")

        margin_this_month_payout = (
            db.query(func.coalesce(func.sum(Order.cleaner_payout), 0))
            .filter(Order.status.notin_(["cancelled"]), Order.created_at >= month_start)
            .scalar()
        ) or Decimal("0")

        margin_this_month_supply = (
            db.query(func.coalesce(func.sum(Order.supply_cost), 0))
            .filter(Order.status.notin_(["cancelled"]), Order.created_at >= month_start)
            .scalar()
        ) or Decimal("0")

        margin_this_month_other = (
            db.query(func.coalesce(func.sum(Order.other_cost), 0))
            .filter(Order.status.notin_(["cancelled"]), Order.created_at >= month_start)
            .scalar()
        ) or Decimal("0")

        month_costs = float(margin_this_month_payout) + float(margin_this_month_supply) + float(margin_this_month_other)
        month_margin_rub = float(margin_this_month_rev) - month_costs
        month_margin_pct = (
            round((month_margin_rub / float(margin_this_month_rev)) * 100, 1)
            if float(margin_this_month_rev) > 0
            else 0.0
        )

    return {
        "customers": int(customers),
        "cleaners": int(cleaners_count),
        "orders_total": int(orders_total),
        "by_status": by_status,
        "revenue_paid_rub": float(paid_sum),
        "orders_today": int(orders_today),
        "orders_this_week": int(orders_this_week),
        "orders_this_month": int(orders_this_month),
        "revenue_this_week_rub": float(revenue_this_week),
        "revenue_this_month_rub": float(revenue_this_month),
        "avg_order_value_rub": round(float(avg_order_value), 2) if avg_order_value else 0.0,
        "total_margin_rub": round(total_margin_rub, 2),
        "total_margin_pct": total_margin_pct,
        "month_margin_rub": round(month_margin_rub, 2),
        "month_margin_pct": month_margin_pct,
        "total_payout_rub": float(total_payout),
    }


@router.post("/admins", response_model=dict, status_code=status.HTTP_201_CREATED)
async def admin_create_or_promote_admin(
    body: AdminCreateAdminBody,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Создать администратора или выдать роль admin существующему клиенту (по телефону).
    Уборщика (cleaner) через эту ручку не повышаем.
    """
    phone = body.phone.strip()
    existing = db.query(User).filter(User.phone == phone).first()
    pwd_hash = get_password_hash(body.password)

    if existing:
        if existing.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Этот пользователь уже администратор",
            )
        if existing.role == "cleaner":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Уборщика нельзя сделать администратором этой операцией",
            )
        if body.email:
            other = (
                db.query(User)
                .filter(func.lower(User.email) == body.email.lower(), User.id != existing.id)
                .first()
            )
            if other:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email уже занят другим пользователем",
                )
        existing.role = "admin"
        existing.password_hash = pwd_hash
        if body.first_name and body.first_name.strip():
            existing.first_name = body.first_name.strip()
        if body.email:
            existing.email = body.email
        db.add(existing)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Не удалось сохранить: конфликт email или телефона",
            )
        db.refresh(existing)
        return {
            "user_id": str(existing.id),
            "phone": existing.phone,
            "role": existing.role,
            "promoted": True,
        }

    if body.email:
        dup_email = db.query(User).filter(func.lower(User.email) == body.email.lower()).first()
        if dup_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже есть",
            )

    user = User(
        phone=phone,
        first_name=body.first_name,
        email=body.email,
        role="admin",
        is_active=True,
        password_hash=pwd_hash,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось создать: телефон или email уже заняты",
        )
    db.refresh(user)
    return {
        "user_id": str(user.id),
        "phone": user.phone,
        "role": user.role,
        "promoted": False,
    }


@router.get("/users", response_model=List[dict])
async def get_all_users(
    role: str = Query(None),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Список пользователей для CRM (контакты): email, имя, число заказов у клиентов."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)

    users = query.order_by(User.created_at.desc()).limit(limit).offset(offset).all()
    customer_ids = [u.id for u in users if u.role == "customer"]
    counts: Dict[str, int] = {}
    if customer_ids:
        rows = (
            db.query(Order.customer_id, func.count(Order.id))
            .filter(Order.customer_id.in_(customer_ids))
            .group_by(Order.customer_id)
            .all()
        )
        counts = {str(r[0]): int(r[1]) for r in rows}

    out = []
    for u in users:
        uid = str(u.id)
        item = {
            "id": uid,
            "phone": u.phone,
            "email": u.email,
            "first_name": u.first_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        if u.role == "customer":
            item["orders_count"] = counts.get(uid, 0)
        out.append(item)
    return out


@router.get("/payments", response_model=List[dict])
async def list_payment_records(
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Платежи из таблицы payments с номером заказа (если записей нет — пустой список)."""
    rows = (
        db.query(Payment, Order.order_number, User.phone, User.email)
        .join(Order, Payment.order_id == Order.id)
        .join(User, Order.customer_id == User.id)
        .order_by(Payment.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    result = []
    for pay, order_number, phone, email in rows:
        result.append(
            {
                "id": str(pay.id),
                "order_number": order_number,
                "amount": float(pay.amount),
                "currency": pay.currency,
                "status": pay.status,
                "payment_method": pay.payment_method,
                "provider_payment_id": pay.provider_payment_id,
                "created_at": pay.created_at.isoformat() if pay.created_at else None,
                "customer_phone": phone,
                "customer_email": email,
            }
        )
    return result
