"""
Notification service for sending notifications.
"""
import logging
from sqlalchemy.orm import Session
import httpx

from app.models.order import Order
from app.models.user import User
from app.models.cleaner import Cleaner
from app.models.notification import Notification
from app.models.push_device import PushDevice
from app.core.config import settings
from app.services.expo_push_service import push_to_user_ids


class NotificationService:
    """Service for sending notifications."""

    @staticmethod
    def notify_dispatch_new_order(db: Session, order: Order, source: str = "site") -> None:
        """
        Telegram офису/диспетчеру при любом новом заказе (сайт или CRM).
        Задайте DISPATCH_TELEGRAM_CHAT_IDS в .env — через запятую (личный чат или группа).
        """
        raw = (settings.DISPATCH_TELEGRAM_CHAT_IDS or "").strip()
        if not raw:
            return
        chat_ids: list[int] = []
        for part in raw.split(","):
            part = part.strip()
            if not part:
                continue
            try:
                chat_ids.append(int(part))
            except ValueError:
                logging.warning("DISPATCH_TELEGRAM_CHAT_IDS: пропуск нечислового фрагмента %r", part)
        if not chat_ids:
            return
        src = "CRM" if source == "crm" else "Сайт"
        addr = (order.address or "").strip()
        if len(addr) > 200:
            addr = addr[:197] + "…"
        total = getattr(order, "total_price", None)
        total_s = f"\nСумма: {total} ₽" if total is not None else ""
        text = f"📋 Новый заказ ({src})\n#{order.order_number}\n{addr}{total_s}"
        for cid in chat_ids:
            ok = NotificationService._send_telegram_message(chat_id=cid, text=text)
            if ok:
                logging.info("Dispatch Telegram: заказ %s → chat %s", order.order_number, cid)
            else:
                logging.warning("Dispatch Telegram: не доставлено, заказ %s → chat %s", order.order_number, cid)

    @staticmethod
    def notify_cleaners_new_order(db: Session, order: Order):
        """Notify all available cleaners about new order via Telegram bot."""
        try:
            # Get all available cleaners
            cleaners = (
                db.query(User)
                .join(Cleaner)
                .filter(
                    User.role == "cleaner",
                    User.is_active == True,
                    Cleaner.is_available == True,
                    User.telegram_id.isnot(None),
                )
                .all()
            )

            for cleaner in cleaners:
                notification = Notification(
                    user_id=cleaner.id,
                    type="order_available",
                    title="Новый заказ",
                    message=f"Доступен новый заказ #{order.order_number}",
                    related_order_id=order.id,
                )
                db.add(notification)

            if cleaners:
                db.commit()

            # Push в приложение (Expo) всем клинерам с зарегистрированным токеном
            try:
                cleaner_ids_push = (
                    db.query(User.id)
                    .join(PushDevice, PushDevice.user_id == User.id)
                    .filter(User.role == "cleaner", User.is_active.is_(True))
                    .distinct()
                    .all()
                )
                if cleaner_ids_push:
                    push_to_user_ids(
                        db,
                        [r[0] for r in cleaner_ids_push],
                        "Новый заказ",
                        f"Доступен заказ #{order.order_number}",
                        {"type": "new_order", "order_id": str(order.id)},
                    )
            except Exception as e:
                logging.exception("notify_cleaners_new_order push failed: %s", e)
        except Exception as e:
            # Заказ уже создан — не прерываем ответ API из-за уведомлений
            db.rollback()
            logging.exception("notify_cleaners_new_order failed: %s", e)

    @staticmethod
    def notify_customer_order_created(db: Session, order: Order):
        """Клиенту: заказ принят (push, запись в ленте, Telegram при привязке)."""
        try:
            notification = Notification(
                user_id=order.customer_id,
                type="order_created",
                title="Заказ создан",
                message=f"Заказ #{order.order_number} принят. Ожидайте назначения уборщика.",
                related_order_id=order.id,
            )
            db.add(notification)
            db.commit()

            customer = db.query(User).filter(User.id == order.customer_id).first()
            if customer and customer.telegram_id:
                NotificationService._send_telegram_message(
                    chat_id=customer.telegram_id,
                    text=f"✅ Заказ #{order.order_number} принят. Ожидайте назначения уборщика.",
                )

            push_to_user_ids(
                db,
                [order.customer_id],
                "Заказ создан",
                f"Заказ #{order.order_number} принят",
                {"type": "order_created", "order_id": str(order.id)},
            )
        except Exception as e:
            db.rollback()
            logging.exception("notify_customer_order_created failed: %s", e)

    @staticmethod
    def notify_order_assigned(db: Session, order: Order):
        """Notify customer that order was assigned."""
        notification = Notification(
            user_id=order.customer_id,
            type="order_assigned",
            title="Заказ назначен",
            message=f"Заказ #{order.order_number} назначен уборщику",
            related_order_id=order.id,
        )
        db.add(notification)
        db.commit()

        # Also send via Telegram if customer has telegram_id
        customer = db.query(User).filter(User.id == order.customer_id).first()
        if customer and customer.telegram_id:
            # Send message via Telegram Bot API
            NotificationService._send_telegram_message(
                chat_id=customer.telegram_id,
                text=f"✅ Заказ #{order.order_number} назначен уборщику",
            )

        try:
            push_to_user_ids(
                db,
                [order.customer_id],
                "Заказ назначен",
                f"Заказ #{order.order_number} назначен уборщику",
                {"type": "order_assigned", "order_id": str(order.id)},
            )
        except Exception as e:
            logging.exception("notify_order_assigned push failed: %s", e)

    @staticmethod
    def notify_customer_order_in_progress(db: Session, order: Order):
        """Клиенту: уборка началась."""
        try:
            push_to_user_ids(
                db,
                [order.customer_id],
                "Уборка началась",
                f"Заказ #{order.order_number} в работе",
                {"type": "in_progress", "order_id": str(order.id)},
            )
        except Exception as e:
            logging.exception("notify_customer_order_in_progress push failed: %s", e)

    @staticmethod
    def notify_customer_order_completed(db: Session, order: Order):
        """Клиенту: уборка завершена."""
        try:
            notification = Notification(
                user_id=order.customer_id,
                type="order_completed",
                title="Уборка завершена",
                message=f"Заказ #{order.order_number} выполнен. Оцените качество и оплатите.",
                related_order_id=order.id,
            )
            db.add(notification)
            db.commit()

            push_to_user_ids(
                db,
                [order.customer_id],
                "Уборка завершена",
                f"Заказ #{order.order_number} выполнен. Можно оплатить.",
                {"type": "completed", "order_id": str(order.id)},
            )

            customer = db.query(User).filter(User.id == order.customer_id).first()
            if customer and customer.telegram_id:
                NotificationService._send_telegram_message(
                    chat_id=customer.telegram_id,
                    text=f"✅ Заказ #{order.order_number} выполнен! Оцените уборку и оплатите в личном кабинете.",
                )
        except Exception as e:
            db.rollback()
            logging.exception("notify_customer_order_completed failed: %s", e)

    @staticmethod
    def notify_order_cancelled(db: Session, order: Order, cancelled_by: str):
        """Уведомить клиента и клинера (если назначен) об отмене заказа."""
        try:
            notification = Notification(
                user_id=order.customer_id,
                type="order_cancelled",
                title="Заказ отменён",
                message=f"Заказ #{order.order_number} отменён.",
                related_order_id=order.id,
            )
            db.add(notification)

            if order.cleaner_id and cancelled_by != "cleaner":
                cleaner_notif = Notification(
                    user_id=order.cleaner_id,
                    type="order_cancelled",
                    title="Заказ отменён",
                    message=f"Заказ #{order.order_number} отменён клиентом.",
                    related_order_id=order.id,
                )
                db.add(cleaner_notif)

            db.commit()

            push_to_user_ids(
                db,
                [order.customer_id],
                "Заказ отменён",
                f"Заказ #{order.order_number} отменён",
                {"type": "cancelled", "order_id": str(order.id)},
            )

            if order.cleaner_id and cancelled_by != "cleaner":
                push_to_user_ids(
                    db,
                    [order.cleaner_id],
                    "Заказ отменён",
                    f"Заказ #{order.order_number} отменён клиентом",
                    {"type": "cancelled", "order_id": str(order.id)},
                )

            customer = db.query(User).filter(User.id == order.customer_id).first()
            if customer and customer.telegram_id:
                NotificationService._send_telegram_message(
                    chat_id=customer.telegram_id,
                    text=f"❌ Заказ #{order.order_number} отменён.",
                )
        except Exception as e:
            db.rollback()
            logging.exception("notify_order_cancelled failed: %s", e)

    @staticmethod
    def _send_telegram_message(chat_id: int, text: str) -> bool:
        """
        Send message via Telegram Bot API.
        Returns True on success. Telegram often returns HTTP 200 with {"ok": false} — обязательно проверяем ok.
        """
        try:
            url = f"{settings.TELEGRAM_API_URL}{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
            with httpx.Client() as client:
                response = client.post(
                    url,
                    json={
                        "chat_id": chat_id,
                        "text": text,
                    },
                    timeout=10.0,
                )
            try:
                data = response.json() if response.content else {}
            except Exception:
                logging.warning("Telegram response not JSON: %s", (response.text or "")[:300])
                return False

            if not response.is_success:
                logging.warning(
                    "Telegram HTTP %s: %s",
                    response.status_code,
                    (response.text or "")[:500],
                )
                return False
            if isinstance(data, dict) and data.get("ok") is False:
                logging.warning(
                    "Telegram sendMessage failed: %s",
                    data.get("description", data),
                )
                return False
            return True
        except Exception as e:
            logging.warning("Telegram sendMessage error: %s", e, exc_info=True)
            return False
