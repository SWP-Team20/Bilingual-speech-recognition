from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.src.database import get_db
from backend.src.models import User, UserRole
from backend.src.schemas import UserCreate, UserResponse, Token
from backend.src.services.auth import hash_password, verify_password, create_access_token
from backend.src.schemas import ChangePasswordRequest
from backend.src.dependencies import get_current_user, RoleChecker
from backend.src import models, schemas

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Automatically creates a long-lived ~1 year access token based on our service update
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Пользователь просматривает данные своего собственного профиля.
    
    Использование get_current_user напрямую гарантирует, что при истечении 
    срока действия токена возвращается чистый статус HTTP 401.
    """
    return current_user


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_my_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Новый пароль и подтверждение не совпадают",
        )

    if payload.old_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Новый пароль не должен совпадать с текущим",
        )

    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный текущий пароль",
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"status": "success", "message": "Ваш пароль успешно изменен"}


@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.ADMIN:
        another_admin_exists = db.query(models.User.id).filter(
            models.User.role == UserRole.ADMIN,
            models.User.id != current_user.id
        ).first()

        if not another_admin_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя удалить аккаунт: вы являетесь единственным администратором в системе"
            )

    db.delete(current_user)
    db.commit()
    return {"status": "success", "message": "Ваш аккаунт был успешно удален"}