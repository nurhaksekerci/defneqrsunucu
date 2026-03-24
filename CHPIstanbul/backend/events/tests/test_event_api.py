"""Etkinlik API: liste, oluşturma, tamamlama, rapor."""

import pytest
from django.utils import timezone
from rest_framework import status

from events.models import Event, EventReport


@pytest.mark.django_db
class TestEventListCreate:
    def test_list_requires_auth(self, api_client):
        r = api_client.get("/api/events/")
        assert r.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_scoped_line_user(self, api_client, user_line, hat_line, district_a, district_b):
        Event.objects.create(
            title="api-vis",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_a,
        )
        Event.objects.create(
            title="api-hide",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_b,
        )
        api_client.force_authenticate(user=user_line)
        r = api_client.get("/api/events/")
        assert r.status_code == status.HTTP_200_OK
        titles = {x["title"] for x in r.data}
        assert "api-vis" in titles
        assert "api-hide" not in titles

    def test_create_provincial_requires_district(
        self, api_client, user_provincial_coord, district_a, starts_at
    ):
        api_client.force_authenticate(user=user_provincial_coord)
        r = api_client.post(
            "/api/events/",
            {
                "title": "Yeni",
                "description": "aciklama",
                "starts_at": starts_at.isoformat(),
                "location_kind": Event.LocationKind.ADDRESS,
                "address_text": "Adres satiri",
            },
            format="json",
        )
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_provincial_ok(
        self, api_client, user_provincial_coord, district_a, hat_coord, starts_at
    ):
        api_client.force_authenticate(user=user_provincial_coord)
        r = api_client.post(
            "/api/events/",
            {
                "title": "Yeni etkinlik",
                "description": "aciklama",
                "starts_at": starts_at.isoformat(),
                "location_kind": Event.LocationKind.ADDRESS,
                "address_text": "Adres satiri",
                "district": district_a.pk,
            },
            format="json",
        )
        assert r.status_code == status.HTTP_201_CREATED
        ev = Event.objects.get(title="Yeni etkinlik")
        assert ev.hat_id == hat_coord.pk
        assert ev.district_id == district_a.pk

    def test_create_line_user_cannot_pick_other_district(
        self, api_client, user_line, district_b, starts_at
    ):
        api_client.force_authenticate(user=user_line)
        r = api_client.post(
            "/api/events/",
            {
                "title": "X",
                "description": "d",
                "starts_at": starts_at.isoformat(),
                "location_kind": Event.LocationKind.ADDRESS,
                "address_text": "a",
                "district": district_b.pk,
            },
            format="json",
        )
        assert r.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestEventCompleteReport:
    def test_complete_then_report(
        self, api_client, user_line, hat_line, district_a, starts_at
    ):
        e = Event.objects.create(
            title="rapor-akisi",
            description="d",
            starts_at=starts_at,
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_a,
            created_by=user_line,
        )
        api_client.force_authenticate(user=user_line)

        r1 = api_client.post(f"/api/events/{e.pk}/complete/")
        assert r1.status_code == status.HTTP_200_OK
        assert r1.data["status"] == Event.Status.COMPLETED
        e.refresh_from_db()
        assert e.status == Event.Status.COMPLETED

        r2 = api_client.post(
            f"/api/events/{e.pk}/report/",
            {"body": "Rapor metni burada.", "status": EventReport.Status.REVIEW},
            format="json",
        )
        assert r2.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)
        assert EventReport.objects.filter(event=e).exists()
        rep = EventReport.objects.get(event=e)
        assert "Rapor metni" in rep.body
        assert rep.status == EventReport.Status.REVIEW

    def test_report_before_complete_fails(
        self, api_client, user_line, hat_line, district_a, starts_at
    ):
        e = Event.objects.create(
            title="planli",
            description="d",
            starts_at=starts_at,
            status=Event.Status.PLANNED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_a,
        )
        api_client.force_authenticate(user=user_line)
        r = api_client.post(
            f"/api/events/{e.pk}/report/",
            {"body": "Erken rapor"},
            format="json",
        )
        assert r.status_code == status.HTTP_400_BAD_REQUEST
