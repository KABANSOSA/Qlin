"""Детерминированный «телефон» для OAuth-пользователей без номера (уникальность в users.phone)."""

import hashlib


def phone_from_oauth_sub(provider: str, sub: str) -> str:
    h = hashlib.sha256(f"{provider}:{sub}".encode()).hexdigest()
    digits = "".join(c for c in h if c.isdigit())
    if len(digits) < 10:
        digits = (digits + "0123456789" * 2)[:10]
    return "+7" + digits[:10]
