"""
Admin endpoints.
"""
from typing import List, Dict, Any, Optional
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
    AdminManualOrderCreate,
    AdminPurgeAllOrdersBody,
)
from app.services.otp_service import normalize_phone
from app.schemas.cleaner_admin import AdminCreateCleanerBody
from app.schemas.admin_user import AdminCreateAdminBody
from app.core.security import get_password_hash
from app.core.config import settings
from app.services.order_service import OrderService
from app.services.order_purge_service import purge_all_orders, delete_single_order
from app.services.notification_service import NotificationService

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


def _order_row_load_only(finance_cols: Optional[Dict[str, bool]]):
    cols = list(_ORDER_LOAD_BASE)
    # Не трогаем Order.cleaner_payout на уровне модуля: в старых образах модель Order без этих колонок —
    # иначе AttributeError при импорте admin.py.
    if finance_cols:
        for name in ("cleaner_payout", "supply_cost", "other_cost"):
            if finance_cols.get(name):
                col = getattr(Order, name, None)
                if col is not None:
                    cols.append(col)
    return load_only(*cols)


def _orders_finance_columns(db: Session) -> dict[str, bool]:
    """
    Какие поля себестоимости реально есть в БД (частичные миграции / старые проды).
    Достаточно `cleaner_payout`, чтобы CRM показывала выплату и маржу; supply/other опциональны.
    """
    out = {"cleaner_payout": False, "supply_cost": False, "other_cost": False}
    bind = db.get_bind()
    if bind is None:
        return out
    try:
        columns = {c["name"] for c in inspect(bind).get_columns("orders")}
    except Exception:
        return out
    for name in out:
        if name in columns and getattr(Order, name, None) is not None:
            out[name] = True
    return out


def _orders_supports_margin_fields(db: Session) -> bool:
    """
    Backward-compatible guard: some environments may run old schema
    without cost fields on `orders` yet.
    """
    return _orders_finance_columns(db).get("cleaner_payout", False)


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


def _single_order_admin_response(db: Session, order_id: UUID) -> OrderAdminResponse:
    """Сборка карточки заказа для CRM (листинг и деталь после PATCH)."""
    from sqlalchemy.orm import aliased

    has_margin = _orders_supports_margin_fields(db)
    finance_cols = _orders_finance_columns(db) if has_margin else None
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .options(_order_row_load_only(finance_cols))
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")

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
        supply_cost = (
            (order.supply_cost or 0) if finance_cols and finance_cols.get("supply_cost") else Decimal("0")
        )
        other_cost = (
            (order.other_cost or 0) if finance_cols and finance_cols.get("other_cost") else Decimal("0")
        )
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
    finance_cols = _orders_finance_columns(db) if has_margin else None

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
        .options(_order_row_load_only(finance_cols))
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
            supply_cost = (
                (order.supply_cost or 0) if finance_cols and finance_cols.get("supply_cost") else Decimal("0")
            )
            other_cost = (
                (order.other_cost or 0) if finance_cols and finance_cols.get("other_cost") else Decimal("0")
            )
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


@router.post("/orders", response_model=OrderAdminResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_manual_order(
    body: AdminManualOrderCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Ручное создание заявки из CRM: заказчик определяется по телефону
    (профиль customer создаётся автоматически при отсутствии номера в базе).
    """
    try:
        phone = normalize_phone(body.customer_phone)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)) from e

    customer_user = db.query(User).filter(User.phone == phone).first()
    email_clean = body.customer_email.strip() if body.customer_email and body.customer_email.strip() else None

    if customer_user:
        if customer_user.role != "customer":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Номер уже привязан к пользователю с ролью «{customer_user.role}». "
                    "Укажите другой телефон или работайте с этим пользователем через его аккаунт."
                ),
            )
        if email_clean and customer_user.email != email_clean:
            taken = (
                db.query(User.id)
                .filter(User.email == email_clean, User.id != customer_user.id)
                .first()
            )
            if taken:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Этот email уже занят другим пользователем",
                )
            customer_user.email = email_clean
            try:
                db.commit()
                db.refresh(customer_user)
            except IntegrityError:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Не удалось сохранить email (конфликт)",
                ) from None
    else:
        customer_user = User(phone=phone, role="customer", is_active=True, email=email_clean)
        db.add(customer_user)
        try:
            db.commit()
            db.refresh(customer_user)
        except IntegrityError:
            db.rollback()
            customer_user = db.query(User).filter(User.phone == phone).first()
            if not customer_user or customer_user.role != "customer":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Не удалось создать профиль клиента (конфликт данных)",
                )

    order_payload = body.model_dump(exclude={"customer_phone", "customer_email"})
    order_payload["order_source"] = "crm"
    try:
        order = OrderService.create_order(
            db=db,
            customer_id=customer_user.id,
            order_data=order_payload,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    return _single_order_admin_response(db, order.id)


@router.post("/orders/purge-all", response_model=dict)
async def admin_purge_all_orders(
    _body: AdminPurgeAllOrdersBody,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Удалить все заявки и связанные платежи/оценки (стенд или явное ALLOW_PURGE_ALL_ORDERS).

    Тело: {"confirm": "purge_all_orders"}
    """
    if not settings.DEBUG and not settings.ALLOW_PURGE_ALL_ORDERS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Очистка заявок отключена. Для стенда задайте ALLOW_PURGE_ALL_ORDERS=true или DEBUG=true.",
        )
    try:
        stats = purge_all_orders(db)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"status": "ok", **stats}


@router.delete("/orders/{order_id}", response_model=dict)
async def admin_delete_order(
    order_id: UUID,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Удалить одну заявку (платежи, оценка, уведомления; необратимо)."""
    try:
        stats = delete_single_order(db, order_id)
        if not stats.get("deleted"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
    return {"status": "ok", "order_number": stats["order_number"]}


@router.get("/telegram/dispatch-status", response_model=dict)
async def admin_telegram_dispatch_status(_admin: User = Depends(get_current_admin)):
    """Проверка: DISPATCH, токен бота (getMe), без отправки сообщений в чаты диспетчера."""
    raw = (settings.DISPATCH_TELEGRAM_CHAT_IDS or "").strip()
    ids: list[int] = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            ids.append(int(part))
        except ValueError:
            pass
    tok = settings.TELEGRAM_BOT_TOKEN or ""
    token_placeholder = tok.startswith("0000000000") or len(tok) < 20
    me_ok, me_detail = NotificationService.telegram_get_me()
    return {
        "dispatch_chat_ids_count": len(ids),
        "dispatch_chat_ids": ids,
        "telegram_token_configured": bool(tok and not token_placeholder),
        "telegram_get_me_ok": me_ok,
        "telegram_bot": me_detail if me_ok else None,
        "telegram_get_me_error": None if me_ok else me_detail,
    }


@router.post("/telegram/test-dispatch", response_model=dict)
async def admin_telegram_test_dispatch(_admin: User = Depends(get_current_admin)):
    """
    Отправить тестовое сообщение во все чаты из DISPATCH_TELEGRAM_CHAT_IDS.
    Убедитесь, что вы написали боту /start в личке (или бот добавлен в группу).
    """
    raw = (settings.DISPATCH_TELEGRAM_CHAT_IDS or "").strip()
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DISPATCH_TELEGRAM_CHAT_IDS не задан в окружении backend.",
        )
    chat_ids: list[int] = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            chat_ids.append(int(part))
        except ValueError:
            pass
    if not chat_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось разобрать ни одного chat id из DISPATCH_TELEGRAM_CHAT_IDS.",
        )
    me_ok, me_detail = NotificationService.telegram_get_me()
    if not me_ok:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Токен бота не работает (getMe): {me_detail}",
        )
    results: list[dict] = []
    for cid in chat_ids:
        ok, err = NotificationService.send_telegram_message_result(
            cid,
            "QLIN — тест диспетчерского канала. Если видите это сообщение, отправка работает.",
        )
        row: dict = {"chat_id": cid, "ok": ok}
        if not ok and err:
            row["telegram_error"] = err
        results.append(row)
    return {"status": "ok", "telegram_bot": me_detail, "results": results}


@router.get("/vk/dispatch-status", response_model=dict)
async def admin_vk_dispatch_status(_admin: User = Depends(get_current_admin)):
    """Проверка: DISPATCH_VK_PEER_IDS, ключ сообщества (messages.getConversations)."""
    raw = (settings.DISPATCH_VK_PEER_IDS or "").strip()
    ids: list[int] = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            ids.append(int(part))
        except ValueError:
            pass
    tok = (settings.VK_COMMUNITY_TOKEN or "").strip()
    if not tok:
        return {
            "dispatch_peer_ids_count": len(ids),
            "dispatch_peer_ids": ids,
            "vk_token_configured": False,
            "vk_api_check_ok": False,
            "vk_api_check_error": "VK_COMMUNITY_TOKEN не задан",
            "vk_api_version": settings.VK_API_VERSION,
        }
    me_ok, me_detail = NotificationService.vk_dispatch_api_check()
    return {
        "dispatch_peer_ids_count": len(ids),
        "dispatch_peer_ids": ids,
        "vk_token_configured": True,
        "vk_api_check_ok": me_ok,
        "vk_api_check_error": None if me_ok else me_detail,
        "vk_api_version": settings.VK_API_VERSION,
    }


@router.post("/vk/test-dispatch", response_model=dict)
async def admin_vk_test_dispatch(_admin: User = Depends(get_current_admin)):
    """
    Тестовое сообщение во все peer_id из DISPATCH_VK_PEER_IDS.
    Пользователь ВК должен открыть диалог с сообществом (написать в ЛС сообщества).
    """
    raw = (settings.DISPATCH_VK_PEER_IDS or "").strip()
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DISPATCH_VK_PEER_IDS не задан в окружении backend.",
        )
    peer_ids: list[int] = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            peer_ids.append(int(part))
        except ValueError:
            pass
    if not peer_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось разобрать ни одного peer id из DISPATCH_VK_PEER_IDS.",
        )
    tok = (settings.VK_COMMUNITY_TOKEN or "").strip()
    if not tok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VK_COMMUNITY_TOKEN не задан.",
        )
    me_ok, me_detail = NotificationService.vk_dispatch_api_check()
    if not me_ok:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Ключ сообщества не работает (VK API): {me_detail}",
        )
    results: list[dict] = []
    msg = "QLIN — тест диспетчерского канала VK. Если видите это сообщение, отправка работает."
    for pid in peer_ids:
        ok, err = NotificationService.send_vk_dispatch_message_result(peer_id=pid, text=msg)
        row: dict = {"peer_id": pid, "ok": ok}
        if not ok and err:
            row["vk_error"] = err
        results.append(row)
    return {"status": "ok", "vk_api": "ok", "results": results}


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
    has_margin = _orders_supports_margin_fields(db)
    finance_cols = _orders_finance_columns(db) if has_margin else None
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .options(_order_row_load_only(finance_cols))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if has_margin:
        if body.supply_cost is not None:
            if not finance_cols or not finance_cols.get("supply_cost"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Колонка supply_cost отсутствует в БД — обновите миграции",
                )
            order.supply_cost = body.supply_cost
        if body.other_cost is not None:
            if not finance_cols or not finance_cols.get("other_cost"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Колонка other_cost отсутствует в БД — обновите миграции",
                )
            order.other_cost = body.other_cost
        if body.margin_pct is not None:
            total = Decimal(str(order.total_price or 0))
            supply = (
                Decimal(str(order.supply_cost or 0))
                if finance_cols and finance_cols.get("supply_cost")
                else Decimal("0")
            )
            other = (
                Decimal(str(order.other_cost or 0))
                if finance_cols and finance_cols.get("other_cost")
                else Decimal("0")
            )
            target_margin = (total * body.margin_pct / Decimal("100")).quantize(Decimal("0.01"))
            order.cleaner_payout = max(Decimal("0"), total - target_margin - supply - other)
        elif body.cleaner_payout is not None:
            order.cleaner_payout = body.cleaner_payout

    db.commit()
    if has_margin:
        db.refresh(order)

    return _single_order_admin_response(db, order_id)


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

    finance_cols = _orders_finance_columns(db)
    if finance_cols.get("cleaner_payout"):
        total_payout = (
            db.query(func.coalesce(func.sum(Order.cleaner_payout), 0))
            .filter(Order.status.notin_(["cancelled"]))
            .scalar()
        ) or Decimal("0")

        if finance_cols.get("supply_cost"):
            total_supply = (
                db.query(func.coalesce(func.sum(Order.supply_cost), 0))
                .filter(Order.status.notin_(["cancelled"]))
                .scalar()
            ) or Decimal("0")

        if finance_cols.get("other_cost"):
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

        margin_this_month_supply = Decimal("0")
        if finance_cols.get("supply_cost"):
            margin_this_month_supply = (
                db.query(func.coalesce(func.sum(Order.supply_cost), 0))
                .filter(Order.status.notin_(["cancelled"]), Order.created_at >= month_start)
                .scalar()
            ) or Decimal("0")

        margin_this_month_other = Decimal("0")
        if finance_cols.get("other_cost"):
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
