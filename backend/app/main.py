"""
Main FastAPI application entry point.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.health_check import build_health_json_response
from app.core.logging_config import setup_logging
from app.api.v1 import api_router

import app.models  # noqa: F401 — регистрация ORM-моделей

setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="QLIN API",
    description="Cleaning service platform API compatible with Telegram bot",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    redirect_slashes=False,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

# Совместимость с nginx: `location /api/` + `proxy_pass http://127.0.0.1:8000/;` (слэш после порта)
# подменяет префикс /api/ на /, и на бэкенд приходит /v1/health вместо /api/v1/health.
async def health_compat_stripped_api_prefix():
    return await build_health_json_response()


for _path in ("/v1/health", "/v1/health/"):
    app.add_api_route(_path, health_compat_stripped_api_prefix, methods=["GET"], include_in_schema=False)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    import time

    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 1)

    if request.url.path not in ("/", "/health"):
        logger.info(
            "%s %s → %s (%sms)",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера"},
    )


@app.get("/")
async def root():
    return JSONResponse(
        content={
            "status": "ok",
            "message": "QLIN API",
            "version": "1.0.0",
        }
    )


@app.get("/health")
async def health_check():
    """Проверяет реальные подключения к PostgreSQL и Redis."""
    return await build_health_json_response()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
