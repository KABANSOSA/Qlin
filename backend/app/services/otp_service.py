"""OTP по SMS (SMS.ru) + Redis."""

import logging
import random
import string
from typing import Optional, Tuple

import httpx

from app.core.config import settings
from app.db.redis_client import redis_client

logger = logging.getLogger(__name__)

KEY_OTP = "otp:phone:"
KEY_RATE = "otp:rate:"


def normalize_phone(phone: str) -> str:
    raw = "".join(c for c in phone.strip() if c.isdigit() or c == "+")
    digits = "".join(c for c in raw if c.isdigit())
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    if len(digits) == 10:
        digits = "7" + digits
    if not digits.startswith("7") or len(digits) != 11:
        raise ValueError("Укажите номер в формате +7XXXXXXXXXX")
    return "+" + digits


def _send_sms_ru(phone: str, text: str) -> bool:
    if not getattr(settings, "SMS_RU_API_ID", None):
        logger.warning("SMS не отправлено (нет SMS_RU_API_ID). Текст: %s", text)
        return False
    try:
        r = httpx.get(
            "https://sms.ru/sms/send",
            params={
                "api_id": settings.SMS_RU_API_ID,
                "to": phone.replace("+", ""),
                "msg": text,
                "json": "1",
            },
            timeout=15.0,
        )
        if r.status_code != 200:
            logger.warning("SMS.ru HTTP %s: %s", r.status_code, r.text[:300])
            return False
        data = r.json()
        if isinstance(data, dict) and data.get("status") == "OK":
            return True
        logger.warning("SMS.ru ответ: %s", data)
        return False
    except Exception:
        logger.exception("SMS.ru send failed")
        return False


def request_otp(phone: str) -> Tuple[str, bool]:
    """
    Создать код, сохранить в Redis на 5 мин.
    Returns (code, sms_sent).
    """
    phone = normalize_phone(phone)
    if redis_client.get(KEY_RATE + phone):
        raise ValueError("Подождите минуту перед повторным запросом кода")
    code = "".join(random.choices(string.digits, k=6))
    redis_client.setex(KEY_OTP + phone, 300, code)
    redis_client.setex(KEY_RATE + phone, 60, "1")
    text = f"Код входа QLIN: {code}"
    sent = _send_sms_ru(phone, text)
    return code, sent


def peek_otp(phone: str) -> Optional[str]:
    """Только для тестов / DEBUG."""
    try:
        p = normalize_phone(phone)
    except ValueError:
        return None
    return redis_client.get(KEY_OTP + p)


def verify_otp(phone: str, code: str) -> bool:
    try:
        phone = normalize_phone(phone)
    except ValueError:
        return False
    stored = redis_client.get(KEY_OTP + phone)
    if not stored or stored != code.strip():
        return False
    redis_client.delete(KEY_OTP + phone)
    return True
