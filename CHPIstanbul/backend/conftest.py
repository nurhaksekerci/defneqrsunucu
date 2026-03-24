"""Paylaşılan pytest fixture'ları (backend kökü)."""

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.models import UserProfile
from org.models import District, Hat

User = get_user_model()


@pytest.fixture
def password():
    return "test-Secret-9"


@pytest.fixture
def district_a(db):
    return District.objects.create(name="pytest-ilce-a")


@pytest.fixture
def district_b(db):
    return District.objects.create(name="pytest-ilce-b")


@pytest.fixture
def hat_line(db):
    return Hat.objects.create(
        name="pytest-hat-line",
        code="pytest-hat-line",
        is_coordination_hat=False,
    )


@pytest.fixture
def hat_coord(db):
    return Hat.objects.create(
        name="pytest-hat-coord",
        code="pytest-hat-coord",
        is_coordination_hat=True,
    )


def _profile(user, *, hat, district, is_provincial: bool):
    """post_save zaten UserProfile satırı açar; güncelle."""
    p = UserProfile.objects.get(user=user)
    p.hat = hat
    p.district = district
    p.is_provincial_official = is_provincial
    p.save(update_fields=["hat", "district", "is_provincial_official"])
    # User üzerindeki ters ilişki önbelleği güncellenmez; taze nesne dön.
    return User.objects.select_related("profile", "profile__hat").get(pk=user.pk)


@pytest.fixture
def user_line(db, password, hat_line, district_a):
    u = User.objects.create_user(username="pytest-line", password=password)
    return _profile(u, hat=hat_line, district=district_a, is_provincial=False)


@pytest.fixture
def user_provincial_coord(db, password, hat_coord):
    u = User.objects.create_user(username="pytest-il-coord", password=password)
    return _profile(u, hat=hat_coord, district=None, is_provincial=True)


@pytest.fixture
def user_provincial_line(db, password, hat_line):
    u = User.objects.create_user(username="pytest-il-line", password=password)
    return _profile(u, hat=hat_line, district=None, is_provincial=True)


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def starts_at():
    return timezone.now() + timedelta(days=7)
