# -*- coding: utf-8 -*-
"""Мягкое удаление аудиозаписей с окном отмены."""
import os
import shutil
from datetime import datetime, timedelta

from backend.src import models

AUDIO_UNDO_SECONDS = 60


def purge_expired_soft_deletes(db) -> int:
    """Окончательно удаляет записи, у которых истёк срок отмены."""
    cutoff = datetime.now() - timedelta(seconds=AUDIO_UNDO_SECONDS)
    expired = (
        db.query(models.AudioFile)
        .filter(
            models.AudioFile.deleted_at.isnot(None),
            models.AudioFile.deleted_at < cutoff,
        )
        .all()
    )
    for audio in expired:
        _hard_delete_audio(db, audio)
    if expired:
        db.commit()
    return len(expired)


def _hard_delete_audio(db, audio: models.AudioFile) -> None:
    try:
        if audio.folder_path:
            shutil.rmtree(audio.folder_path, ignore_errors=True)
    except Exception:
        pass
    db.delete(audio)


def soft_delete_audio(db, audio: models.AudioFile) -> datetime:
    """Помечает запись удалённой; возвращает момент, до которого можно отменить."""
    audio.deleted_at = datetime.now()
    db.commit()
    return audio.deleted_at + timedelta(seconds=AUDIO_UNDO_SECONDS)


def restore_audio(db, audio_id) -> models.AudioFile:
    """Восстанавливает запись в пределах окна отмены."""
    purge_expired_soft_deletes(db)
    audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if audio is None or audio.deleted_at is None:
        raise LookupError("Запись не найдена или не удалена")
    if datetime.now() - audio.deleted_at > timedelta(seconds=AUDIO_UNDO_SECONDS):
        raise TimeoutError("Время для отмены удаления истекло")
    audio.deleted_at = None
    db.commit()
    db.refresh(audio)
    return audio


def active_audio_filter(query):
    """Исключает мягко удалённые записи из выборки."""
    return query.filter(models.AudioFile.deleted_at.is_(None))
