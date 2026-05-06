"""
Полное удаление всех заказов из БД (стенды, сброс данных).

Перед DELETE orders убираются платежи и отзывы (FK без CASCADE),
обнуляются ссылки в уведомлениях. События заказов и часть CRM-комментариев
удаляются каскадом; задачи CRM и сделки — SET NULL по FK в БД.
"""

from uuid import UUID

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.order import Order
from app.models.payment import Payment
from app.models.rating import Rating


def purge_all_orders(db: Session) -> dict[str, int]:
    """
    Удаляет все строки из payments, ratings, orders и сбрасывает notifications.related_order_id.
    Не вызывает commit — закрепите транзакцию снаружи.
    """
    db.query(Payment).delete(synchronize_session=False)
    db.query(Rating).delete(synchronize_session=False)
    db.execute(
        update(Notification)
        .where(Notification.related_order_id.isnot(None))
        .values(related_order_id=None)
    )
    deleted_orders = db.query(Order).delete(synchronize_session=False)
    return {"deleted_orders": deleted_orders}


def delete_single_order(db: Session, order_id: UUID) -> dict:
    """
    Удаляет один заказ: платежи и отзыв по этому заказу, сброс notifications,
    затем строка order (события и привязанные CRM-комментарии — по FK в БД).
    Не вызывает commit.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return {"deleted": False}

    order_number = order.order_number
    db.query(Payment).filter(Payment.order_id == order_id).delete(synchronize_session=False)
    db.query(Rating).filter(Rating.order_id == order_id).delete(synchronize_session=False)
    db.execute(
        update(Notification)
        .where(Notification.related_order_id == order_id)
        .values(related_order_id=None)
    )
    db.query(Order).filter(Order.id == order_id).delete(synchronize_session=False)
    return {"deleted": True, "order_number": order_number}
