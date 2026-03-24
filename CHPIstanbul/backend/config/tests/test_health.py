from django.urls import reverse


def test_health_ok(api_client):
    url = reverse("health")
    r = api_client.get(url)
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
