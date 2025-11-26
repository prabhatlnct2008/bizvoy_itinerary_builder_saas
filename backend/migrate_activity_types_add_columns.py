"""
Migration script to add missing columns to activity_types table.
Run this once to add icon and updated_at plus backfill sensible defaults.
"""
import os
import sqlite3


DB_PATH = "./travel_saas.db"


def column_exists(cursor: sqlite3.Cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def main() -> int:
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found!")
        return 1

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Starting activity_types migration...")

        # Add icon column if missing
        if not column_exists(cursor, "activity_types", "icon"):
            cursor.execute("ALTER TABLE activity_types ADD COLUMN icon VARCHAR(50)")
            print("✓ Added column: icon")
        else:
            print("- Column 'icon' already exists")

        # Add updated_at column if missing
        if not column_exists(cursor, "activity_types", "updated_at"):
            cursor.execute("ALTER TABLE activity_types ADD COLUMN updated_at DATETIME")
            print("✓ Added column: updated_at")
        else:
            print("- Column 'updated_at' already exists")

        # Backfill icon values for the seeded defaults when empty
        icon_updates = {
            "Stay": "bed",
            "Meal": "utensils",
            "Experience": "compass",
            "Transfer": "car",
            "Other": "star",
        }
        cursor.execute("PRAGMA table_info(activity_types)")
        columns = [row[1] for row in cursor.fetchall()]
        if "icon" in columns:
            for name, icon in icon_updates.items():
                cursor.execute(
                    """
                    UPDATE activity_types
                    SET icon = ?
                    WHERE name = ?
                      AND (icon IS NULL OR icon = '')
                    """,
                    (icon, name),
                )
            print("✓ Backfilled icons for default activity types where missing")

        # Backfill updated_at for existing rows that are null
        if "updated_at" in columns:
            cursor.execute(
                """
                UPDATE activity_types
                SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP)
                WHERE updated_at IS NULL
                """
            )
            print("✓ Backfilled updated_at where missing")

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
