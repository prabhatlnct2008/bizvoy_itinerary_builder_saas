"""
Migration script to add hybrid row pattern columns to itinerary_day_activities.
This enables LOGISTICS and NOTE item types alongside LIBRARY_ACTIVITY.
"""
import os
import sqlite3


DB_PATH = "./travel_saas.db"


def column_exists(cursor: sqlite3.Cursor, table: str, column: str) -> bool:
    """Check if a column exists in a table"""
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def add_column_if_missing(cursor: sqlite3.Cursor, table: str, column: str, ddl: str) -> None:
    """Add a column to a table if it doesn't exist"""
    if column_exists(cursor, table, column):
        print(f"  - Column '{table}.{column}' already exists")
        return
    cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")
    print(f"  + Added column: {table}.{column}")


def main() -> int:
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found!")
        return 1

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("=" * 60)
        print("HYBRID ROW PATTERN MIGRATION")
        print("=" * 60)
        print("\nThis migration adds support for LOGISTICS and NOTE items")
        print("in itinerary timelines (hotel check-in, taxi, notes, etc.)")

        # ============================================================
        # EXTEND ITINERARY_DAY_ACTIVITIES TABLE
        # ============================================================
        print("\n[1/2] Extending itinerary_day_activities table...")

        # Item type (LIBRARY_ACTIVITY, LOGISTICS, NOTE)
        add_column_if_missing(
            cursor, "itinerary_day_activities", "item_type",
            "TEXT DEFAULT 'LIBRARY_ACTIVITY' NOT NULL"
        )

        # Custom title for ad-hoc items
        add_column_if_missing(
            cursor, "itinerary_day_activities", "custom_title",
            "TEXT"
        )

        # JSON payload for extra details
        add_column_if_missing(
            cursor, "itinerary_day_activities", "custom_payload",
            "TEXT"
        )

        # Icon hint (hotel, taxi, plane, etc.)
        add_column_if_missing(
            cursor, "itinerary_day_activities", "custom_icon",
            "TEXT"
        )

        # ============================================================
        # ALSO ADD TO TEMPLATE_DAY_ACTIVITIES FOR TEMPLATE AUTHORING
        # ============================================================
        print("\n[2/2] Extending template_day_activities table...")

        add_column_if_missing(
            cursor, "template_day_activities", "item_type",
            "TEXT DEFAULT 'LIBRARY_ACTIVITY' NOT NULL"
        )

        add_column_if_missing(
            cursor, "template_day_activities", "custom_title",
            "TEXT"
        )

        add_column_if_missing(
            cursor, "template_day_activities", "custom_payload",
            "TEXT"
        )

        add_column_if_missing(
            cursor, "template_day_activities", "custom_icon",
            "TEXT"
        )

        conn.commit()
        print("\n" + "=" * 60)
        print("+ MIGRATION COMPLETE!")
        print("=" * 60)
        print("\nYou can now add LOGISTICS and NOTE items to itineraries.")
        print("Examples: Hotel check-in, Airport transfer, Travel notes")
        return 0

    except Exception as exc:
        conn.rollback()
        print(f"\n! Error during migration: {exc}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
