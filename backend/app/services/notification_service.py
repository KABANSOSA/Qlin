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
            push_to_user_ids(
                db,
                [order.customer_id],
                "Уборка завершена",
                f"Заказ #{order.order_number} выполнен. Можно оплатить.",
                {"type": "completed", "order_id": str(order.id)},
            )
        except Exception as e:
            logging.exception("notify_customer_order_completed push failed: %s", e)

    @staticmethod
    def _send_telegram_message(chat_id: int, text: str):
        """Send message via Telegram Bot API."""
        try:
            url = f"{settings.TELEGRAM_API_URL}{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
            with httpx.Client() as client:
                response = client.post(
                    url,
                    json={
                        "chat_id": chat_id,
                        "text": text,
                    },
                    timeout=5.0,
                )
                response.raise_for_status()
        except Exception as e:
            print(f"Error sending Telegram message: {e}")
