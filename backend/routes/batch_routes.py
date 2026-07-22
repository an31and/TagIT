"""Bulk / event tags — organisation "batches".

An organisation (temple management, an NGO, an event or government body) mints
many tags in one shot and hands them out as wristbands / ID cards to
individuals, groups or families.  Every tag in a batch is **owned by the
issuing org**, so finder messages, the relay contact and scan analytics all
route back to the org's control room through the existing tag/finder/inbox
code paths — no new plumbing.

Scale note
----------
Synchronous generation is capped per request (``MAX_BATCH_TAGS``).  A print run
of millions is served by the CSV manifest export (``seq, slug, finder_url``)
handed to a printing vendor, plus paginated A4 sticker-sheet PDFs.
"""
from __future__ import annotations

import csv
import io
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pymongo.errors import BulkWriteError

from auth import get_current_user
from db import get_db
from models import (
    DEFAULT_PUBLIC_FIELDS,
    MAX_BATCH_TAGS,
    BatchCreatePayload,
    BatchOut,
    BatchUpdatePayload,
    TagOut,
)
from routes.pdf_routes import _qr_image  # reuse the QR renderer
from urls import resolve_site_url, site_domain

router = APIRouter(prefix="/api/batches", tags=["batches"])

# Longer slugs for batch tags: at millions of tags a 7-char slug starts to see
# birthday-paradox collisions, so bulk tags get a wider keyspace.
BATCH_SLUG_LEN = 9
INSERT_CHUNK = 1000
# Per-request sticker-sheet cap.  12 stickers/page → 50 pages.  Beyond this,
# organisers page through with ?start=&count= or use the CSV manifest.
MAX_PDF_STICKERS = 600


async def _current_user_dep(request: Request) -> dict:
    return await get_current_user(request, get_db())


def _batch_slug(length: int = BATCH_SLUG_LEN) -> str:
    """A URL-safe slug of *exactly* ``length`` chars.

    ``auth.generate_slug`` strips the ``-``/``_`` chars token_urlsafe emits, so
    it can fall *below* the requested length and lose entropy — fine for a
    handful of personal tags, not for a million-tag print run.  We top up until
    we have enough characters, then trim.
    """
    s = ""
    while len(s) < length:
        s += secrets.token_urlsafe(8).replace("-", "").replace("_", "")
    return s[:length]


def _batch_doc_to_out(doc: dict, *, scanned: int = 0, messages: int = 0) -> dict:
    return {
        "id": doc["id"],
        "owner_id": doc["owner_id"],
        "name": doc.get("name", ""),
        "org_name": doc.get("org_name", ""),
        "kind": doc.get("kind", "individual"),
        "tag_type": doc.get("tag_type", "general"),
        "message": doc.get("message", ""),
        "note": doc.get("note", ""),
        "starts_on": doc.get("starts_on", ""),
        "ends_on": doc.get("ends_on", ""),
        "status": doc.get("status", "active"),
        "count": doc.get("count", 0),
        "scanned_count": scanned,
        "message_count": messages,
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


async def _generate_unique_slugs(db, n: int) -> list[str]:
    """Return ``n`` slugs not already present in the tags collection.

    Deduped in memory within the request and checked against the DB in bulk;
    the unique index on ``slug`` remains the ultimate backstop against a race
    with a concurrent writer (handled at insert time).
    """
    out: list[str] = []
    while len(out) < n:
        needed = n - len(out)
        candidates: set[str] = set()
        while len(candidates) < needed:
            candidates.add(_batch_slug())
        taken = {
            d["slug"]
            async for d in db.tags.find(
                {"slug": {"$in": list(candidates)}}, {"slug": 1, "_id": 0}
            )
        }
        out.extend(s for s in candidates if s not in taken)
    return out[:n]


async def _insert_tags(db, docs: list[dict]) -> None:
    """Insert tag docs in chunks, regenerating slugs on any duplicate-key race.

    With a 9-char slug the odds of colliding with an existing tag are already
    checked away in ``_generate_unique_slugs``; the retry here only covers a
    genuine race with a concurrent writer that the unique index rejects.
    """
    for i in range(0, len(docs), INSERT_CHUNK):
        chunk = docs[i : i + INSERT_CHUNK]
        for attempt in range(3):
            # motor mutates docs by stamping `_id`; strip it so retries re-insert cleanly.
            for doc in chunk:
                doc.pop("_id", None)
            try:
                await db.tags.insert_many(chunk, ordered=False)
                break
            except BulkWriteError as exc:
                dup_indexes = sorted(
                    e["index"]
                    for e in exc.details.get("writeErrors", [])
                    if e.get("code") == 11000
                )
                if not dup_indexes or attempt == 2:
                    raise
                fresh = await _generate_unique_slugs(db, len(dup_indexes))
                for j, new_slug in zip(dup_indexes, fresh):
                    chunk[j]["slug"] = new_slug
                chunk = [chunk[j] for j in dup_indexes]


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------
@router.post("", response_model=BatchOut)
async def create_batch(
    payload: BatchCreatePayload, user: dict = Depends(_current_user_dep)
) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    batch_id = f"batch_{uuid.uuid4().hex[:12]}"

    public_fields = payload.public_fields or dict(DEFAULT_PUBLIC_FIELDS)
    contact = payload.contact.model_dump()
    kind_label = {"individual": "ID", "group": "Group", "family": "Family"}[payload.kind]

    slugs = await _generate_unique_slugs(db, payload.count)
    tag_docs = []
    for seq, slug in enumerate(slugs, start=1):
        tag_docs.append(
            {
                "id": f"tag_{uuid.uuid4().hex[:12]}",
                "slug": slug,
                "owner_id": user["id"],
                "type": payload.tag_type,
                "label": f"{payload.name} · {kind_label} {seq}",
                "display_name": f"{payload.name} · {kind_label} {seq}",
                "message": payload.message,
                "status": "active",
                "data": {},
                "public_fields": public_fields,
                "contact": contact,
                "batch_id": batch_id,
                "seq": seq,
                "created_at": now,
                "updated_at": now,
            }
        )

    batch_doc = {
        "id": batch_id,
        "owner_id": user["id"],
        "name": payload.name,
        "org_name": payload.org_name,
        "kind": payload.kind,
        "tag_type": payload.tag_type,
        "message": payload.message,
        "note": payload.note,
        "starts_on": payload.starts_on,
        "ends_on": payload.ends_on,
        "status": "active",
        "count": len(tag_docs),
        "created_at": now,
        "updated_at": now,
    }
    await db.batches.insert_one(batch_doc)
    await _insert_tags(db, tag_docs)
    return _batch_doc_to_out(batch_doc)


# ---------------------------------------------------------------------------
# List / read
# ---------------------------------------------------------------------------
@router.get("", response_model=list[BatchOut])
async def list_batches(user: dict = Depends(_current_user_dep)) -> list[dict]:
    db = get_db()
    docs = [
        d
        async for d in db.batches.find({"owner_id": user["id"]}, {"_id": 0}).sort(
            "created_at", -1
        )
    ]
    out = []
    for d in docs:
        tag_ids = [
            t["id"]
            async for t in db.tags.find({"batch_id": d["id"]}, {"id": 1, "_id": 0})
        ]
        scanned = (
            await db.scans.count_documents({"tag_id": {"$in": tag_ids}})
            if tag_ids
            else 0
        )
        messages = (
            await db.messages.count_documents({"tag_id": {"$in": tag_ids}})
            if tag_ids
            else 0
        )
        out.append(_batch_doc_to_out(d, scanned=scanned, messages=messages))
    return out


async def _owned_batch(db, batch_id: str, user: dict) -> dict:
    doc = await db.batches.find_one(
        {"id": batch_id, "owner_id": user["id"]}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Batch not found")
    return doc


@router.get("/{batch_id}", response_model=BatchOut)
async def get_batch(batch_id: str, user: dict = Depends(_current_user_dep)) -> dict:
    db = get_db()
    doc = await _owned_batch(db, batch_id, user)
    tag_ids = [
        t["id"] async for t in db.tags.find({"batch_id": batch_id}, {"id": 1, "_id": 0})
    ]
    scanned = (
        await db.scans.count_documents({"tag_id": {"$in": tag_ids}}) if tag_ids else 0
    )
    messages = (
        await db.messages.count_documents({"tag_id": {"$in": tag_ids}})
        if tag_ids
        else 0
    )
    return _batch_doc_to_out(doc, scanned=scanned, messages=messages)


@router.get("/{batch_id}/tags", response_model=list[TagOut])
async def list_batch_tags(
    batch_id: str,
    user: dict = Depends(_current_user_dep),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> list[dict]:
    db = get_db()
    await _owned_batch(db, batch_id, user)
    docs = [
        d
        async for d in db.tags.find({"batch_id": batch_id}, {"_id": 0})
        .sort("seq", 1)
        .skip(skip)
        .limit(limit)
    ]
    return docs


@router.patch("/{batch_id}", response_model=BatchOut)
async def update_batch(
    batch_id: str,
    payload: BatchUpdatePayload,
    user: dict = Depends(_current_user_dep),
) -> dict:
    db = get_db()
    await _owned_batch(db, batch_id, user)
    update = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.batches.update_one({"id": batch_id}, {"$set": update})
    # Propagate the shared message to the batch's tags when it changes.
    if "message" in update:
        await db.tags.update_many(
            {"batch_id": batch_id}, {"$set": {"message": update["message"]}}
        )
    doc = await db.batches.find_one({"id": batch_id}, {"_id": 0})
    return _batch_doc_to_out(doc)


@router.delete("/{batch_id}")
async def delete_batch(batch_id: str, user: dict = Depends(_current_user_dep)) -> dict:
    db = get_db()
    await _owned_batch(db, batch_id, user)
    tag_ids = [
        t["id"] async for t in db.tags.find({"batch_id": batch_id}, {"id": 1, "_id": 0})
    ]
    if tag_ids:
        await db.messages.delete_many({"tag_id": {"$in": tag_ids}})
        await db.scans.delete_many({"tag_id": {"$in": tag_ids}})
        await db.profiles.delete_many({"tag_id": {"$in": tag_ids}})
    await db.tags.delete_many({"batch_id": batch_id})
    await db.batches.delete_one({"id": batch_id})
    return {"ok": True, "deleted_tags": len(tag_ids)}


# ---------------------------------------------------------------------------
# Exports — CSV manifest (scale path) + printable sticker-sheet PDF
# ---------------------------------------------------------------------------
@router.get("/{batch_id}/manifest.csv")
async def batch_manifest_csv(
    batch_id: str, request: Request, user: dict = Depends(_current_user_dep)
) -> StreamingResponse:
    """Full manifest for a printing vendor: seq, slug, finder URL, label."""
    db = get_db()
    doc = await _owned_batch(db, batch_id, user)
    site = resolve_site_url(request)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["seq", "slug", "finder_url", "label"])
    async for t in db.tags.find({"batch_id": batch_id}, {"_id": 0}).sort("seq", 1):
        writer.writerow(
            [
                t.get("seq", ""),
                t["slug"],
                f"{site}/api/finder/{t['slug']}",
                t.get("display_name", ""),
            ]
        )
    buf.seek(0)
    safe = doc.get("name", "batch").replace(" ", "-")[:40]
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="info-tag-{safe}-manifest.csv"'
        },
    )


@router.get("/{batch_id}/qrs.pdf")
async def batch_qrs_pdf(
    batch_id: str,
    request: Request,
    user: dict = Depends(_current_user_dep),
    start: int = Query(1, ge=1),
    count: int = Query(120, ge=1, le=MAX_PDF_STICKERS),
) -> StreamingResponse:
    """Printable A4 sticker sheets (12 distinct QRs/page) for a slice of a batch."""
    db = get_db()
    doc = await _owned_batch(db, batch_id, user)
    site = resolve_site_url(request)
    domain = site_domain(request)

    tags = [
        t
        async for t in db.tags.find(
            {"batch_id": batch_id, "seq": {"$gte": start, "$lt": start + count}},
            {"_id": 0},
        ).sort("seq", 1)
    ]
    if not tags:
        raise HTTPException(status_code=404, detail="No tags in that range")

    buf = io.BytesIO()
    _draw_batch_sheets(buf, tags, site, domain, doc.get("org_name") or doc.get("name", ""))
    buf.seek(0)
    safe = doc.get("name", "batch").replace(" ", "-")[:40]
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="info-tag-{safe}-{start}-{start + len(tags) - 1}.pdf"'
            )
        },
    )


def _draw_batch_sheets(buf, tags, site, domain, org_label) -> None:
    """Grid of distinct QR stickers, 3×4 per A4 page, paginated over `tags`."""
    from reportlab.lib.colors import HexColor, black
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas

    navy = HexColor("#0F172A")
    c = canvas.Canvas(buf, pagesize=A4)
    page_w, page_h = A4
    cols, rows = 3, 4
    per_page = cols * rows
    margin_x, margin_y = 12 * mm, 12 * mm
    gap = 4 * mm
    cell_w = (page_w - 2 * margin_x - (cols - 1) * gap) / cols
    cell_h = (page_h - 2 * margin_y - (rows - 1) * gap) / rows

    for idx, tag in enumerate(tags):
        slot = idx % per_page
        if idx and slot == 0:
            c.showPage()
        r, col = divmod(slot, cols)
        x = margin_x + col * (cell_w + gap)
        y = page_h - margin_y - (r + 1) * cell_h - r * gap

        c.setStrokeColor(HexColor("#888888"))
        c.setDash(2, 2)
        c.rect(x, y, cell_w, cell_h, stroke=1, fill=0)
        c.setDash()

        pil = _qr_image(f"{site}/api/finder/{tag['slug']}")
        from reportlab.lib.utils import ImageReader

        qr_size = min(cell_w, cell_h) - 22 * mm
        qr_x = x + (cell_w - qr_size) / 2
        qr_y = y + cell_h - qr_size - 14 * mm
        c.drawImage(ImageReader(pil), qr_x, qr_y, width=qr_size, height=qr_size, mask=None)

        c.setFillColor(navy)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(x + cell_w / 2, y + cell_h - 8 * mm, (org_label or f"Info-Tag · {domain}")[:34])
        c.setFillColor(black)
        c.setFont("Helvetica-Bold", 8)
        label = tag.get("display_name") or f"#{tag.get('seq', '')}"
        c.drawCentredString(x + cell_w / 2, y + 10 * mm, label.upper()[:38])
        c.setFont("Helvetica", 6.5)
        c.drawCentredString(x + cell_w / 2, y + 6.5 * mm, f"{domain}/api/finder/{tag['slug']}")
        c.setFont("Helvetica-Oblique", 6)
        c.setFillColor(HexColor("#666666"))
        c.drawCentredString(x + cell_w / 2, y + 3.5 * mm, "Scan with any phone camera · no app")
    c.showPage()
    c.save()
