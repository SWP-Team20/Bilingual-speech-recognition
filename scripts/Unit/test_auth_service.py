# -*- coding: utf-8 -*-
"""Unit tests for backend.src.services.auth (password hashing and JWT)."""
import pytest
from jwt import decode

from backend.src.services.auth import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    hash_password,
    verify_password,
)

pytestmark = pytest.mark.unit


def test_hash_and_verify_password_roundtrip():
    hashed = hash_password("secret-pass")
    assert hashed != "secret-pass"
    assert verify_password("secret-pass", hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("correct")
    assert verify_password("wrong", hashed) is False


def test_create_access_token_is_decodable_jwt():
    token = create_access_token(data={"sub": "admin"})
    payload = decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "admin"
    assert "exp" in payload
