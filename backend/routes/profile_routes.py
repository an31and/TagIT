"""Medical / emergency profile endpoints (owner-only)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from auth import get_current_user
from db import get_db
from models import ProfileOut, ProfilePayload

router = APIRouter(prefix="/api/tags/{tag_id}/profile", tags=["profiles"])


async def _current_user_dep(request: Request) -> dict:
    return await get_current_user(request, get_db())


async def _assert_owner(tag_id: str, user: dict) -> dict:
    db = get_db()
    doc = await db.tags.find_one({"id": tag_id, "owner_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tag not found")
    return doc


@router.get("", response_model=ProfileOut)
async def get_profile(tag_id: str, user: dict = Depends(_current_user_dep)) -> dict:
    db = get_db()
    await _assert_owner(tag_id, user)
    doc = await db.profiles.find_one({"tag_id": tag_id}, {"_id": 0})
    if not doc:
        # Return an empty profile so the form has something to bind to
        return {
            "id": "",
            "tag_id": tag_id,
            "emergency_mode": False,
            "blood_group": "",
            "allergies": "",
            "chronic_conditions": "",
            "emergency_contact_name": "",
            "emergency_contact_phone": "",
            "nearest_police_station": "",
            "additional_notes": "",
            "consent_given": False,
            "last_updated": "",
        }
    return doc


@router.put("", response_model=ProfileOut)
async def upsert_profile(
    tag_id: str, payload: ProfilePayload, user: dict = Depends(_current_user_dep)
) -> dict:
    db = get_db()
    await _assert_owner(tag_id, user)
    now = datetime.now(timezone.utc).isoformat()
    existing = await db.profiles.find_one({"tag_id": tag_id}, {"_id": 0})
    if existing:
        update = payload.model_dump()
        update["last_updated"] = now
        await db.profiles.update_one({"tag_id": tag_id}, {"$set": update})
        existing.update(update)
        return existing
    doc = {
        "id": f"prof_{uuid.uuid4().hex[:12]}",
        "tag_id": tag_id,
        **payload.model_dump(),
        "last_updated": now,
    }
    await db.profiles.insert_one(doc)
    return doc
