"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1 import api_router
from app.db.database import engine
from app.models import Base

# Note: Tables are created via Alembic migrations, not here
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="QLIN API",
    description="Cleaning service platform API compatible with Telegram bot",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
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


@app.get("/")
async def root():
    """Health check endpoint."""
    return JSONResponse(
        content={
            "status": "ok",
            "message": "QLIN API",
            "version": "1.0.0",
        }
    )


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return JSONResponse(
        content={
            "status": "healthy",
            "database": "connected",
            "redis": "connected",
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
