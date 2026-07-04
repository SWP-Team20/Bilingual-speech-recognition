# -*- coding: utf-8 -*-
"""QRT-001: unauthorized access to protected API routes must return HTTP 401."""
import pytest

pytestmark = [pytest.mark.qrt, pytest.mark.integration]


def test_unauthorized_get_audio_list_is_blocked(api_client):
    response = api_client.get("/api/v1/audio")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_unauthorized_post_audio_upload_is_blocked(api_client):
    response = api_client.post(
        "/api/v1/upload-audio/",
        files={"file": ("sample.wav", b"dummy", "audio/wav")},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_unauthorized_get_profile_is_blocked(api_client):
    response = api_client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_unauthorized_get_speakers_is_blocked(api_client):
    response = api_client.get("/api/v1/speakers")
    assert response.status_code == 401


def test_unauthorized_get_admin_users_is_blocked(api_client):
    response = api_client.get("/api/v1/users/")
    assert response.status_code == 401
