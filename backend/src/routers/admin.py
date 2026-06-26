from uuid import UUID
from typing import List
from sqlalchemy.orm import Session

from backend.src import models, schemas
from backend.src.database import get_db

from backend.src.models import User, UserRole
from backend.src.dependencies import get_current_user, RoleChecker
from backend.src.services.auth import hash_password
from fastapi import APIRouter, Depends, HTTPException, status, Response
from backend.src.schemas import ChangePasswordRequest

router = APIRouter(prefix="/users", tags=["Admin: User Management"])


@router.patch("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
async def admin_reset_user_password(
        user_id: UUID,
        payload: ChangePasswordRequest,
        db: Session = Depends(get_db),
        current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    """Администратор принудительно меняет пароль любому пользователю по его ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user.hashed_password = hash_password(payload.new_password)

    db.commit()
    return {"status": "success", "message": f"Пароль пользователя {user.username} успешно изменен"}


@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_user(
        user_in: schemas.UserCreate,
        db: Session = Depends(get_db),
        current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    """Администратор создает нового пользователя с любым уровнем доступа."""
    db_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")

    new_user = models.User(
        username=user_in.username,
        hashed_password=hash_password(user_in.password),  # Хэшируем пароль перед сохранением
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/{user_id}/role", response_model=schemas.UserResponse)
async def admin_change_user_role(
        user_id: UUID,
        new_role: models.UserRole,
        db: Session = Depends(get_db),
        current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    """Администратор меняет уровень доступа (роль) любому пользователю."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.id == current_admin.id and new_role != UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Вы не можете понизить роль самому себе")

    user.role = new_role
    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=List[schemas.UserResponse])
async def admin_get_all_users(
        db: Session = Depends(get_db),
        current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    """Администратор просматривает список всех зарегистрированных пользователей системы."""
    return db.query(models.User).all()


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_user(
        user_id: UUID,
        db: Session = Depends(get_db),
        current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    """Администратор полностью удаляет пользователя из системы."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Вы не можете удалить свой собственный аккаунт")

    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
