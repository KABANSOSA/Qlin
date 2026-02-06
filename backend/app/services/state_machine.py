"""
State machine for order lifecycle management.
"""
from typing import Dict, List, Optional
from enum import Enum
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.order_event import OrderEvent
from app.db.redis_client import redis_lock


class OrderStatus(str, Enum):
    """Order status enumeration."""
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    PAID = "paid"


class OrderStateMachine:
    """State machine for order status transitions."""

    # Valid transitions: from_status -> [to_statuses]
    VALID_TRANSITIONS: Dict[OrderStatus, List[OrderStatus]] = {
        OrderStatus.PENDING: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
        OrderStatus.ASSIGNED: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
        OrderStatus.IN_PROGRESS: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        OrderStatus.COMPLETED: [OrderStatus.PAID],
        OrderStatus.CANCELLED: [],  # Terminal state
        OrderStatus.PAID: [],  # Terminal state
    }

    @classmethod
    def can_transition(cls, from_status: str, to_status: str) -> bool:
        """Check if transition is valid."""
        try:
            from_enum = OrderStatus(from_status)
            to_enum = OrderStatus(to_status)
        except ValueError:
            return False

        return to_enum in cls.VALID_TRANSITIONS.get(from_enum, [])

    @classmethod
    def transition(
        cls,
        db: Session,
        order: Order,
        new_status: str,
        actor_id: Optional[str] = None,
        actor_type: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> bool:
        """
        Transition order to new status with race condition protection.
        
        Returns:
            bool: True if transition successful, False otherwise
        """
        if not cls.can_transition(order.status, new_status):
            return False

        # Use Redis lock to prevent race conditions
        lock_key = f"order_transition:{order.id}"
        with redis_lock(lock_key, timeout=5, expire=10) as acquired:
            if not acquired:
                return False

            # Re-fetch order to get latest status
            db.refresh(order)
            
            # Double-check transition is still valid
            if not cls.can_transition(order.status, new_status):
                return False

            # Record event
            event = OrderEvent(
                order_id=order.id,
                event_type=f"status_change_{new_status}",
                from_status=order.status,
                to_status=new_status,
                actor_id=actor_id,
                actor_type=actor_type,
                event_metadata=metadata,
            )
            db.add(event)

            # Update order status
            old_status = order.status
            order.status = new_status

            # Update timestamps based on status
            from datetime import datetime
            if new_status == OrderStatus.IN_PROGRESS.value:
                order.started_at = datetime.utcnow()
            elif new_status == OrderStatus.COMPLETED.value:
                order.completed_at = datetime.utcnow()

            db.commit()
            db.refresh(order)

            return True

    @classmethod
    def get_next_possible_statuses(cls, current_status: str) -> List[str]:
        """Get list of possible next statuses."""
        try:
            current_enum = OrderStatus(current_status)
        except ValueError:
            return []

        return [status.value for status in cls.VALID_TRANSITIONS.get(current_enum, [])]
