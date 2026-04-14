"""
Order endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.core.dependencies import (
    get_current_user,
    get_current_customer_or_admin,
    get_current_cleaner,
)
from app.models.user import User
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate
from app.services.order_service import OrderService
from app.services.state_machine import OrderStateMachine
from app.services.notification_service import NotificationService
from app.services import yookassa_service
from app.core.config import settings

# Явные пути /orders/... без prefix на роутере — иначе "/" + include даёт /orders/ и 307 на URL без завершающего слэша
router = APIRouter(redirect_slashes=False)


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
@router.post("/orders/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_customer_or_admin),
    db: Session = Depends(get_db),
):
    """Create a new order."""
    order_data_dict = order_data.model_dump()
    try:
        order = OrderService.create_order(
            db=db,
            customer_id=current_user.id,
            order_data=order_data_dict,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    return order


@router.get("/orders", response_model=List[OrderResponse])
@router.get("/orders/", response_model=List[OrderResponse])
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


@router.get("/orders/available", response_model=List[OrderResponse])
@router.get("/orders/available/", response_model=List[OrderResponse])
async def list_available_orders_for_cleaner(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_cleaner),
    db: Session = Depends(get_db),
):
    """Свободные заказы (pending, без клинера) — лента для исполнителя."""
    return OrderService.list_available_orders(db=db, limit=limit, offset=offset)


@router.get("/orders/{order_id}", response_model=OrderResponse)
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
    if current_user.role == "admin":
        return order
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    if current_user.role == "cleaner":
        if order.cleaner_id == current_user.id:
            pass
        elif order.cleaner_id is None and order.status == "pending":
            pass  # просмотр карточки до принятия
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )

    return order


@router.post("/orders/{order_id}/accept", response_model=OrderResponse)
async def cleaner_accept_order(
    order_id: UUID,
    current_user: User = Depends(get_current_cleaner),
    db: Session = Depends(get_db),
):
    """Клинер: принять свободный заказ (pending → assigned)."""
    order = OrderService.get_order(db=db, order_id=order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != "pending" or order.cleaner_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заказ уже занят или недоступен для принятия",
        )
    ok = OrderService.assign_order(db=db, order_id=order_id, cleaner_id=current_user.id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось принять заказ. Попробуйте ещё раз.",
        )
    order = OrderService.get_order(db=db, order_id=order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.patch("/orders/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: UUID,
    order_update: OrderUpdate,
    current_user: User = Depends(get_current_customer_or_admin),
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


@router.post("/orders/{order_id}/cancel", response_model=OrderResponse)
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


@router.post("/orders/{order_id}/start", response_model=OrderResponse)
async def cleaner_start_order(
    order_id: UUID,
    current_user: User = Depends(get_current_cleaner),
    db: Session = Depends(get_db),
):
    """Клинер: начать уборку (assigned → in_progress)."""
    order = OrderService.get_order(db=db, order_id=order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.cleaner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    success = OrderStateMachine.transition(
        db=db,
        order=order,
        new_status="in_progress",
        actor_id=str(current_user.id),
        actor_type="cleaner",
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Можно начать только назначенный заказ (статус assigned)",
        )
    db.refresh(order)
    try:
        NotificationService.notify_customer_order_in_progress(db, order)
    except Exception:
        pass
    return order


@router.post("/orders/{order_id}/complete", response_model=OrderResponse)
async def cleaner_complete_order(
    order_id: UUID,
    current_user: User = Depends(get_current_cleaner),
    db: Session = Depends(get_db),
):
    """Клинер: завершить уборку (in_progress → completed)."""
    order = OrderService.get_order(db=db, order_id=order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.cleaner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    success = OrderStateMachine.transition(
        db=db,
        order=order,
        new_status="completed",
        actor_id=str(current_user.id),
        actor_type="cleaner",
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Можно завершить только заказ в работе (статус in_progress)",
        )
    db.refresh(order)
    try:
        NotificationService.notify_customer_order_completed(db, order)
    except Exception:
        pass
    return order


@router.get("/orders/{order_id}/payment-url", response_model=dict)
async def get_order_payment_page_url(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ссылка на страницу заказа на сайте (оплата и детали в веб-интерфейсе)."""
    order = OrderService.get_order(db=db, order_id=order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    if current_user.role not in ("customer", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    base = settings.PUBLIC_SITE_URL.rstrip("/")
    return {"url": f"{base}/orders/{order_id}"}


@router.post("/orders/{order_id}/payment/yookassa", response_model=dict)
async def create_yookassa_payment_session(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Создать платёж в ЮKassa и вернуть confirmation_url для редиректа пользователя на оплату.
    """
    order = OrderService.get_order(db=db, order_id=order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if current_user.role != "admin" and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    if current_user.role not in ("customer", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    base = settings.PUBLIC_SITE_URL.rstrip("/")
    return_url = f"{base}/orders/{order_id}"

    try:
        confirmation_url = await yookassa_service.create_payment_confirmation_url(
            db, order, return_url=return_url
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        ) from e

    return {"confirmation_url": confirmation_url}
