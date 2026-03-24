"""Rapor düzenleme izni ve görsel kaldırma."""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status

from events.models import Event, EventReport, ReportImage


@pytest.mark.django_db
def test_report_owner_can_update_body(
    api_client, user_line, hat_line, district_a, starts_at
):
    e = Event.objects.create(
        title="editle",
        description="d",
        starts_at=starts_at,
        status=Event.Status.COMPLETED,
        location_kind=Event.LocationKind.ADDRESS,
        address_text="a",
        hat=hat_line,
        district=district_a,
        created_by=user_line,
        completed_at=timezone.now(),
    )
    EventReport.objects.create(event=e, body="v1", status=EventReport.Status.DRAFT)
    api_client.force_authenticate(user=user_line)
    r = api_client.post(
        f"/api/events/{e.pk}/report/",
        {"body": "v2 güncel", "status": EventReport.Status.REVIEW},
        format="json",
    )
    assert r.status_code == status.HTTP_200_OK
    e.report.refresh_from_db()
    assert "v2" in e.report.body
    assert e.report.status == EventReport.Status.REVIEW


@pytest.mark.django_db
def test_report_non_owner_cannot_update(
    api_client, user_line, user_provincial_line, hat_line, district_a, starts_at
):
    e = Event.objects.create(
        title="baskasinin",
        description="d",
        starts_at=starts_at,
        status=Event.Status.COMPLETED,
        location_kind=Event.LocationKind.ADDRESS,
        address_text="a",
        hat=hat_line,
        district=district_a,
        created_by=user_line,
        completed_at=timezone.now(),
    )
    EventReport.objects.create(event=e, body="ozet", status=EventReport.Status.DRAFT)
    api_client.force_authenticate(user=user_provincial_line)
    r = api_client.post(
        f"/api/events/{e.pk}/report/",
        {"body": "Yetkisiz"},
        format="json",
    )
    assert r.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_report_remove_image_ids(
    api_client, user_line, hat_line, district_a, starts_at
):
    e = Event.objects.create(
        title="img-del",
        description="d",
        starts_at=starts_at,
        status=Event.Status.COMPLETED,
        location_kind=Event.LocationKind.ADDRESS,
        address_text="a",
        hat=hat_line,
        district=district_a,
        created_by=user_line,
        completed_at=timezone.now(),
    )
    rep = EventReport.objects.create(
        event=e, body="x", status=EventReport.Status.DRAFT
    )
    f = SimpleUploadedFile(
        "a.jpg", b"\xff\xd8\xff\xe0\x00\x10JFIF", content_type="image/jpeg"
    )
    img = ReportImage.objects.create(report=rep, image=f, sort_order=0)
    api_client.force_authenticate(user=user_line)
    r = api_client.post(
        f"/api/events/{e.pk}/report/",
        {"body": "x", "remove_image_ids": [img.pk]},
        format="json",
    )
    assert r.status_code == status.HTTP_200_OK
    assert not ReportImage.objects.filter(pk=img.pk).exists()


@pytest.mark.django_db
def test_report_retrieve_includes_image_items(
    api_client, user_line, hat_line, district_a, starts_at
):
    e = Event.objects.create(
        title="det",
        description="d",
        starts_at=starts_at,
        status=Event.Status.COMPLETED,
        location_kind=Event.LocationKind.ADDRESS,
        address_text="a",
        hat=hat_line,
        district=district_a,
        created_by=user_line,
        completed_at=timezone.now(),
    )
    rep = EventReport.objects.create(
        event=e, body="b", status=EventReport.Status.PUBLISHED
    )
    f = SimpleUploadedFile(
        "b.jpg", b"\xff\xd8\xff\xe0\x00\x10JFIF", content_type="image/jpeg"
    )
    ReportImage.objects.create(report=rep, image=f, sort_order=0)
    api_client.force_authenticate(user=user_line)
    r = api_client.get(f"/api/reports/{rep.pk}/")
    assert r.status_code == status.HTTP_200_OK
    assert "image_items" in r.data
    assert len(r.data["image_items"]) == 1
    assert r.data["image_items"][0]["id"]
    assert r.data["can_edit"] is True
    assert r.data["event_id"] == e.pk
