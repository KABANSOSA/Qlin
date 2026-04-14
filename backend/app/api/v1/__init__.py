"""
API v1 routes.
"""
from fastapi import APIRouter

from app.api.v1 import auth, orders, webhooks, users, admin, crm

api_router = APIRouter(redirect_slashes=False)

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(orders.router, tags=["orders"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(crm.router, prefix="/admin", tags=["admin"])
