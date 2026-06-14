"""Standalone seed script — useful for fresh dev DBs.

Usage:
    cd /app/backend
    python seed.py
"""
from __future__ import annotations

import asyncio

from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from db import close_db, ensure_indexes, get_db, seed_admin_and_demo  # noqa: E402


async def main() -> None:
    db = get_db()
    await ensure_indexes(db)
    await seed_admin_and_demo(db)
    print("Seeded admin + 3 demo tags (vehicle, pet, medical).")
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
