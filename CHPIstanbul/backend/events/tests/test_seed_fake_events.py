"""seed_fake_events yönetim komutu smoke."""

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from events.models import Event
from org.models import Hat

User = get_user_model()


@pytest.mark.django_db
class TestSeedFakeEvents:
    def test_force_per_hat_matches_hat_count(self, district_a):
        User.objects.create_superuser("seed_author", "seed@pytest.local", "pw")
        Hat.objects.all().delete()
        Hat.objects.create(
            name="seed-only-1",
            code="seed-only-1",
            is_coordination_hat=False,
        )
        Hat.objects.create(
            name="seed-only-2",
            code="seed-only-2",
            is_coordination_hat=False,
        )
        n_hats = Hat.objects.count()
        call_command("seed_fake_events", "--force", "--per-hat", "1")
        fake_events = Event.objects.filter(title__startswith="[FAKE]")
        assert fake_events.count() == n_hats

        call_command("seed_fake_events", "--per-hat", "1")
        assert Event.objects.filter(title__startswith="[FAKE]").count() == n_hats

        call_command("seed_fake_events", "--force", "--per-hat", "2")
        assert Event.objects.filter(title__startswith="[FAKE]").count() == n_hats * 2
