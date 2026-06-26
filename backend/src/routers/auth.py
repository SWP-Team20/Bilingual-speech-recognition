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


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_my_password(
        payload: ChangePasswordRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Пользователь меняет свой собственный пароль."""
    # 1. Проверяем, правильный ли старый пароль
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный старый пароль"
        )

    # 2. Хешируем и сохраняем новый пароль
    current_user.hashed_password = hash_password(payload.new_password)

    db.commit()
    return {"status": "success", "message": "Ваш пароль успешно изменен"}

# @router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
# def register(user_in: UserCreate, db: Session = Depends(get_db)):
#     db_user = db.query(User).filter(User.username == user_in.username).first()
#     if db_user:
#         raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
#
#     new_user = User(
#         username=user_in.username,
#         hashed_password=hash_password(user_in.password),
#         role=user_in.role
#     )
#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)
#     return new_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль"
        )

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_profile(
        current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]))  # или используйте вашу обычную функцию get_current_user
):
    """Пользователь просматривает данные своего собственного профиля."""
    return current_user


@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_my_account(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Пользователь полностью удаляет свой собственный аккаунт."""
    db.delete(current_user)

    db.commit()

    return {"status": "success", "message": "Ваш аккаунт был успешно удален"}
