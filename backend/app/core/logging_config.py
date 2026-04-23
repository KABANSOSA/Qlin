"""
Structured logging configuration.

Вызывается один раз при старте приложения (main.py).
Формат: JSON в проде, human-readable при DEBUG.
"""
import logging
import sys
from app.core.config import settings


def _json_formatter() -> logging.Formatter:
    try:
        from pythonjsonlogger import jsonlogger

        return jsonlogger.JsonFormatter(
            "%(asctime)s %(levelname)s %(name)s %(message)s",
            rename_fields={"asctime": "timestamp", "levelname": "level"},
        )
    except ImportError:
        return logging.Formatter(
            '{"timestamp":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}'
        )


def setup_logging() -> None:
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    root = logging.getLogger()
    root.setLevel(level)

    if root.handlers:
        root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)

    if settings.DEBUG:
        fmt = logging.Formatter(
            "%(asctime)s  %(levelname)-8s  %(name)-30s  %(message)s",
            datefmt="%H:%M:%S",
        )
    else:
        fmt = _json_formatter()

    handler.setFormatter(fmt)
    root.addHandler(handler)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.DB_ECHO else logging.WARNING
    )
