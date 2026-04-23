"""
API v1 routes.
"""
from fastapi import APIRouter

from app.api.v1 import auth, orders, webhooks, users, admin, crm, ratings
from app.core.health_check import build_health_json_response

api_router = APIRouter(redirect_slashes=False)

# Тот же ответ, что GET /health, но под префиксом /api/v1 — для nginx, где прокси только /api/
@api_router.get("/health", include_in_schema=False, tags=["health"])
async def health_under_api_prefix():
    return await build_health_json_response()


api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(orders.router, tags=["orders"])
api_router.include_router(ratings.router, tags=["ratings"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(crm.router, prefix="/admin", tags=["admin"])
