"""
Normalize highlights and tags columns in activities to valid JSON.
Fixes errors when non-JSON strings were stored (e.g., plain text) that break
SQLAlchemy's JSON deserializer.
"""
import json
import os
import sqlite3
from typing import Any, Optional


DB_PATH = "./travel_saas.db"


def is_valid_json(value: Optional[str]) -> bool:
    if value is None:
        return True
    try:
        json.loads(value)
        return True
    except Exception:
        return False


def normalize(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    cursor.execute("SELECT id, highlights, tags FROM activities")
    rows = cursor.fetchall()

    fixed = 0
    for activity_id, highlights, tags in rows:
        needs_fix = False
        new_highlights: Optional[str] = highlights
        new_tags: Optional[str] = tags

        if highlights == "":
            new_highlights = None
            needs_fix = True
        elif not is_valid_json(highlights):
            new_highlights = json.dumps([])
            needs_fix = True

        if tags == "":
            new_tags = None
            needs_fix = True
        elif not is_valid_json(tags):
            new_tags = json.dumps([])
            needs_fix = True

        if needs_fix:
            cursor.execute(
                """
                UPDATE activities
                SET highlights = ?, tags = ?
                WHERE id = ?
                """,
                (new_highlights, new_tags, activity_id),
            )
            fixed += 1

    conn.commit()
    print(f"✓ Normalized JSON columns for {fixed} activities")


def main() -> int:
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found!")
        return 1

    conn = sqlite3.connect(DB_PATH)
    try:
        print("Normalizing activities JSON columns...")
        normalize(conn)
        print("Done. You can restart the backend server now.")
        return 0
    except Exception as exc:  # pragma: no cover - safety net
        conn.rollback()
        print(f"✗ Error during normalization: {exc}")
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
