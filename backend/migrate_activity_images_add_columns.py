"""
Migration script to align activity_images table with current model fields.
Adds file_url and is_hero if they are missing, and backfills is_hero from legacy is_primary.
"""
import os
import sqlite3


DB_PATH = "./travel_saas.db"


def column_exists(cursor: sqlite3.Cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def add_column_if_missing(cursor: sqlite3.Cursor, table: str, column: str, ddl: str) -> None:
    if column_exists(cursor, table, column):
        print(f"- Column '{column}' already exists")
        return
    cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")
    print(f"✓ Added column: {column}")


def main() -> int:
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found!")
        return 1

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Starting activity_images migration...")

        add_column_if_missing(cursor, "activity_images", "file_url", "VARCHAR(500)")
        add_column_if_missing(cursor, "activity_images", "is_hero", "BOOLEAN DEFAULT 0 NOT NULL")

        # Backfill is_hero from legacy is_primary if present
        if column_exists(cursor, "activity_images", "is_hero") and column_exists(cursor, "activity_images", "is_primary"):
            cursor.execute(
                """
                UPDATE activity_images
                SET is_hero = is_primary
                WHERE is_primary IS NOT NULL
                """
            )
            print("✓ Backfilled is_hero from is_primary where present")

        conn.commit()
        print("Migration complete! You can restart the backend server now.")
        return 0
    except Exception as exc:  # pragma: no cover - safety net
        conn.rollback()
        print(f"✗ Error during migration: {exc}")
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
