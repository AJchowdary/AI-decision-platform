# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Fake Bearer token for overriding auth (valid format, not verified in unit tests)."""
    return {"Authorization": "Bearer fake-jwt-for-testing"}


def test_health_returns_200_and_status_ok(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data == {"status": "ok"}


def test_health_returns_json(client: TestClient):
    response = client.get("/health")
    assert response.headers["content-type"].startswith("application/json")


def test_ingestion_status_requires_auth(client: TestClient):
    response = client.get("/ingestion/status")
    assert response.status_code == 401


def test_ingestion_schema_requires_auth(client: TestClient):
    response = client.get("/ingestion/schema")
    assert response.status_code == 401


def test_decision_cards_list_requires_auth(client: TestClient):
    response = client.get("/decision_cards/list")
    assert response.status_code == 401


def test_reports_weekly_requires_auth(client: TestClient):
    response = client.get("/reports/weekly")
    assert response.status_code == 401


def test_decision_cards_generate_requires_auth(client: TestClient):
    response = client.post("/decision_cards/generate")
    assert response.status_code == 401


def test_insights_generate_requires_auth(client: TestClient):
    response = client.post("/insights/generate")
    assert response.status_code == 401


def test_ingestion_upload_requires_auth(client: TestClient):
    response = client.post("/ingestion/upload", files={"file": ("test.json", b"[]", "application/json")})
    assert response.status_code == 401


def test_ingestion_schema_shape_with_mock_auth(client: TestClient):
    """With auth override, schema endpoint returns required structure (no real Supabase call in main)."""
    from app.main import app
    from app import auth

    async def mock_verify():
        return {"sub": "test-user-id", "email": "test@test.com"}

    app.dependency_overrides[auth.verify_supabase_jwt] = mock_verify
    try:
        response = client.get("/ingestion/schema", headers={"Authorization": "Bearer fake"})
        assert response.status_code == 200
        data = response.json()
        assert "required" in data
        assert "optional" in data
        assert "sample_row" in data
        assert data["required"] == [
            "session_id", "timestamp", "input", "output", "feedback_type", "feedback_value"
        ]
        assert "user_id" in data["optional"]
        assert "session_id" in data["sample_row"]
    finally:
        app.dependency_overrides.clear()


def test_decision_cards_get_requires_auth(client: TestClient):
    response = client.get("/decision_cards/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401


def test_insights_list_requires_auth(client: TestClient):
    response = client.get("/insights/list")
    assert response.status_code == 401


def test_health_sustained_requests(client: TestClient):
    """Light pressure test: many sequential requests to /health all succeed."""
    for _ in range(100):
        response = client.get("/health")
        assert response.status_code == 200, "health should always return 200"
    response = client.get("/health")
    data = response.json()
    assert data["status"] == "ok"
