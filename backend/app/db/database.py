"""
Database connection and session management.
DATABASE_URL из окружения (Docker) подхватывается без загрузки Settings — иначе лишние
переменные из общего .env ломают Pydantic при `alembic upgrade`.
"""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base

load_dotenv()


def _database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    from app.core.config import settings

    return settings.DATABASE_URL


def _db_echo() -> bool:
    v = os.environ.get("DB_ECHO")
    if v is not None:
        return str(v).lower() in ("1", "true", "yes")
    from app.core.config import settings

    return settings.DB_ECHO


engine = create_engine(
    _database_url(),
    echo=_db_echo(),
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
