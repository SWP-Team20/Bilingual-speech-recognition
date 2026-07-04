# -*- coding: utf-8 -*-
"""Shared pytest fixtures for scripts/ test suites."""
import socket

import pytest


def _db_up() -> bool:
    """Return True when Postgres from backend.src.database is reachable."""
    try:
        from backend.src.database import engine

        host = engine.url.host or "127.0.0.1"
        port = engine.url.port or 5432
        sock = socket.socket()
        sock.settimeout(1.5)
        try:
            sock.connect((host, port))
            return True
        finally:
            sock.close()
    except Exception:
        return False


requires_db = pytest.mark.skipif(not _db_up(), reason="Postgres is not reachable on 127.0.0.1:15432")


@pytest.fixture(scope="session")
def db_available():
    if not _db_up():
        pytest.skip("Postgres is not reachable on 127.0.0.1:15432")
    return True


def _ensure_user(db, username, password, role):
    from backend.src.services.auth import hash_password
    from backend.src import models

    user = db.query(models.User).filter(models.User.username == username).first()
    if user:
        return user
    user = models.User(
        username=username,
        hashed_password=hash_password(password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="session")
def ensure_admin_user(db_available):
    from backend.src.database import SessionLocal, engine, Base
    from backend.src import models

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _ensure_user(db, "admin", "admin", models.UserRole.ADMIN)
        _ensure_user(db, "pytest_viewer", "viewer", models.UserRole.USER)
    finally:
        db.close()


@pytest.fixture(scope="session")
def api_client(db_available, ensure_admin_user):
    from fastapi.testclient import TestClient
    from backend.src.main import app

    return TestClient(app)


def _login_headers(client, username, password):
    response = client.post("/api/v1/auth/login", data={"username": username, "password": password})
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def admin_headers(api_client):
    return _login_headers(api_client, "admin", "admin")


@pytest.fixture(scope="session")
def user_headers(api_client):
    return _login_headers(api_client, "pytest_viewer", "viewer")
