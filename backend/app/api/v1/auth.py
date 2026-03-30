"""
Authentication endpoints.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.auth import Token, ForgotPasswordRequest, ResetPasswordRequest
from app.services.password_reset_service import request_password_reset, reset_password_with_token

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user exists
    existing_user = db.query(User).filter(User.phone == user_data.phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким телефоном уже зарегистрирован",
        )

    if user_data.email:
        existing_email = db.query(User).filter(func.lower(User.email) == user_data.email.lower()).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже зарегистрирован",
            )

    # Create user with hashed password
    try:
        from app.core.security import get_password_hash
        password_hash = get_password_hash(user_data.password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error hashing password: {str(e)}",
        )
    
    try:
        user = User(
            phone=user_data.phone,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            telegram_id=user_data.telegram_id,
            password_hash=password_hash,
            role="customer",
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот телефон или email уже заняты. Войдите или укажите другие данные.",
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось зарегистрировать. Попробуйте позже.",
        )

    return user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token (по телефону или email)."""
    login_value = (credentials.phone or "").strip()
    if "@" in login_value:
        user = (
            db.query(User)
            .filter(func.lower(User.email) == login_value.lower())
            .first()
        )
    else:
        user = db.query(User).filter(User.phone == login_value).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password",
        )

    # Verify password
    from app.core.security import verify_password
    if not user.password_hash or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password",
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Отправка письма со ссылкой сброса пароля (по email).
    Ответ одинаковый независимо от того, есть ли пользователь — не раскрываем email в БД.
    """
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Отправка писем не настроена на сервере. Обратитесь в поддержку.",
        )
    try:
        request_password_reset(db, body.email)
    except Exception:
        logger.exception("forgot_password: send failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось отправить письмо. Попробуйте позже.",
        )
    return {
        "message": "Если указанный email зарегистрирован, мы отправили ссылку для сброса пароля.",
    }


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Установка нового пароля по одноразовой ссылке из письма."""
    ok = reset_password_with_token(db, body.token, body.new_password)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ссылка недействительна или истекла. Запросите сброс пароля снова.",
        )
    return {"message": "Пароль успешно изменён. Можно войти."}


@router.post("/refresh", response_model=Token)
async def refresh_token_endpoint(request: Request, db: Session = Depends(get_db)):
    """Refresh: JSON body {\"refresh_token\": \"...\"} — явный разбор, без query."""
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Ожидается JSON с полем refresh_token",
        )
    token_str = data.get("refresh_token") if isinstance(data, dict) else None
    if not token_str or not isinstance(token_str, str):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="В теле запроса нужно поле refresh_token (строка)",
        )
    payload = decode_token(token_str)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Create new tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user
