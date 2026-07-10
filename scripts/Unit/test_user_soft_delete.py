# -*- coding: utf-8 -*-
"""Тесты мягкого удаления пользователей."""
from datetime import datetime, timedelta
import pytest

from backend.src.services import user_soft_delete

pytestmark = pytest.mark.unit


class _FakeUser:
    def __init__(self, username="demo"):
        self.id = "00000000-0000-0000-0000-000000000099"
        self.username = username
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
    user = _FakeUser()
    db = _FakeDb()

    undo_until = user_soft_delete.soft_delete_user(db, user)

    assert user.deleted_at is not None
    assert undo_until > user.deleted_at
    assert db.committed


def test_restore_within_window():
    user = _FakeUser()
    user.deleted_at = datetime.now()
    db = _FakeDb([user])

    restored = user_soft_delete.restore_user(db, user.id)

    assert restored.deleted_at is None
    assert db.committed


def test_restore_expired_raises():
    user = _FakeUser()
    user.deleted_at = datetime.now() - timedelta(seconds=user_soft_delete.USER_UNDO_SECONDS + 5)
    db = _FakeDb([user])

    with pytest.raises(TimeoutError):
        user_soft_delete.restore_user(db, user.id)
