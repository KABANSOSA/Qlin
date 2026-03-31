"""
Order service for business logic.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from uuid import UUID, uuid4

from app.models.order import Order
from app.models.user import User
from app.models.zone import Zone
from app.services.state_machine import OrderStateMachine, OrderStatus
from app.services.pricing_service import PricingService
from app.services.notification_service import NotificationService
from app.db.redis_client import redis_lock


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

    @staticmethod
    def create_order(
        db: Session,
        customer_id: UUID,
        order_data: dict,
    ) -> Order:
        """Create a new order."""
        order_data = dict(order_data)
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
        )

        alat, alon = OrderService._normalize_lat_lon(
            order_data.get("address_lat"),
            order_data.get("address_lon"),
        )

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
            special_instructions=order_data.get("special_instructions"),
            scheduled_at=order_data["scheduled_at"],
            base_price=price_info["base_price"],
            extra_services_price=price_info.get("extra_services_price", 0),
            discount=price_info.get("discount", 0),
            total_price=price_info["total_price"],
            status=OrderStatus.PENDING.value,
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
    def get_order(db: Session, order_id: UUID) -> Optional[Order]:
        """Get order by ID."""
        return db.query(Order).filter(Order.id == order_id).first()
