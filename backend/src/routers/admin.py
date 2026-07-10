from uuid import UUID
from typing import List
from sqlalchemy.orm import Session

from backend.src import models, schemas
from backend.src.database import get_db

from backend.src.models import User, UserRole
from backend.src.dependencies import get_current_user, RoleChecker
from backend.src.services.auth import hash_password
from backend.src.services import user_soft_delete
from fastapi import APIRouter, Depends, HTTPException, status
from backend.src.schemas import ChangePasswordRequest

router = APIRouter(prefix="/users", tags=["Admin: User Management"])


def _get_active_user(db: Session, user_id: UUID) -> User | None:
    user_soft_delete.purge_expired_soft_deletes(db)
    return (
        user_soft_delete.active_user_filter(db.query(models.User))
        .filter(models.User.id == user_id)
        .first()
    )


@router.patch("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
async def admin_reset_user_password(
        user_id: UUID,
        payload: ChangePasswordRequest,
        db: Session = Depends(get_db),
        current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    """Администратор принудительно меняет пароль любому пользователю по его ID."""
    user = _get_active_user(db, user_id)
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
    user_soft_delete.purge_expired_soft_deletes(db)
    db_user = (
        user_soft_delete.active_user_filter(db.query(models.User))
        .filter(models.User.username == user_in.username)
        .first()
    )
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")

    new_user = models.User(
        username=user_in.username,
        hashed_password=hash_password(user_in.password),
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
    user = _get_active_user(db, user_id)
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
    user_soft_delete.purge_expired_soft_deletes(db)
    return user_soft_delete.active_user_filter(db.query(models.User)).all()


@router.delete("/{user_id}", response_model=schemas.UserDeleteResponse)
async def admin_delete_user(
        user_id: UUID,
        db: Session = Depends(get_db),
        current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    """Администратор удаляет пользователя с возможностью отмены в течение 30 секунд."""
    user_soft_delete.purge_expired_soft_deletes(db)
    user = _get_active_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Вы не можете удалить свой собственный аккаунт")

    undo_until = user_soft_delete.soft_delete_user(db, user)
    return schemas.UserDeleteResponse(
        id=user_id,
        undo_seconds=user_soft_delete.USER_UNDO_SECONDS,
        undo_until=undo_until,
    )


@router.post("/{user_id}/restore", response_model=schemas.UserResponse)
async def admin_restore_user(
        user_id: UUID,
        db: Session = Depends(get_db),
        current_admin: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    """Восстановить пользователя в пределах окна отмены удаления."""
    try:
        user = user_soft_delete.restore_user(db, user_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except TimeoutError as exc:
        raise HTTPException(status_code=410, detail=str(exc))

    return user
