"""
Одноразовые токены сброса пароля в Redis.
"""
import logging
import secrets
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.redis_client import redis_client
from app.models.user import User
from app.services.email_service import send_password_reset_email

logger = logging.getLogger(__name__)

TOKEN_PREFIX = "pwdreset:"
TOKEN_TTL_SECONDS = 3600


def request_password_reset(db: Session, email: str) -> None:
    """
    Если пользователь с таким email есть — создаёт токен и отправляет письмо.
    Ошибки SMTP пробрасываются наверх. Не раскрывает, найден ли email.
    """
    user = (
        db.query(User)
        .filter(func.lower(User.email) == email.strip().lower())
        .first()
    )
    if not user or not user.email:
        logger.info("password_reset: no user for email (or no email on account)")
        return

    token = secrets.token_urlsafe(32)
    key = f"{TOKEN_PREFIX}{token}"
    redis_client.setex(key, TOKEN_TTL_SECONDS, str(user.id))

    base = settings.PUBLIC_SITE_URL.rstrip("/")
    reset_url = f"{base}/auth/reset-password?token={token}"

    send_password_reset_email(user.email, reset_url)


def reset_password_with_token(db: Session, token: str, new_password: str) -> bool:
    """
    Устанавливает новый пароль по одноразовому токену.
    Возвращает True при успехе, False если токен недействителен.
    """
    from app.core.security import get_password_hash

    key = f"{TOKEN_PREFIX}{token.strip()}"
    user_id_str = redis_client.get(key)
    if not user_id_str:
        return False

    redis_client.delete(key)

    try:
        user_uuid = UUID(user_id_str)
    except ValueError:
        return False

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user or not user.is_active:
        return False

    user.password_hash = get_password_hash(new_password)
    db.commit()
    return True
