"""Org salt okunur API (hat / ilçe)."""

import pytest
from rest_framework import status

from org.models import Hat


@pytest.mark.django_db
class TestOrgApi:
    def test_hats_requires_auth(self, api_client):
        assert api_client.get("/api/org/hats/").status_code == status.HTTP_401_UNAUTHORIZED

    def test_hats_list(self, api_client, user_line, hat_line):
        api_client.force_authenticate(user=user_line)
        r = api_client.get("/api/org/hats/")
        assert r.status_code == status.HTTP_200_OK
        codes = {row["code"] for row in r.data}
        assert hat_line.code in codes

    def test_districts_list(self, api_client, user_line, district_a):
        api_client.force_authenticate(user=user_line)
        r = api_client.get("/api/org/districts/")
        assert r.status_code == status.HTTP_200_OK
        names = {row["name"] for row in r.data}
        assert district_a.name in names

    def test_hats_filter_ilce_ana_kademe_zone(
        self,
        api_client,
        user_line,
    ):
        h = Hat.objects.create(
            name="pytest örnek ilçe başkanlığı",
            code="pytest-ornek-ilce-bsk",
            coordination_line=Hat.CoordinationLine.ILCE_BASKANLIGI,
            coordination_bucket=Hat.CoordinationBucket.ANA_KADEME,
            election_zone=2,
        )
        api_client.force_authenticate(user=user_line)
        r = api_client.get(
            "/api/org/hats/",
            {
                "coordination_line": "ilce_baskanligi",
                "coordination_bucket": "ana_kademe",
                "election_zone": "2",
            },
        )
        assert r.status_code == status.HTTP_200_OK
        row = next((x for x in r.data if x["code"] == h.code), None)
        assert row is not None
        assert row["election_zone"] == 2
        assert "event_count" in row
        assert "profile_count" in row
