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
from app.schemas.order import OrderResponse, OrderAdminResponse

router = APIRouter()


@router.get("/orders", response_model=List[OrderAdminResponse])
async def get_all_orders(
    status: str = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get all orders (admin only), с телефоном и email клиента для CRM."""
    query = (
        db.query(Order, User.phone, User.email)
        .join(User, Order.customer_id == User.id)
    )
    if status:
        query = query.filter(Order.status == status)

    rows = query.order_by(Order.created_at.desc()).limit(limit).offset(offset).all()
    out: List[OrderAdminResponse] = []
    for order, phone, email in rows:
        base = OrderResponse.model_validate(order)
        out.append(
            OrderAdminResponse(
                **base.model_dump(),
                customer_phone=phone,
                customer_email=email,
                special_instructions=order.special_instructions,
            )
        )
    return out


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
