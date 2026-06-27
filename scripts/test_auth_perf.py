import time
import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

from init_db import main as initialize_database

client = TestClient(app)

AUTH_SPEED_LIMIT_SEC = 1.0


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Фикстура для CI: автоматически готовит базу данных перед тестом."""
    initialize_database()

    yield

    # Сюда можно добавить код очистки базы после теста,
    # например: Base.metadata.drop_all(bind=engine)


def test_login_endpoint_performance():
    """Проверяет, что время обработки авторизации созданного админа не превышает лимит."""

    login_data = {
        "username": "admin",
        "password": "admin"
    }

    start_time = time.perf_counter()
    response = client.post("/api/v1/auth/token", data=login_data)
    execution_time = time.perf_counter() - start_time

    assert response.status_code == 200, f"Авторизация созданного админа провалилась: {response.text}"
    assert "access_token" in response.json(), "Ответ не содержит access_token"

    assert execution_time < AUTH_SPEED_LIMIT_SEC, \
        f"Авторизация заняла {execution_time * 1000:.2f} мс (Лимит: {AUTH_SPEED_LIMIT_SEC * 1000} мс)"
