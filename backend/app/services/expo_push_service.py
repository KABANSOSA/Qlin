"""Отправка push через Expo Push API (токены из таблицы push_devices)."""

import logging
from typing import Any, Dict, Iterable, List, Optional
from uuid import UUID

import httpx
from sqlalchemy.orm import Session

from app.models.push_device import PushDevice

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

logger = logging.getLogger(__name__)


def _chunked(items: List[str], size: int) -> Iterable[List[str]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def send_expo_push(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> None:
    """Отправить одно уведомление на список Expo Push токенов (батчи по 100)."""
    if not tokens:
        return
    messages = [
        {
            "to": t,
            "title": title,
            "body": body,
            "sound": "default",
            "priority": "high",
            "data": data or {},
        }
        for t in tokens
    ]
    for batch in _chunked(messages, 100):
        try:
            with httpx.Client(timeout=15.0) as client:
                r = client.post(EXPO_PUSH_URL, json={"messages": batch})
                if r.status_code >= 400:
                    logger.warning("Expo push HTTP %s: %s", r.status_code, r.text[:500])
        except Exception:
            logger.exception("Expo push request failed")


def push_to_user_ids(db: Session, user_ids: Iterable, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> None:
    """Все push-токены указанных пользователей."""
    uids: List[UUID] = []
    for u in user_ids:
        if isinstance(u, UUID):
            uids.append(u)
        else:
            uids.append(UUID(str(u)))
    uids = list({u for u in uids})
    if not uids:
        return
    rows = db.query(PushDevice.token).filter(PushDevice.user_id.in_(uids)).all()
    tokens = [r[0] for r in rows if r[0]]
    send_expo_push(tokens, title, body, data)
