"""
Создание платежей и проверка уведомлений ЮKassa (API v3).
Документация: https://yookassa.ru/developers/api
"""
from __future__ import annotations

import base64
import logging
import uuid
from decimal import Decimal
from typing import Any, Dict, Optional

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import Order
from app.models.payment import Payment

logger = logging.getLogger(__name__)

YOOKASSA_API = "https://api.yookassa.ru/v3"


def _configured() -> bool:
    return bool(
        settings.YOOKASSA_SHOP_ID and settings.YOOKASSA_SECRET_KEY and settings.YOOKASSA_SHOP_ID.strip()
    )


def is_yookassa_configured() -> bool:
    """Есть ли ключи магазина для API ЮKassa."""
    return _configured()


def _basic_auth_header() -> Dict[str, str]:
    raw = f"{settings.YOOKASSA_SHOP_ID}:{settings.YOOKASSA_SECRET_KEY}".encode()
    encoded = base64.b64encode(raw).decode("ascii")
    return {"Authorization": f"Basic {encoded}"}


def _amount_str(value: Decimal) -> str:
    return f"{float(value):.2f}"


async def create_payment_confirmation_url(
    db: Session,
    order: Order,
    return_url: str,
) -> str:
    """
    Создаёт платёж в ЮKassa, сохраняет запись в payments, возвращает URL для редиректа пользователя.
    """
    if not _configured():
        raise RuntimeError("YooKassa не настроена (YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY)")

    if order.payment_status == "paid":
        raise ValueError("Заказ уже оплачен")

    if order.status != "completed":
        raise ValueError("Оплата доступна только после завершения уборки")

    idempotence_key = str(uuid.uuid4())
    payload: Dict[str, Any] = {
        "amount": {"value": _amount_str(order.total_price), "currency": "RUB"},
        "confirmation": {"type": "redirect", "return_url": return_url},
        "capture": True,
        "description": f"Заказ {order.order_number}",
        "metadata": {"order_id": str(order.id), "order_number": str(order.order_number)},
    }

    headers = {
        **_basic_auth_header(),
        "Idempotence-Key": idempotence_key,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{YOOKASSA_API}/payments", json=payload, headers=headers)

    if r.status_code not in (200, 201):
        logger.error("YooKassa create payment failed: %s %s", r.status_code, r.text)
        raise RuntimeError("Не удалось создать платёж в ЮKassa")

    data = r.json()
    payment_id = data.get("id")
    status = data.get("status", "pending")
    confirmation = data.get("confirmation") or {}
    confirmation_url = confirmation.get("confirmation_url")

    if not payment_id or not confirmation_url:
        logger.error("YooKassa unexpected response: %s", data)
        raise RuntimeError("Некорректный ответ ЮKassa")

    pay = Payment(
        order_id=order.id,
        amount=order.total_price,
        currency="RUB",
        payment_method="yookassa",
        payment_provider="yookassa",
        provider_payment_id=payment_id,
        status="pending" if status == "pending" else status,
        payment_metadata=data,
    )
    db.add(pay)
    order.payment_id = payment_id
    db.commit()

    return confirmation_url


async def fetch_payment_by_id(provider_payment_id: str) -> Optional[Dict[str, Any]]:
    """GET /v3/payments/{id} — для проверки уведомления."""
    if not _configured():
        return None
    headers = {**_basic_auth_header(), "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(f"{YOOKASSA_API}/payments/{provider_payment_id}", headers=headers)
    if r.status_code != 200:
        logger.warning("YooKassa fetch payment %s: %s %s", provider_payment_id, r.status_code, r.text)
        return None
    return r.json()


def mark_order_paid_from_webhook(db: Session, payment_data: Dict[str, Any]) -> bool:
    """
    Обрабатывает объект платежа из API (после проверки уведомления).
    """
    if payment_data.get("status") != "succeeded":
        return False

    meta = payment_data.get("metadata") or {}
    order_id_str = meta.get("order_id")
    provider_id = payment_data.get("id")
    if not order_id_str or not provider_id:
        return False

    try:
        oid = uuid.UUID(str(order_id_str))
    except ValueError:
        return False

    order = db.query(Order).filter(Order.id == oid).first()
    if not order:
        return False

    if order.payment_status == "paid":
        return True

    amount_val = (payment_data.get("amount") or {}).get("value")
    if amount_val is not None:
        try:
            if Decimal(str(amount_val)) != Decimal(str(order.total_price)):
                logger.warning("YooKassa amount mismatch: order %s", order.id)
                return False
        except Exception:
            pass

    order.payment_status = "paid"
    order.payment_method = "yookassa"
    order.payment_id = provider_id

    pay = (
        db.query(Payment)
        .filter(Payment.provider_payment_id == provider_id)
        .first()
    )
    if pay:
        pay.status = "succeeded"
        pay.payment_metadata = payment_data
    else:
        db.add(
            Payment(
                order_id=order.id,
                amount=order.total_price,
                currency="RUB",
                payment_method="yookassa",
                payment_provider="yookassa",
                provider_payment_id=provider_id,
                status="succeeded",
                payment_metadata=payment_data,
            )
        )

    db.commit()
    return True
