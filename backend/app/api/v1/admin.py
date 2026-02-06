"""
Admin endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.models.order import Order
from app.schemas.order import OrderResponse

router = APIRouter()


@router.get("/orders", response_model=List[OrderResponse])
async def get_all_orders(
    status: str = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get all orders (admin only)."""
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    
    orders = query.order_by(Order.created_at.desc()).limit(limit).offset(offset).all()
    return orders


@router.get("/users", response_model=List[dict])
async def get_all_users(
    role: str = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get all users (admin only)."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    
    users = query.limit(limit).offset(offset).all()
    return [{"id": str(u.id), "phone": u.phone, "role": u.role, "is_active": u.is_active} for u in users]
