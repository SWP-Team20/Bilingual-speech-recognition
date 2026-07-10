# -*- coding: utf-8 -*-
"""Тесты мягкого удаления аудиозаписей."""
from datetime import datetime, timedelta
import pytest

from backend.src.services import audio_soft_delete

pytestmark = pytest.mark.unit


class _FakeAudio:
    def __init__(self, folder="/tmp/fake"):
        self.id = "00000000-0000-0000-0000-000000000099"
        self.folder_path = folder
        self.filename = "demo.wav"
        self.deleted_at = None


class _FakeQuery:
    def __init__(self, items):
        self._items = list(items)

    def filter(self, *args, **kwargs):
        return self

    def all(self):
        return list(self._items)

    def first(self):
        return self._items[0] if self._items else None


class _FakeDb:
    def __init__(self, items=None):
        self.items = items or []
        self.deleted = []
        self.committed = False

    def query(self, model):
        return _FakeQuery(self.items)

    def delete(self, obj):
        self.deleted.append(obj)

    def commit(self):
        self.committed = True

    def refresh(self, obj):
        pass


def test_soft_delete_sets_timestamp():
    audio = _FakeAudio()
    db = _FakeDb()

    undo_until = audio_soft_delete.soft_delete_audio(db, audio)

    assert audio.deleted_at is not None
    assert undo_until > audio.deleted_at
    assert db.committed


def test_restore_within_window():
    audio = _FakeAudio()
    audio.deleted_at = datetime.now()
    db = _FakeDb([audio])

    restored = audio_soft_delete.restore_audio(db, audio.id)

    assert restored.deleted_at is None
    assert db.committed


def test_restore_expired_raises():
    audio = _FakeAudio()
    audio.deleted_at = datetime.now() - timedelta(seconds=audio_soft_delete.AUDIO_UNDO_SECONDS + 5)
    db = _FakeDb([audio])

    with pytest.raises(TimeoutError):
        audio_soft_delete.restore_audio(db, audio.id)
