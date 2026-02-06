"""
Order endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.core.dependencies import get_current_active_customer, get_current_user
from app.models.user import User
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate
from app.services.order_service import OrderService
from app.services.state_machine import OrderStateMachine

router = APIRouter()


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_active_customer),
    db: Session = Depends(get_db),
):
    """Create a new order."""
    order_data_dict = order_data.model_dump()
    order = OrderService.create_order(
        db=db,
        customer_id=current_user.id,
        order_data=order_data_dict,
    )
    return order


@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's orders."""
    orders = OrderService.get_user_orders(
        db=db,
        user_id=current_user.id,
        role=current_user.role,
        status=status,
        limit=limit,
        offset=offset,
    )
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get order by ID."""
    order = OrderService.get_order(db=db, order_id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # Check access
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    if current_user.role == "cleaner" and order.cleaner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    return order


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: UUID,
    order_update: OrderUpdate,
    current_user: User = Depends(get_current_active_customer),
    db: Session = Depends(get_db),
):
    """Update order (only customer can update their own pending orders)."""
    order = OrderService.get_order(db=db, order_id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update pending orders",
        )

    # Update fields
    update_data = order_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)

    db.commit()
    db.refresh(order)

    return order


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel order."""
    order = OrderService.get_order(db=db, order_id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # Check permissions
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    # Transition to cancelled
    success = OrderStateMachine.transition(
        db=db,
        order=order,
        new_status="cancelled",
        actor_id=str(current_user.id),
        actor_type=current_user.role,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel order in current status",
        )

    return order
