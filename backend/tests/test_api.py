"""Basic API tests."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"

def test_register_and_login():
    # Register
    r = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User",
        "target_role": "Backend Engineer"
    })
    assert r.status_code == 201
    assert r.json()["email"] == "test@example.com"

    # Login
    r = client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "password123"
    })
    assert r.status_code == 200
    assert "access_token" in r.json()
    return r.json()["access_token"]

def test_get_me():
    token = test_register_and_login()
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "test@example.com"

def test_start_interview():
    token = test_register_and_login()
    r = client.post("/interview/start",
        json={"target_role": "Backend Engineer", "session_type": "mixed", "num_questions": 3},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 201
    data = r.json()
    assert "session_id" in data
    assert len(data["questions"]) == 3
