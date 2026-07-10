# -*- coding: utf-8 -*-
"""Unit tests for backend.src.dependencies (JWT user resolution and RoleChecker)."""
import asyncio
from datetime import datetime

import pytest
from fastapi import HTTPException
from jwt import encode

from backend.src.dependencies import RoleChecker, get_current_user
from backend.src.models import UserRole
from backend.src.services.auth import ALGORITHM, SECRET_KEY, create_access_token

pytestmark = pytest.mark.unit


class _FakeUser:
    def __init__(self, username="pytest_viewer", role=UserRole.USER, deleted_at=None):
        self.username = username
        self.role = role
        self.deleted_at = deleted_at


class _FakeQuery:
    def __init__(self, user):
        self._user = user

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self._user


class _FakeDb:
    def __init__(self, user):
        self._user = user

    def query(self, model):
        return _FakeQuery(self._user)


def _run(coro):
    return asyncio.run(coro)


def test_get_current_user_returns_active_user():
    user = _FakeUser(username="admin", role=UserRole.ADMIN)
    token = create_access_token(data={"sub": "admin"})

    result = _run(get_current_user(token=token, db=_FakeDb(user)))

    assert result is user


def test_get_current_user_rejects_invalid_token():
    with pytest.raises(HTTPException) as exc:
        _run(get_current_user(token="not-a-valid-jwt", db=_FakeDb(_FakeUser())))

    assert exc.value.status_code == 401
    assert "Bearer" in exc.value.headers.get("WWW-Authenticate", "")


def test_get_current_user_rejects_token_without_subject():
    token = encode({"role": "admin"}, SECRET_KEY, algorithm=ALGORITHM)

    with pytest.raises(HTTPException) as exc:
        _run(get_current_user(token=token, db=_FakeDb(_FakeUser())))

    assert exc.value.status_code == 401


def test_get_current_user_rejects_missing_user():
    token = create_access_token(data={"sub": "ghost"})

    with pytest.raises(HTTPException) as exc:
        _run(get_current_user(token=token, db=_FakeDb(None)))

    assert exc.value.status_code == 401


def test_get_current_user_rejects_soft_deleted_user():
    user = _FakeUser(deleted_at=datetime.now())
    token = create_access_token(data={"sub": user.username})

    with pytest.raises(HTTPException) as exc:
        _run(get_current_user(token=token, db=_FakeDb(user)))

    assert exc.value.status_code == 401


def test_role_checker_allows_matching_role():
    user = _FakeUser(role=UserRole.ADMIN)
    checker = RoleChecker([UserRole.ADMIN])

    assert checker(user) is user


def test_role_checker_rejects_insufficient_role():
    user = _FakeUser(role=UserRole.USER)
    checker = RoleChecker([UserRole.ADMIN])

    with pytest.raises(HTTPException) as exc:
        checker(user)

    assert exc.value.status_code == 403
    assert "недостаточно прав" in exc.value.detail.lower()
