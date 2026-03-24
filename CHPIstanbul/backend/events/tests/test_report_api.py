"""Rapor listesi API kapsamı."""

import pytest
from django.utils import timezone
from rest_framework import status

from events.models import Event, EventReport


@pytest.mark.django_db
class TestReportList:
    def test_requires_auth(self, api_client):
        r = api_client.get("/api/reports/")
        assert r.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_respects_event_scope(
        self, api_client, user_line, hat_line, district_a, district_b
    ):
        e_vis = Event.objects.create(
            title="rep-vis",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.COMPLETED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_a,
        )
        e_vis.completed_at = timezone.now()
        e_vis.save(update_fields=["completed_at", "updated_at"])
        EventReport.objects.create(
            event=e_vis,
            body="ozet a",
            status=EventReport.Status.PUBLISHED,
        )

        e_hide = Event.objects.create(
            title="rep-hide",
            description="d",
            starts_at=timezone.now(),
            status=Event.Status.COMPLETED,
            location_kind=Event.LocationKind.ADDRESS,
            address_text="a",
            hat=hat_line,
            district=district_b,
        )
        e_hide.completed_at = timezone.now()
        e_hide.save(update_fields=["completed_at", "updated_at"])
        EventReport.objects.create(
            event=e_hide,
            body="ozet b",
            status=EventReport.Status.PUBLISHED,
        )

        api_client.force_authenticate(user=user_line)
        r = api_client.get("/api/reports/")
        assert r.status_code == status.HTTP_200_OK
        etkinlik = {row["etkinlik"] for row in r.data}
        assert "rep-vis" in etkinlik
        assert "rep-hide" not in etkinlik
