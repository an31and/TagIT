"""Bulk / event tags (organisation batches) — integration tests.

Exercises the full batch lifecycle against a running backend:
  - create a batch and its N tags in one call
  - list / read the batch with live scan + message counts
  - page through the batch's tags (owned by the org, stamped batch_id + seq)
  - CSV manifest export (the scale path for print vendors)
  - printable QR sticker-sheet PDF
  - batch tags stay OUT of the personal /tags dashboard
  - a finder scan on a batch tag routes to the org (owner) and is counted
  - delete cascades to the batch's tags
"""
import os
import uuid

import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://smart-tags-dev.preview.emergentagent.com"
).rstrip("/")


@pytest.fixture(scope="module")
def org_session():
    """A fresh org account — stands in for a temple / NGO / event body."""
    s = requests.Session()
    email = f"org_{uuid.uuid4().hex[:8]}@tagit.in"
    r = s.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": "OrgTester@2026", "display_name": "Temple Trust"},
    )
    assert r.status_code == 200, f"Register failed: {r.text}"
    return s


class TestBatchLifecycle:
    def test_create_batch_generates_tags(self, org_session):
        r = org_session.post(
            f"{BASE_URL}/api/batches",
            json={
                "name": "Function Days 2026",
                "org_name": "Shri Temple Trust",
                "kind": "family",
                "tag_type": "special",
                "count": 8,
                "message": "Lost? Scan to reach the control room.",
            },
        )
        assert r.status_code == 200, r.text
        batch = r.json()
        assert batch["count"] == 8
        assert batch["kind"] == "family"
        assert batch["status"] == "active"
        pytest.batch_id = batch["id"]

    def test_list_batches(self, org_session):
        r = org_session.get(f"{BASE_URL}/api/batches")
        assert r.status_code == 200
        ids = [b["id"] for b in r.json()]
        assert pytest.batch_id in ids

    def test_get_batch_and_tags(self, org_session):
        r = org_session.get(f"{BASE_URL}/api/batches/{pytest.batch_id}")
        assert r.status_code == 200
        assert r.json()["count"] == 8

        r = org_session.get(f"{BASE_URL}/api/batches/{pytest.batch_id}/tags")
        assert r.status_code == 200
        tags = r.json()
        assert len(tags) == 8
        seqs = sorted(t["seq"] for t in tags)
        assert seqs == list(range(1, 9))
        assert all(t["batch_id"] == pytest.batch_id for t in tags)
        assert all(t["owner_id"] for t in tags)  # owned by the org
        pytest.batch_slug = tags[0]["slug"]

    def test_batch_tags_excluded_from_personal_dashboard(self, org_session):
        r = org_session.get(f"{BASE_URL}/api/tags")
        assert r.status_code == 200
        assert all(t.get("batch_id") is None for t in r.json())

    def test_manifest_csv(self, org_session):
        r = org_session.get(f"{BASE_URL}/api/batches/{pytest.batch_id}/manifest.csv")
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        lines = [ln for ln in r.text.splitlines() if ln.strip()]
        assert lines[0].split(",")[:3] == ["seq", "slug", "finder_url"]
        assert len(lines) == 9  # header + 8 rows

    def test_qr_sticker_pdf(self, org_session):
        r = org_session.get(
            f"{BASE_URL}/api/batches/{pytest.batch_id}/qrs.pdf", params={"start": 1, "count": 8}
        )
        assert r.status_code == 200
        assert r.headers.get("content-type") == "application/pdf"
        assert r.content[:4] == b"%PDF"

    def test_finder_scan_routes_to_org(self, org_session):
        # A batch tag is claimed by the org, so the finder page resolves a
        # contact block and the scan is counted against the batch.
        r = requests.get(f"{BASE_URL}/api/public/tags/{pytest.batch_slug}")
        assert r.status_code == 200
        view = r.json()
        assert view["is_unclaimed"] is False
        assert view["contact"] is not None

        r = org_session.get(f"{BASE_URL}/api/batches/{pytest.batch_id}")
        assert r.json()["scanned_count"] >= 1

    def test_count_validation_rejects_zero_and_over_cap(self, org_session):
        for bad in (0, 5001):
            r = org_session.post(
                f"{BASE_URL}/api/batches",
                json={"name": "bad", "count": bad, "tag_type": "general"},
            )
            assert r.status_code == 422, f"count={bad} should be rejected"

    def test_delete_cascades(self, org_session):
        r = org_session.delete(f"{BASE_URL}/api/batches/{pytest.batch_id}")
        assert r.status_code == 200
        assert r.json()["deleted_tags"] == 8
        # Tags are gone — the finder slug now 404s.
        r = requests.get(f"{BASE_URL}/api/public/tags/{pytest.batch_slug}")
        assert r.status_code == 404
