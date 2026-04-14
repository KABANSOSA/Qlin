"""
Webhook endpoints for Telegram bot integration.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.core.config import settings
from app.core.security import verify_telegram_webhook
from app.schemas.webhook import TelegramWebhook
from app.services.order_service import OrderService
from app.services.state_machine import OrderStateMachine
from app.services import yookassa_service
from app.models.order import Order

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/telegram")
async def telegram_webhook(
    webhook_data: TelegramWebhook,
    x_telegram_secret: Optional[str] = Header(None, alias="X-Telegram-Secret"),
    db: Session = Depends(get_db),
):
    """
    Webhook endpoint for Telegram bot events.
    
    Bot sends events like:
    - order_accept: Cleaner accepted order
    - order_start: Cleaner started work
    - order_complete: Cleaner completed work
    - order_cancel: Order cancelled
    """
    # Verify webhook secret
    secret = x_telegram_secret or webhook_data.secret
    if not verify_telegram_webhook(settings.TELEGRAM_WEBHOOK_SECRET, secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook secret",
        )

    order = OrderService.get_order(db=db, order_id=webhook_data.order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # Handle different event types
    if webhook_data.event_type == "order_accept":
        if not webhook_data.cleaner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="cleaner_id required for order_accept",
            )
        
        success = OrderService.assign_order(
            db=db,
            order_id=webhook_data.order_id,
            cleaner_id=webhook_data.cleaner_id,
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign order (may be already assigned or not in pending status)",
            )

    elif webhook_data.event_type == "order_start":
        success = OrderStateMachine.transition(
            db=db,
            order=order,
            new_status="in_progress",
            actor_id=str(webhook_data.cleaner_id) if webhook_data.cleaner_id else None,
            actor_type="cleaner",
            metadata=webhook_data.metadata,
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot start order",
            )

    elif webhook_data.event_type == "order_complete":
        success = OrderStateMachine.transition(
            db=db,
            order=order,
            new_status="completed",
            actor_id=str(webhook_data.cleaner_id) if webhook_data.cleaner_id else None,
            actor_type="cleaner",
            metadata=webhook_data.metadata,
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot complete order",
            )

    elif webhook_data.event_type == "order_cancel":
        success = OrderStateMachine.transition(
            db=db,
            order=order,
            new_status="cancelled",
            actor_id=str(webhook_data.cleaner_id) if webhook_data.cleaner_id else None,
            actor_type="cleaner",
            metadata=webhook_data.metadata,
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel order",
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown event type: {webhook_data.event_type}",
        )

    db.refresh(order)
    return {"status": "ok", "order_id": str(order.id), "order_status": order.status}


@router.post("/yookassa")
async def yookassa_payment_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Уведомления ЮKassa (payment.succeeded).
    URL для кабинета: https://<ваш-домен>/api/v1/webhooks/yookassa
    """
    if not yookassa_service.is_yookassa_configured():
        logger.warning("yookassa webhook: YooKassa not configured")
        return {"status": "ignored", "reason": "not_configured"}

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON")

    event = body.get("event")
    obj = body.get("object") or {}
    if event != "payment.succeeded":
        return {"status": "ignored", "event": event or ""}

    payment_id = obj.get("id")
    if not payment_id:
        return {"status": "ignored"}

    verified = await yookassa_service.fetch_payment_by_id(payment_id)
    if not verified:
        logger.warning("yookassa webhook: cannot verify payment %s", payment_id)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment verification failed")

    if verified.get("status") != "succeeded":
        return {"status": "ignored", "payment_status": verified.get("status")}

    try:
        ok = yookassa_service.mark_order_paid_from_webhook(db, verified)
    except Exception:
        logger.exception("yookassa webhook: mark paid failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Update failed",
        )

    return {"status": "ok" if ok else "noop"}
