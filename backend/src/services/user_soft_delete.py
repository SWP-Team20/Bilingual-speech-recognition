# -*- coding: utf-8 -*-
"""Мягкое удаление пользователей с окном отмены."""
from datetime import datetime, timedelta

from backend.src import models

USER_UNDO_SECONDS = 30


def purge_expired_soft_deletes(db) -> int:
    """Окончательно удаляет пользователей, у которых истёк срок отмены."""
    cutoff = datetime.now() - timedelta(seconds=USER_UNDO_SECONDS)
    expired = (
        db.query(models.User)
        .filter(
            models.User.deleted_at.isnot(None),
            models.User.deleted_at < cutoff,
        )
        .all()
    )
    for user in expired:
        db.delete(user)
    if expired:
        db.commit()
    return len(expired)


def soft_delete_user(db, user: models.User) -> datetime:
    """Помечает пользователя удалённым; возвращает момент, до которого можно отменить."""
    user.deleted_at = datetime.now()
    db.commit()
    return user.deleted_at + timedelta(seconds=USER_UNDO_SECONDS)


def restore_user(db, user_id) -> models.User:
    """Восстанавливает пользователя в пределах окна отмены."""
    purge_expired_soft_deletes(db)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or user.deleted_at is None:
        raise LookupError("Пользователь не найден или не удалён")
    if datetime.now() - user.deleted_at > timedelta(seconds=USER_UNDO_SECONDS):
        raise TimeoutError("Время для отмены удаления истекло")
    user.deleted_at = None
    db.commit()
    db.refresh(user)
    return user


def active_user_filter(query):
    """Исключает мягко удалённых пользователей из выборки."""
    return query.filter(models.User.deleted_at.is_(None))
