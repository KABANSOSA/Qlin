"""
Order service for business logic.
"""
import logging
from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.models.order import Order
from app.models.user import User
from app.models.zone import Zone
from app.services.state_machine import OrderStateMachine, OrderStatus
from app.services.pricing_service import PricingService
from app.services.package_service import try_consume_package_for_order
from app.services.subscription_service import compute_subscription_discount
from app.services.notification_service import NotificationService
from app.services.crm_opportunity_service import create_opportunity_from_order
from app.core.pricing_constants import DEFAULT_CLEANER_PAYOUT_RATE
from app.db.redis_client import redis_lock

logger = logging.getLogger(__name__)


def _coerce_extra_services_json(raw: object) -> dict | None:
    """Только JSON-совместимые значения; пустой объект не храним."""
    if raw is None or not isinstance(raw, dict):
        return None
    out: dict = {}
    for key, val in raw.items():
        k = str(key)
        if isinstance(val, bool):
            if val:
                out[k] = True
        elif isinstance(val, Decimal):
            fv = float(val)
            if fv != 0:
                out[k] = fv
        elif isinstance(val, (int, float)) and not isinstance(val, bool):
            if val != 0:
                out[k] = val
        elif isinstance(val, str) and val.strip():
            out[k] = val.strip()
    return out or None


class OrderService:
    """Service for order management."""

    @staticmethod
    def _normalize_lat_lon(lat, lon):
        """Если широта/долгота перепутаны (|lat|>90), меняем местами — иначе overflow numeric(10,8)."""
        if lat is None or lon is None:
            return lat, lon
        try:
            lt = float(lat)
            ln = float(lon)
        except (TypeError, ValueError):
            return lat, lon
        if abs(lt) > 90 and abs(ln) <= 90:
            return ln, lt
        if abs(ln) > 90 and abs(lt) <= 90:
            return lt, ln
        return lt, ln

    @staticmethod
    def generate_order_number(db: Session) -> str:
        """Generate unique order number."""
        while True:
            # Format: ORD-YYYYMMDD-XXXX
            date_str = datetime.now().strftime("%Y%m%d")
            random_suffix = str(uuid4().hex[:4]).upper()
            order_number = f"ORD-{date_str}-{random_suffix}"

            existing = db.query(Order).filter(Order.order_number == order_number).first()
            if not existing:
                return order_number

    @staticmethod
    def resolve_zone_id(db: Session, zone_id: UUID) -> UUID:
        """
        Подставить реальную зону из БД, если пришла заглушка или несуществующий UUID
        (фронт пока шлёт 00000000-... до геопривязки зон).
        """
        zone = db.query(Zone).filter(Zone.id == zone_id).first()
        if zone:
            return zone.id
        fallback = (
            db.query(Zone)
            .filter(Zone.is_active.is_(True))
            .order_by(Zone.created_at.asc())
            .first()
        )
        if not fallback:
            raise ValueError(
                "В базе нет зон обслуживания. Запустите seed (зоны и тарифы) на сервере."
            )
        return fallback.id

    # Ключ из мобильного/веба → колонка Zone.city (см. seed)
    SERVICE_CITY_TO_ZONE_CITY = {
        "khabarovsk": "Хабаровск",
        "yuzhno_sakhalinsk": "Южно-Сахалинск",
    }

    @staticmethod
    def create_order(
        db: Session,
        customer_id: UUID,
        order_data: dict,
    ) -> Order:
        """Create a new order."""
        order_data = dict(order_data)
        order_source = str(order_data.pop("order_source", "site") or "site")
        service_city = order_data.pop("service_city", None)
        if service_city:
            city_label = OrderService.SERVICE_CITY_TO_ZONE_CITY.get(service_city)
            if city_label:
                zone_by_city = (
                    db.query(Zone)
                    .filter(Zone.city == city_label, Zone.is_active.is_(True))
                    .order_by(Zone.created_at.asc())
                    .first()
                )
                if zone_by_city:
                    order_data["zone_id"] = zone_by_city.id
        order_data["zone_id"] = OrderService.resolve_zone_id(db, order_data["zone_id"])

        # Calculate price
        pricing_service = PricingService()
        price_info = pricing_service.calculate_price(
            db=db,
            zone_id=order_data["zone_id"],
            cleaning_type=order_data["cleaning_type"],
            rooms_count=order_data.get("rooms_count", 1),
            bathrooms_count=order_data.get("bathrooms_count", 1),
            area_sqm=order_data.get("area_sqm"),
            extra_services=order_data.get("extra_services"),
        )

        alat, alon = OrderService._normalize_lat_lon(
            order_data.get("address_lat"),
            order_data.get("address_lon"),
        )

        total = price_info["total_price"]
        nominal_total = total.quantize(Decimal("0.01"))
        payout = (nominal_total * DEFAULT_CLEANER_PAYOUT_RATE).quantize(Decimal("0.01"))

        discount_pkg, total_after_pkg, pkg_id = try_consume_package_for_order(db, customer_id, total)
        subscription_tier = None
        if pkg_id:
            discount_amt = discount_pkg
            total_after = total_after_pkg
        else:
            sub_res = compute_subscription_discount(
                db, customer_id, order_data["scheduled_at"], total
            )
            subscription_tier = sub_res.tier
            discount_amt = sub_res.discount_amount
            total_after = (total - sub_res.discount_amount).quantize(Decimal("0.01"))
            if total_after < 0:
                total_after = Decimal("0")

        if pkg_id:
            pay_status = "paid"
            pay_method = "package"
        else:
            pay_status = "pending"
            pay_method = order_data.get("payment_method")

        # Create order
        order = Order(
            order_number=OrderService.generate_order_number(db),
            customer_id=customer_id,
            zone_id=order_data["zone_id"],
            address=order_data["address"],
            address_lat=alat,
            address_lon=alon,
            apartment=order_data.get("apartment"),
            entrance=order_data.get("entrance"),
            floor=order_data.get("floor"),
            intercom=order_data.get("intercom"),
            cleaning_type=order_data["cleaning_type"],
            rooms_count=order_data.get("rooms_count", 1),
            bathrooms_count=order_data.get("bathrooms_count", 1),
            area_sqm=order_data.get("area_sqm"),
            has_pets=order_data.get("has_pets", False),
            has_balcony=order_data.get("has_balcony", False),
            extra_services=_coerce_extra_services_json(order_data.get("extra_services")),
            special_instructions=order_data.get("special_instructions"),
            scheduled_at=order_data["scheduled_at"],
            base_price=price_info["base_price"],
            extra_services_price=price_info.get("extra_services_price", 0),
            discount=discount_amt,
            total_price=total_after,
            subscription_cleanings_tier=subscription_tier,
            package_purchase_id=pkg_id,
            cleaner_payout=payout,
            status=OrderStatus.PENDING.value,
            payment_method=pay_method,
            payment_status=pay_status,
        )

        db.add(order)
        db.commit()
        db.refresh(order)
        order_pk = order.id

        # Create initial event
        from app.models.order_event import OrderEvent
        event = OrderEvent(
            order_id=order_pk,
            event_type="order_created",
            from_status=None,
            to_status=OrderStatus.PENDING.value,
            actor_id=customer_id,
            actor_type="customer",
        )
        db.add(event)
        db.commit()

        # Notify cleaners via bot
        notification_service = NotificationService()
        notification_service.notify_cleaners_new_order(db, order)
        notification_service.notify_customer_order_created(db, order)

        order_for_dispatch = db.query(Order).filter(Order.id == order_pk).first()
        if order_for_dispatch is None:
            logger.error(
                "create_order: заказ %s не найден в БД перед dispatch — пропуск уведомлений диспетчеру",
                order_pk,
            )
        else:
            try:
                logger.warning(
                    "create_order: dispatch notify start order=%s source=%s",
                    order_for_dispatch.order_number,
                    order_source,
                )
                notification_service.notify_dispatch_new_order(
                    db, order_for_dispatch, source=order_source
                )
            except Exception:
                logger.exception(
                    "create_order: notify_dispatch_new_order failed order_pk=%s — заказ уже создан",
                    order_pk,
                )

        try:
            co_order = order_for_dispatch or db.query(Order).filter(Order.id == order_pk).first()
            if co_order:
                create_opportunity_from_order(db, co_order)
        except Exception:
            logging.exception("create_opportunity_from_order failed")

        # После нескольких commit/rollback сессия может «испортить» экземпляр — читаем заказ заново.
        reloaded = db.query(Order).filter(Order.id == order_pk).one()
        return reloaded

    @staticmethod
    def assign_order(
        db: Session,
        order_id: UUID,
        cleaner_id: UUID,
    ) -> bool:
        """
        Assign order to cleaner with race condition protection.
        
        Returns:
            bool: True if assignment successful, False otherwise
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return False

        if order.status != OrderStatus.PENDING.value:
            return False

        # Use Redis lock to prevent race conditions
        lock_key = f"order_assign:{order_id}"
        with redis_lock(lock_key, timeout=5, expire=10) as acquired:
            if not acquired:
                return False

            # Re-fetch order
            db.refresh(order)

            # Check if still available
            if order.status != OrderStatus.PENDING.value or order.cleaner_id is not None:
                return False

            # Assign cleaner
            order.cleaner_id = cleaner_id

            # Transition status
            success = OrderStateMachine.transition(
                db=db,
                order=order,
                new_status=OrderStatus.ASSIGNED.value,
                actor_id=cleaner_id,
                actor_type="cleaner",
            )

            if success:
                # commit уже внутри OrderStateMachine.transition
                notification_service = NotificationService()
                notification_service.notify_order_assigned(db, order)
                return True

        return False

    @staticmethod
    def get_user_orders(
        db: Session,
        user_id: UUID,
        role: str,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Order]:
        """Get orders for user."""
        query = db.query(Order)

        if role == "customer":
            query = query.filter(Order.customer_id == user_id)
        elif role == "cleaner":
            query = query.filter(Order.cleaner_id == user_id)

        if status:
            query = query.filter(Order.status == status)

        return query.order_by(Order.created_at.desc()).limit(limit).offset(offset).all()

    @staticmethod
    def list_available_orders(
        db: Session,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Order]:
        """Свободные заказы: pending, без исполнителя (для ленты клинера)."""
        return (
            db.query(Order)
            .filter(Order.status == OrderStatus.PENDING.value)
            .filter(Order.cleaner_id.is_(None))
            .order_by(Order.scheduled_at.asc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    @staticmethod
    def get_order(db: Session, order_id: UUID) -> Optional[Order]:
        """Get order by ID."""
        return db.query(Order).filter(Order.id == order_id).first()

    _FUNNEL_STATUSES = frozenset(
        {"pending", "assigned", "in_progress", "completed", "cancelled"}
    )

    @staticmethod
    def _admin_log_status_change(
        db: Session,
        order: Order,
        old: str,
        new: str,
        admin_id: UUID,
    ) -> None:
        from app.models.order_event import OrderEvent

        db.add(
            OrderEvent(
                order_id=order.id,
                event_type="admin_status_change",
                from_status=old,
                to_status=new,
                actor_id=admin_id,
                actor_type="admin",
                event_metadata={"manual_override": True},
            )
        )

    @staticmethod
    def _admin_apply_manual_status(
        db: Session,
        order: Order,
        old: str,
        new: str,
        admin_id: UUID,
    ) -> bool:
        """Переходы вне стандартной матрицы FSM (откат, быстрый финиш, возобновление)."""
        utcnow = lambda: datetime.now(timezone.utc)

        pair = (old, new)

        if pair in (("assigned", "pending"), ("in_progress", "pending")):
            order.status = "pending"
            order.cleaner_id = None
            order.started_at = None
            order.completed_at = None
            OrderService._admin_log_status_change(db, order, old, new, admin_id)
            db.commit()
            return True

        if pair == ("in_progress", "assigned"):
            order.status = "assigned"
            order.started_at = None
            OrderService._admin_log_status_change(db, order, old, new, admin_id)
            db.commit()
            return True

        if pair == ("completed", "in_progress"):
            if not order.cleaner_id:
                return False
            order.status = "in_progress"
            order.completed_at = None
            if order.started_at is None:
                order.started_at = utcnow()
            OrderService._admin_log_status_change(db, order, old, new, admin_id)
            db.commit()
            return True

        if pair == ("completed", "assigned"):
            if not order.cleaner_id:
                return False
            order.status = "assigned"
            order.completed_at = None
            order.started_at = None
            OrderService._admin_log_status_change(db, order, old, new, admin_id)
            db.commit()
            return True

        if pair == ("completed", "pending"):
            order.status = "pending"
            order.cleaner_id = None
            order.started_at = None
            order.completed_at = None
            OrderService._admin_log_status_change(db, order, old, new, admin_id)
            db.commit()
            return True

        if pair == ("cancelled", "pending"):
            order.status = "pending"
            order.cleaner_id = None
            order.started_at = None
            order.completed_at = None
            OrderService._admin_log_status_change(db, order, old, new, admin_id)
            db.commit()
            return True

        if pair == ("assigned", "completed"):
            if not order.cleaner_id:
                return False
            order.status = "completed"
            if order.completed_at is None:
                order.completed_at = utcnow()
            OrderService._admin_log_status_change(db, order, old, new, admin_id)
            db.commit()
            return True

        if pair == ("pending", "in_progress"):
            order.status = "in_progress"
            if order.started_at is None:
                order.started_at = utcnow()
            OrderService._admin_log_status_change(db, order, old, new, admin_id)
            db.commit()
            return True

        return False

    @staticmethod
    def admin_set_order_status(
        db: Session,
        order_id: UUID,
        new_status: str,
        admin_id: UUID,
    ) -> Order:
        """
        Смена этапа воронки диспетчером: сначала стандартный FSM, иначе ручные переходы.
        """
        if new_status not in OrderService._FUNNEL_STATUSES:
            raise ValueError(
                "Допустимые этапы: pending, assigned, in_progress, completed, cancelled"
            )

        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError("Заказ не найден")

        old = order.status
        if old == new_status:
            return order

        if old == "paid":
            raise ValueError("Заказ в статусе «Оплачен» — смена этапа вручную недоступна")

        if old == "pending" and new_status == "assigned":
            raise ValueError(
                "Из «Новый» в «Назначен» используйте «Назначить клинера» — нужен исполнитель."
            )

        if OrderStateMachine.can_transition(old, new_status):
            ok = OrderStateMachine.transition(
                db=db,
                order=order,
                new_status=new_status,
                actor_id=str(admin_id),
                actor_type="admin",
            )
            if ok:
                db.refresh(order)
                return order
            raise ValueError("Не удалось применить переход (конфликт состояния)")

        lock_key = f"order_transition:{order_id}"
        with redis_lock(lock_key, timeout=10, expire=15) as acquired:
            if not acquired:
                raise ValueError("Заказ занят другой операцией, повторите позже")

            db.refresh(order)
            old = order.status

            if OrderService._admin_apply_manual_status(db, order, old, new_status, admin_id):
                db.refresh(order)
                return order

        raise ValueError(
            f"Переход «{old}» → «{new_status}» сейчас недоступен. "
            "Проверьте этап и наличие клинера; из «Новый» в «Назначен» используйте «Назначить клинера»."
        )
