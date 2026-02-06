"""
Redis client for caching and distributed locks.
"""
import redis
from typing import Optional
from contextlib import contextmanager

from app.core.config import settings

redis_client = redis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
)


@contextmanager
def redis_lock(key: str, timeout: int = 10, expire: int = 30):
    """
    Context manager for distributed lock using Redis.
    
    Args:
        key: Lock key
        timeout: Time to wait for lock acquisition (seconds)
        expire: Lock expiration time (seconds)
    
    Yields:
        bool: True if lock acquired, False otherwise
    """
    lock = redis_client.lock(
        f"lock:{key}",
        timeout=timeout,
        sleep=0.1,
        blocking_timeout=timeout,
    )
    
    acquired = lock.acquire(blocking=True)
    try:
        yield acquired
    finally:
        if acquired:
            lock.release()


def get_cache(key: str) -> Optional[str]:
    """Get value from cache."""
    return redis_client.get(key)


def set_cache(key: str, value: str, ttl: int = None) -> bool:
    """Set value in cache with optional TTL."""
    if ttl is None:
        ttl = settings.REDIS_CACHE_TTL
    return redis_client.setex(key, ttl, value)


def delete_cache(key: str) -> bool:
    """Delete key from cache."""
    return redis_client.delete(key) > 0
