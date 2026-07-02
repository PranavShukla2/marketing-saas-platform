def test_root(client):
    assert client.get("/").status_code == 200


def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["database"] == "ok"
