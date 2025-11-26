"""
Migration script to add missing columns to activities table for the new model.
Run this once to update the local SQLite schema and backfill a few values.
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
        print("Starting activities migration...")

        # Core new columns needed by the API/model
        add_column_if_missing(cursor, "activities", "created_by_id", "TEXT")
        add_column_if_missing(cursor, "activities", "category_label", "VARCHAR(50)")
        add_column_if_missing(cursor, "activities", "location_display", "VARCHAR(200)")
        add_column_if_missing(cursor, "activities", "client_description", "TEXT")
        add_column_if_missing(cursor, "activities", "default_duration_value", "INTEGER")
        add_column_if_missing(cursor, "activities", "default_duration_unit", "VARCHAR(20)")
        add_column_if_missing(cursor, "activities", "rating", "NUMERIC(2,1)")
        add_column_if_missing(cursor, "activities", "group_size_label", "VARCHAR(50)")
        add_column_if_missing(cursor, "activities", "cost_type", "VARCHAR(50) DEFAULT 'included'")
        add_column_if_missing(cursor, "activities", "cost_display", "VARCHAR(100)")
        add_column_if_missing(cursor, "activities", "internal_notes", "TEXT")

        # Backfill location_display from legacy location column if present
        if column_exists(cursor, "activities", "location_display") and column_exists(cursor, "activities", "location"):
            cursor.execute(
                """
                UPDATE activities
                SET location_display = location
                WHERE location_display IS NULL
                  AND location IS NOT NULL
                """
            )
            print("✓ Backfilled location_display from legacy location")

        # Ensure cost_type has a value
        if column_exists(cursor, "activities", "cost_type"):
            cursor.execute(
                """
                UPDATE activities
                SET cost_type = 'included'
                WHERE cost_type IS NULL OR cost_type = ''
                """
            )
            print("✓ Backfilled cost_type with default 'included' where missing")

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
