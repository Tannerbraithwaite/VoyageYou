import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from main import app
from database import SessionLocal, create_tables, User, PasswordResetToken
from auth import AuthService

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # Ensure tables exist and create a test user
    create_tables()
    session = SessionLocal()
    # Clean any existing test user
    session.query(User).filter(User.email == "reset_test@example.com").delete()
    session.commit()

    test_user = User(
        name="Reset Test",
        email="reset_test@example.com",
        password=AuthService.get_password_hash("InitialPass123"),
        is_verified=True,
    )
    session.add(test_user)
    session.commit()
    session.refresh(test_user)
    yield
    # Cleanup after tests
    session.query(PasswordResetToken).filter(PasswordResetToken.user_id == test_user.id).delete()
    session.delete(test_user)
    session.commit()
    session.close()


def test_forgot_password_existing_user(monkeypatch):
    # Mock email sending to avoid external call
    monkeypatch.setattr(
        "email_service.email_service.send_password_reset_email", lambda *args, **kwargs: True
    )

    response = client.post(
        "/auth/forgot-password",
        json={"email": "reset_test@example.com"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "reset link" in data["message"]

    # Ensure token created in DB
    session = SessionLocal()
    user = session.query(User).filter(User.email == "reset_test@example.com").first()
    token_obj = (
        session.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user.id, PasswordResetToken.used.is_(False))
        .first()
    )
    assert token_obj is not None
    session.close()


def test_forgot_password_nonexistent_user(monkeypatch):
    monkeypatch.setattr(
        "email_service.email_service.send_password_reset_email", lambda *args, **kwargs: True
    )

    response = client.post(
        "/auth/forgot-password",
        json={"email": "doesnotexist@example.com"},
    )
    assert response.status_code == 200
    # Message should be generic
    assert "reset link" in response.json()["message"]


def test_reset_password_success(monkeypatch):
    monkeypatch.setattr(
        "email_service.email_service.send_password_reset_email", lambda *args, **kwargs: True
    )

    session = SessionLocal()
    user = session.query(User).filter(User.email == "reset_test@example.com").first()

    # Ensure we have a fresh token
    token_obj = (
        session.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user.id, PasswordResetToken.used.is_(False))
        .first()
    )
    if not token_obj:
        # create token manually
        token_obj = PasswordResetToken(
            user_id=user.id,
            token="manualtoken123",
            expires_at=datetime.utcnow() + timedelta(hours=1),
            used=False,
        )
        session.add(token_obj)
        session.commit()
        session.refresh(token_obj)
    session.close()

    new_pass = "NewSecurePass123"

    response = client.post(
        "/auth/reset-password",
        json={"token": token_obj.token, "new_password": new_pass},
    )
    assert response.status_code == 200
    assert "reset successfully" in response.json()["message"]

    # Verify password updated and token used
    session = SessionLocal()
    user = session.query(User).filter(User.email == "reset_test@example.com").first()
    assert AuthService.verify_password(new_pass, user.password)
    used_token = session.query(PasswordResetToken).filter(PasswordResetToken.id == token_obj.id).first()
    assert used_token.used is True
    session.close()


def test_reset_password_invalid_or_expired():
    # Expired token
    session = SessionLocal()
    expired_token = PasswordResetToken(
        user_id=1,
        token="expiredtoken123",
        expires_at=datetime.utcnow() - timedelta(hours=2),
        used=False,
    )
    session.add(expired_token)
    session.commit()
    session.close()

    response = client.post(
        "/auth/reset-password",
        json={"token": "expiredtoken123", "new_password": "Something123"},
    )
    assert response.status_code == 400
    assert "Invalid or expired token" in response.json()["detail"]
