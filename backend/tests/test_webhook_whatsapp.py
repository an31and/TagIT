"""In-process tests for the WhatsApp Cloud API webhook.

Uses mongomock-motor so these run with zero external services — no real
MongoDB, no Meta credentials. Mirrors the project's established pattern
of validating notification-layer changes in-process before deployment.
"""
import hashlib
import hmac
import os
import uuid

os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "infotag_test")
os.environ.setdefault("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "test-verify-token")

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

import db as db_module
from routes.webhook_routes import router as webhook_router


@pytest.fixture()
def app_client(monkeypatch):
    mock_db = AsyncMongoMockClient()["infotag_test"]
    monkeypatch.setattr(db_module, "get_db", lambda: mock_db)
    # webhook_routes imported `get_db` directly, so patch its local reference too.
    import routes.webhook_routes as wh
    monkeypatch.setattr(wh, "get_db", lambda: mock_db)

    app = FastAPI()
    app.include_router(webhook_router)
    return TestClient(app), mock_db


class TestVerificationHandshake:
    def test_correct_token_echoes_challenge(self, app_client):
        client, _ = app_client
        r = client.get(
            "/api/webhooks/whatsapp",
            params={"hub.mode": "subscribe", "hub.verify_token": "test-verify-token", "hub.challenge": "12345"},
        )
        assert r.status_code == 200
        assert r.text == "12345"

    def test_wrong_token_rejected(self, app_client):
        client, _ = app_client
        r = client.get(
            "/api/webhooks/whatsapp",
            params={"hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "12345"},
        )
        assert r.status_code == 403

    def test_missing_params_rejected(self, app_client):
        client, _ = app_client
        r = client.get("/api/webhooks/whatsapp")
        assert r.status_code == 403


class TestInboundMessageOpensWindow:
    @pytest.mark.asyncio
    async def test_matching_owner_gets_window_stamped(self, app_client):
        client, mock_db = app_client
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await mock_db.users.insert_one({"id": user_id, "email": "a@b.com", "phone": "+91 98765 43210"})

        payload = {
            "entry": [{
                "changes": [{
                    "value": {
                        "messages": [{"from": "919876543210", "id": "wamid.1", "type": "text"}],
                    },
                }],
            }],
        }
        r = client.post("/api/webhooks/whatsapp", json=payload)
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

        updated = await mock_db.users.find_one({"id": user_id})
        assert updated.get("whatsapp_window_opens_at") is not None

    @pytest.mark.asyncio
    async def test_unknown_number_is_a_noop(self, app_client):
        client, mock_db = app_client
        payload = {
            "entry": [{
                "changes": [{
                    "value": {"messages": [{"from": "911111111111", "id": "wamid.2", "type": "text"}]},
                }],
            }],
        }
        r = client.post("/api/webhooks/whatsapp", json=payload)
        assert r.status_code == 200  # always 200s so Meta doesn't disable the subscription

    def test_malformed_json_body_does_not_500(self, app_client):
        client, _ = app_client
        r = client.post(
            "/api/webhooks/whatsapp",
            content=b"not json",
            headers={"content-type": "application/json"},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "ignored"


class TestSignatureVerification:
    def test_bad_signature_ignored_when_secret_set(self, app_client, monkeypatch):
        client, _ = app_client
        import routes.webhook_routes as wh

        monkeypatch.setattr(wh, "APP_SECRET", "shh")
        r = client.post(
            "/api/webhooks/whatsapp",
            json={"entry": []},
            headers={"x-hub-signature-256": "sha256=deadbeef"},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "ignored"

    def test_correct_signature_accepted(self, app_client, monkeypatch):
        client, _ = app_client
        import routes.webhook_routes as wh

        monkeypatch.setattr(wh, "APP_SECRET", "shh")
        body = b'{"entry": []}'
        sig = "sha256=" + hmac.new(b"shh", body, hashlib.sha256).hexdigest()
        r = client.post(
            "/api/webhooks/whatsapp",
            content=body,
            headers={"content-type": "application/json", "x-hub-signature-256": sig},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "ok"
