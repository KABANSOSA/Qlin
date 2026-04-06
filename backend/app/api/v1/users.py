"""
User endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.push_device import PushDevice
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.push import PushTokenRegister

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/push-token", status_code=status.HTTP_204_NO_CONTENT)
async def register_push_token(
    body: PushTokenRegister,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Сохранить Expo Push token устройства (после логина из мобильного приложения)."""
    platform = body.platform.strip().lower()
    if platform not in ("ios", "android"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="platform must be ios or android",
        )
    row = (
        db.query(PushDevice)
        .filter(PushDevice.user_id == current_user.id, PushDevice.token == body.token)
        .first()
    )
    if row:
        row.platform = platform
    else:
        db.add(PushDevice(user_id=current_user.id, token=body.token, platform=platform))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
