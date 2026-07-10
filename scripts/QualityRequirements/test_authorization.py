# -*- coding: utf-8 -*-
"""QRT-004: role-based authorization for MVP v2 admin and editor endpoints."""
from uuid import uuid4

import pytest

pytestmark = [pytest.mark.qrt, pytest.mark.integration]


def test_admin_can_list_users(api_client, admin_headers):
    response = api_client.get("/api/v1/users/", headers=admin_headers)
    assert response.status_code == 200
    assert any(u["username"] == "admin" for u in response.json())


def test_regular_user_cannot_access_admin_user_list(api_client, user_headers):
    response = api_client.get("/api/v1/users/", headers=user_headers)
    assert response.status_code == 403
    assert "недостаточно прав" in response.json()["detail"].lower()


def test_regular_user_cannot_edit_transcription(api_client, user_headers):
    response = api_client.patch(
        f"/api/v1/transcriptions/{uuid4()}/words/0",
        headers=user_headers,
        json={"raw": "тест", "language": "ru"},
    )
    assert response.status_code == 403


def test_authenticated_user_can_read_own_profile(api_client, user_headers):
    response = api_client.get("/api/v1/auth/me", headers=user_headers)
    assert response.status_code == 200
    assert response.json()["username"] == "pytest_viewer"
    assert response.json()["role"] == "user"


def test_regular_user_can_access_transcription_download(api_client, user_headers):
    response = api_client.get(
        f"/api/v1/transcriptions/{uuid4()}/download",
        headers=user_headers,
        params={"format": "txt"},
    )
    assert response.status_code == 404


def test_regular_user_cannot_download_transcription_json(api_client, user_headers):
    response = api_client.get(
        f"/api/v1/transcriptions/{uuid4()}/download",
        headers=user_headers,
        params={"format": "json"},
    )
    assert response.status_code == 403
    assert "недостаточно прав" in response.json()["detail"].lower()


def test_admin_can_access_transcription_json_download(api_client, admin_headers):
    response = api_client.get(
        f"/api/v1/transcriptions/{uuid4()}/download",
        headers=admin_headers,
        params={"format": "json"},
    )
    assert response.status_code == 404


def test_unauthenticated_cannot_download_transcription(api_client):
    response = api_client.get(
        f"/api/v1/transcriptions/{uuid4()}/download",
        params={"format": "json"},
    )
    assert response.status_code == 401
