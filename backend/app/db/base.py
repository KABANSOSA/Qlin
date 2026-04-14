"""Declarative Base без импорта settings (для Alembic и моделей)."""
from sqlalchemy.orm import declarative_base

Base = declarative_base()
