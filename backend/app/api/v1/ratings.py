"""
Rating / review endpoints.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.order import Order
from app.models.rating import Rating
from app.models.user import User
from app.schemas.rating import RatingCreate, RatingResponse, CleanerRatingStats

router = APIRouter(prefix="/ratings", redirect_slashes=False)


@router.post(
    "/orders/{order_id}",
    response_model=RatingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_rating(
    order_id: UUID,
    body: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Клиент оставляет оценку после завершения заказа (один раз)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    if order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Можно оценить только свой заказ")
    if order.status not in ("completed", "paid"):
        raise HTTPException(
            status_code=400,
            detail="Оценить можно только завершённый или оплаченный заказ",
        )
    if not order.cleaner_id:
        raise HTTPException(status_code=400, detail="Заказ не был назначен клинеру")

    existing = db.query(Rating).filter(Rating.order_id == order_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Оценка уже оставлена")

    rating = Rating(
        order_id=order.id,
        customer_id=current_user.id,
        cleaner_id=order.cleaner_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)

    try:
        from app.workers.tasks import recalculate_cleaner_rating

        recalculate_cleaner_rating.delay(str(order.cleaner_id))
    except Exception:
        pass

    return rating


@router.get("/orders/{order_id}", response_model=RatingResponse)
async def get_order_rating(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить отзыв по заказу."""
    rating = db.query(Rating).filter(Rating.order_id == order_id).first()
    if not rating:
        raise HTTPException(status_code=404, detail="Отзыв не найден")

    if current_user.role != "admin" and current_user.id not in (
        rating.customer_id,
        rating.cleaner_id,
    ):
        raise HTTPException(status_code=403, detail="Нет доступа")

    return rating


@router.get("/cleaners/{cleaner_id}", response_model=List[RatingResponse])
async def get_cleaner_ratings(
    cleaner_id: UUID,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Отзывы о клинере (доступно всем авторизованным)."""
    return (
        db.query(Rating)
        .filter(Rating.cleaner_id == cleaner_id)
        .order_by(Rating.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


@router.get("/cleaners/{cleaner_id}/stats", response_model=CleanerRatingStats)
async def get_cleaner_stats(
    cleaner_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Средняя оценка клинера."""
    row = (
        db.query(
            func.avg(Rating.rating).label("avg"),
            func.count(Rating.id).label("cnt"),
        )
        .filter(Rating.cleaner_id == cleaner_id)
        .first()
    )
    avg_val = float(row.avg) if row.avg else 0.0
    return CleanerRatingStats(
        cleaner_id=cleaner_id,
        average_rating=round(avg_val, 2),
        total_reviews=row.cnt or 0,
    )
