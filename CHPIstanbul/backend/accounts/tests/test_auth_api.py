"""JWT ve /api/auth/me/."""

import pytest
from rest_framework import status


@pytest.mark.django_db
class TestAuth:
    def test_me_requires_auth(self, api_client):
        r = api_client.get("/api/auth/me/")
        assert r.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_authenticated(self, api_client, user_line, hat_line, district_a):
        api_client.force_authenticate(user=user_line)
        r = api_client.get("/api/auth/me/")
        assert r.status_code == status.HTTP_200_OK
        assert r.data["username"] == "pytest-line"
        assert r.data["hat_name"] == hat_line.name
        assert r.data["district_name"] == district_a.name
        assert r.data["is_provincial_official"] is False
        assert r.data["hat_is_coordination"] is False

    def test_token_obtain(self, api_client, user_line, password):
        r = api_client.post(
            "/api/auth/token/",
            {"username": "pytest-line", "password": password},
            format="json",
        )
        assert r.status_code == status.HTTP_200_OK
        assert "access" in r.data
        assert "refresh" in r.data

    def test_bearer_access(self, api_client, user_line, password):
        t = api_client.post(
            "/api/auth/token/",
            {"username": "pytest-line", "password": password},
            format="json",
        )
        assert t.status_code == status.HTTP_200_OK
        access = t.data["access"]
        r = api_client.get(
            "/api/auth/me/",
            HTTP_AUTHORIZATION=f"Bearer {access}",
        )
        assert r.status_code == status.HTTP_200_OK
        assert r.data["username"] == "pytest-line"
