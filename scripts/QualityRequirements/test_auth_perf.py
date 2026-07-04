import time

import pytest

pytestmark = [pytest.mark.integration]

AUTH_SPEED_LIMIT_SEC = 1.0


def test_login_endpoint_performance(api_client):
    """Admin login must succeed and complete within the performance budget."""
    login_data = {"username": "admin", "password": "admin"}

    start_time = time.perf_counter()
    response = api_client.post("/api/v1/auth/login", data=login_data)
    execution_time = time.perf_counter() - start_time

    assert response.status_code == 200, f"Admin login failed: {response.text}"
    assert "access_token" in response.json(), "Response does not contain access_token"
    assert execution_time < AUTH_SPEED_LIMIT_SEC, (
        f"Login took {execution_time * 1000:.2f} ms "
        f"(limit: {AUTH_SPEED_LIMIT_SEC * 1000:.0f} ms)"
    )
