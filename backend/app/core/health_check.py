"""Сборка ответа /health (БД + Redis) — общая для корня и /api/v1/health."""
import logging
from typing import Any, Dict

from fastapi.responses import JSONResponse
from sqlalchemy import text

logger = logging.getLogger(__name__)


async def build_health_json_response() -> JSONResponse:
    from app.db.database import SessionLocal

    checks: Dict[str, Any] = {"status": "healthy"}

    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            checks["database"] = "connected"
        finally:
            db.close()
    except Exception as exc:
        logger.warning("health: DB unreachable — %s", exc)
        checks["database"] = "unavailable"
        checks["status"] = "degraded"

    try:
        from app.db.redis_client import redis_client

        redis_client.ping()
        checks["redis"] = "connected"
    except Exception as exc:
        logger.warning("health: Redis unreachable — %s", exc)
        checks["redis"] = "unavailable"
        checks["status"] = "degraded"

    status_code = 200 if checks["status"] == "healthy" else 503
    return JSONResponse(content=checks, status_code=status_code)
