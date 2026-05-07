"""
На части VPS IPv6 до внешних API недоступен; httpx может выбрать AAAA и получить Network unreachable.
Для указанных хостов сначала резолвим только IPv4 (AF_INET).
"""

from __future__ import annotations

from contextlib import contextmanager
import socket
from typing import Any, Callable

_original_getaddrinfo: Callable[..., Any] = socket.getaddrinfo

# Хосты, для которых на проблемных VPS отключён рабочий IPv6
_IPV4_FIRST_HOSTS = frozenset({"api.telegram.org", "exp.host", "api.vk.com"})


def _patched_getaddrinfo(
    host: Any,
    port: Any,
    family: int = 0,
    type: int = 0,
    proto: int = 0,
    flags: int = 0,
) -> list[Any]:
    h = str(host).lower().rstrip(".")
    if family in (0, socket.AF_UNSPEC) and h in _IPV4_FIRST_HOSTS:
        try:
            v4 = _original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
            if v4:
                return v4
        except OSError:
            pass
    return _original_getaddrinfo(host, port, family, type, proto, flags)


@contextmanager
def force_ipv4_for_external_apis() -> Any:
    socket.getaddrinfo = _patched_getaddrinfo
    try:
        yield
    finally:
        socket.getaddrinfo = _original_getaddrinfo
