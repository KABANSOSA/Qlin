"""
Celery tasks: фоновые уведомления, напоминания, обновление рейтингов.

Запуск воркера:
    celery -A app.workers.celery_app worker -l info
Запуск beat (периодические):
    celery -A app.workers.celery_app beat -l info
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from app.workers.celery_app import celery_app
from app.db.database import SessionLocal

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Фоновая отправка push-уведомлений (не блокирует HTTP-ответ)
# ---------------------------------------------------------------------------

@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def send_push_notification(self, user_ids: list, title: str, body: str, data: Optional[dict] = None):
    """Отправить push-уведомление списку пользователей в фоне."""
    try:
        from app.services.expo_push_service import send_expo_push
        from app.models.push_device import PushDevice

        db = SessionLocal()
        try:
            uids = [UUID(uid) for uid in user_ids]
            rows = db.query(PushDevice.token).filter(PushDevice.user_id.in_(uids)).all()
            tokens = [r[0] for r in rows if r[0]]
            if tokens:
                send_expo_push(tokens, title, body, data)
                logger.info("Push sent to %d devices for %d users", len(tokens), len(uids))
        finally:
            db.close()
    except Exception as exc:
        logger.exception("send_push_notification failed")
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def send_telegram_message(self, chat_id: int, text: str):
    """Отправить сообщение через Telegram Bot API в фоне."""
    try:
        import httpx
        from app.core.config import settings

        url = f"{settings.TELEGRAM_API_URL}{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json={"chat_id": chat_id, "text": text})
            resp.raise_for_status()
        logger.info("Telegram message sent to %s", chat_id)
    except Exception as exc:
        logger.exception("send_telegram_message failed")
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 2. Напоминание клиенту за 2 часа до визита
# ---------------------------------------------------------------------------

@celery_app.task
def send_order_reminders():
    """
    Периодическая задача: найти заказы со scheduled_at через ~2 часа
    и отправить push + Telegram клиенту.
    """
    from app.models.order import Order
    from app.models.user import User

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        window_start = now + timedelta(hours=1, minutes=50)
        window_end = now + timedelta(hours=2, minutes=10)

        orders = (
            db.query(Order)
            .filter(
                Order.status.in_(["assigned", "pending"]),
                Order.scheduled_at.between(window_start, window_end),
            )
            .all()
        )

        for order in orders:
            customer = db.query(User).filter(User.id == order.customer_id).first()
            if not customer:
                continue

            msg = f"Напоминание: уборка #{order.order_number} запланирована через ~2 часа"
            send_push_notification.delay(
                [str(order.customer_id)],
                "Скоро уборка",
                msg,
                {"type": "reminder", "order_id": str(order.id)},
            )

            if customer.telegram_id:
                send_telegram_message.delay(customer.telegram_id, f"⏰ {msg}")

        if orders:
            logger.info("Sent reminders for %d orders", len(orders))
    except Exception:
        logger.exception("send_order_reminders failed")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# 3. Пересчёт среднего рейтинга клинера после нового отзыва
# ---------------------------------------------------------------------------

@celery_app.task
def recalculate_cleaner_rating(cleaner_user_id: str):
    """Пересчитать средний рейтинг клинера из таблицы ratings и обновить cleaners.rating."""
    from sqlalchemy import func as sa_func
    from app.models.rating import Rating
    from app.models.cleaner import Cleaner

    db = SessionLocal()
    try:
        uid = UUID(cleaner_user_id)
        row = (
            db.query(
                sa_func.avg(Rating.rating).label("avg"),
                sa_func.count(Rating.id).label("cnt"),
            )
            .filter(Rating.cleaner_id == uid)
            .first()
        )
        avg_val = float(row.avg) if row.avg else 0.0
        total = row.cnt or 0

        profile = db.query(Cleaner).filter(Cleaner.user_id == uid).first()
        if profile:
            profile.rating = round(avg_val, 2)
            profile.completed_orders = total
            db.commit()
            logger.info(
                "Cleaner %s rating updated: %.2f (%d reviews)",
                cleaner_user_id, avg_val, total,
            )
    except Exception:
        db.rollback()
        logger.exception("recalculate_cleaner_rating failed")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Celery Beat schedule (периодические задачи)
# ---------------------------------------------------------------------------

celery_app.conf.beat_schedule = {
    "order-reminders-every-10-min": {
        "task": "app.workers.tasks.send_order_reminders",
        "schedule": 600.0,
    },
}
