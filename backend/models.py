"""Pydantic models for InfoTag.

We keep MongoDB documents flat and JSON-serialisable.  All ObjectIds are
avoided in favour of UUID strings stored in the document body so the API
never has to translate between BSON and JSON.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


TagType = Literal["vehicle", "pet", "luggage", "keys", "medical", "general"]
TagStatus = Literal["active", "lost", "found"]
ActionType = Literal[
    "message",
    "wrong_parking",
    "headlight_on",
    "found",
    "call_request",
]


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    email: EmailStr
    display_name: str = ""
    notify_on_message: bool = True
    notify_on_scan: bool = False
    locale: str = "en"
    auth_provider: str = "password"  # password | google | both
    created_at: str


class RegisterPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = ""


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class UpdateUserPayload(BaseModel):
    display_name: Optional[str] = None
    notify_on_message: Optional[bool] = None
    notify_on_scan: Optional[bool] = None
    locale: Optional[str] = None


class ChangePasswordPayload(BaseModel):
    current_password: Optional[str] = None
    new_password: str = Field(min_length=8, max_length=128)


# ---------------------------------------------------------------------------
# Tag
# ---------------------------------------------------------------------------
DEFAULT_PUBLIC_FIELDS: dict[str, bool] = {
    "display_name": True,
    "message": True,
    "type": True,
    # vehicle / pet specific
    "vehicle_make_model": True,
    "vehicle_plate": False,
    "pet_name": True,
    "pet_breed": True,
    # generic notes
    "note": True,
}


class TagCreatePayload(BaseModel):
    type: TagType
    label: str = ""
    display_name: str = ""
    message: str = ""
    data: dict[str, Any] = Field(default_factory=dict)
    public_fields: dict[str, bool] = Field(default_factory=lambda: dict(DEFAULT_PUBLIC_FIELDS))


class TagUpdatePayload(BaseModel):
    label: Optional[str] = None
    display_name: Optional[str] = None
    message: Optional[str] = None
    status: Optional[TagStatus] = None
    data: Optional[dict[str, Any]] = None
    public_fields: Optional[dict[str, bool]] = None


class TagOut(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    slug: str
    owner_id: Optional[str]
    type: TagType
    label: str
    display_name: str
    message: str
    status: TagStatus
    data: dict[str, Any]
    public_fields: dict[str, bool]
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Profile (medical / emergency)
# ---------------------------------------------------------------------------
class ProfilePayload(BaseModel):
    emergency_mode: bool = False
    blood_group: str = ""
    allergies: str = ""
    chronic_conditions: str = ""
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""
    nearest_police_station: str = ""
    additional_notes: str = ""
    consent_given: bool = False


class ProfileOut(ProfilePayload):
    id: str
    tag_id: str
    last_updated: str


# ---------------------------------------------------------------------------
# Messages from finders
# ---------------------------------------------------------------------------
class MessageCreatePayload(BaseModel):
    action_type: ActionType
    finder_name: str = ""
    finder_contact: str = ""
    body: str = ""
    location: Optional[dict[str, float]] = None  # {lat, lng}
    bot_check: str = ""  # honeypot; should remain empty


class MessageOut(BaseModel):
    id: str
    tag_id: str
    action_type: ActionType
    finder_name: str
    finder_contact: str
    body: str
    location: Optional[dict[str, float]]
    created_at: str


# ---------------------------------------------------------------------------
# Public finder view (carefully curated, never returns owner contact)
# ---------------------------------------------------------------------------
class FinderView(BaseModel):
    slug: str
    type: TagType
    status: TagStatus
    display_name: str
    message: str
    public_data: dict[str, Any]
    is_unclaimed: bool
    # Medical-only fields (only populated when emergency_mode + consent_given)
    emergency: Optional[dict[str, Any]] = None
