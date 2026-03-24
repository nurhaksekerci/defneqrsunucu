"""filter_events_for_list ve coordination filtreleri."""

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.models import UserProfile
from events.models import Event
from events.scope import filter_events_for_list
from org.models import District, Hat

User = get_user_model()


@pytest.mark.django_db
class TestFilterEventsForList:
    def test_no_hat_on_profile_returns_empty(self, district_a, hat_line):
        u = User.objects.create_user(username="nohat", password="x")
        p, _ = UserProfile.objects.get_or_create(user=u)
        p.hat = None
        p.district = None
        p.save()
        u = User.objects.select_related("profile", "profile__hat").get(pk=u.pk)
        e = Event.objects.create(
            title="E1",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="addr",
            hat=hat_line,
            district=district_a,
        )
        qs = Event.objects.all()
        out = filter_events_for_list(qs, u, {})
        assert not out.filter(pk=e.pk).exists()

    def test_line_user_only_own_district_and_hat(
        self, user_line, hat_line, district_a, district_b
    ):
        other_hat = Hat.objects.create(
            name="other-h",
            code="pytest-other-hat",
            is_coordination_hat=False,
        )
        e_ok = Event.objects.create(
            title="in-scope",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_a,
        )
        e_wrong_district = Event.objects.create(
            title="wrong-d",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_b,
        )
        e_wrong_hat = Event.objects.create(
            title="wrong-h",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=other_hat,
            district=district_a,
        )
        qs = Event.objects.all()
        out = filter_events_for_list(qs, user_line, {})
        ids = set(out.values_list("pk", flat=True))
        assert e_ok.pk in ids
        assert e_wrong_district.pk not in ids
        assert e_wrong_hat.pk not in ids

    def test_provincial_non_coord_only_own_hat(
        self, user_provincial_line, hat_line, district_a, hat_coord
    ):
        e_ok = Event.objects.create(
            title="p-ok",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_a,
        )
        e_other = Event.objects.create(
            title="p-bad",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_coord,
            district=district_a,
        )
        out = filter_events_for_list(Event.objects.all(), user_provincial_line, {})
        ids = set(out.values_list("pk", flat=True))
        assert e_ok.pk in ids
        assert e_other.pk not in ids

    def test_provincial_coord_all_hats_district_param(
        self, user_provincial_coord, hat_line, hat_coord, district_a, district_b
    ):
        e_a = Event.objects.create(
            title="c-a",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_a,
        )
        e_b = Event.objects.create(
            title="c-b",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_coord,
            district=district_b,
        )
        out_all = filter_events_for_list(Event.objects.all(), user_provincial_coord, {})
        assert set(out_all.values_list("pk", flat=True)) == {e_a.pk, e_b.pk}

        out_a = filter_events_for_list(
            Event.objects.all(),
            user_provincial_coord,
            {"district": str(district_a.pk)},
        )
        assert set(out_a.values_list("pk", flat=True)) == {e_a.pk}

    def test_coordination_bucket_filter_only_for_coord_hat(
        self,
        user_provincial_coord,
        user_line,
        hat_line,
        hat_coord,
        district_a,
    ):
        Hat.objects.filter(pk=hat_line.pk).update(
            coordination_bucket=Hat.CoordinationBucket.GENCLIK,
        )
        Hat.objects.filter(pk=hat_coord.pk).update(
            coordination_bucket=Hat.CoordinationBucket.ANA_KADEME,
        )
        hat_line.refresh_from_db()
        hat_coord.refresh_from_db()

        e_g = Event.objects.create(
            title="bucket-g",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_a,
        )
        e_ak = Event.objects.create(
            title="bucket-ak",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_coord,
            district=district_a,
        )

        out = filter_events_for_list(
            Event.objects.all(),
            user_provincial_coord,
            {"coordination_bucket": Hat.CoordinationBucket.GENCLIK},
        )
        assert set(out.values_list("pk", flat=True)) == {e_g.pk}

        # İlçe kullanıcısı: bucket parametresi yok sayılır (koordinasyon hattı değil)
        out_line = filter_events_for_list(
            Event.objects.all(),
            user_line,
            {"coordination_bucket": Hat.CoordinationBucket.ANA_KADEME},
        )
        assert e_g.pk in set(out_line.values_list("pk", flat=True))
        assert e_ak.pk not in set(out_line.values_list("pk", flat=True))

    def test_district_user_coord_sees_all_hats_in_district(
        self, db, password, hat_line, hat_coord, district_a, district_b
    ):
        u = User.objects.create_user(username="pytest-district-coord", password=password)
        hc = Hat.objects.create(
            name="pytest-district-coord-hat",
            code="pytest-district-coord-hat",
            is_coordination_hat=True,
        )
        p, _ = UserProfile.objects.get_or_create(user=u)
        p.hat = hc
        p.district = district_a
        p.is_provincial_official = False
        p.save()
        u = User.objects.select_related("profile", "profile__hat").get(pk=u.pk)
        e1 = Event.objects.create(
            title="dc-1",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_a,
        )
        e2 = Event.objects.create(
            title="dc-2",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_coord,
            district=district_a,
        )
        e_other = Event.objects.create(
            title="dc-other",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_b,
        )
        out = filter_events_for_list(Event.objects.all(), u, {})
        ids = set(out.values_list("pk", flat=True))
        assert e1.pk in ids and e2.pk in ids
        assert e_other.pk not in ids

    def test_district_missing_returns_empty(self, db, password, hat_line):
        u = User.objects.create_user(username="pytest-no-dist", password=password)
        p, _ = UserProfile.objects.get_or_create(user=u)
        p.hat = hat_line
        p.district = None
        p.is_provincial_official = False
        p.save()
        u = User.objects.select_related("profile", "profile__hat").get(pk=u.pk)
        d = District.objects.create(name="pytest-nd")
        e = Event.objects.create(
            title="nd",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=d,
        )
        out = filter_events_for_list(Event.objects.all(), u, {})
        assert not out.filter(pk=e.pk).exists()
