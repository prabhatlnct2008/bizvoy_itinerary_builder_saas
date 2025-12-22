"""
Migration script to add payment schedule fields to itinerary_pricing
and create the itinerary_payments table for tracking actual payments.

Run with: python migrations/add_payment_schedule.py
"""
import os
import sqlite3


DB_PATH = "./travel_saas.db"


def table_exists(cursor: sqlite3.Cursor, table: str) -> bool:
    """Check if a table exists"""
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table,)
    )
    return cursor.fetchone() is not None


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
        print("PAYMENT SCHEDULE MIGRATION")
        print("=" * 60)
        print("\nThis migration adds payment schedule and tracking features.")

        # ============================================================
        # EXTEND ITINERARY_PRICING TABLE
        # ============================================================
        print("\n[1/2] Extending itinerary_pricing table with payment schedule fields...")

        # Discount percentage
        add_column_if_missing(
            cursor, "itinerary_pricing", "discount_percent",
            "NUMERIC(5, 2)"
        )

        # Advance payment settings
        add_column_if_missing(
            cursor, "itinerary_pricing", "advance_enabled",
            "INTEGER DEFAULT 0 NOT NULL"
        )

        add_column_if_missing(
            cursor, "itinerary_pricing", "advance_type",
            "TEXT"  # 'fixed' or 'percent'
        )

        add_column_if_missing(
            cursor, "itinerary_pricing", "advance_amount",
            "NUMERIC(10, 2)"
        )

        add_column_if_missing(
            cursor, "itinerary_pricing", "advance_percent",
            "NUMERIC(5, 2)"
        )

        add_column_if_missing(
            cursor, "itinerary_pricing", "advance_deadline",
            "DATETIME"
        )

        # Final payment deadline
        add_column_if_missing(
            cursor, "itinerary_pricing", "final_deadline",
            "DATETIME"
        )

        # ============================================================
        # CREATE ITINERARY_PAYMENTS TABLE
        # ============================================================
        print("\n[2/2] Creating itinerary_payments table...")

        if table_exists(cursor, "itinerary_payments"):
            print("  - Table 'itinerary_payments' already exists")
        else:
            cursor.execute("""
                CREATE TABLE itinerary_payments (
                    id TEXT PRIMARY KEY,
                    itinerary_id TEXT NOT NULL,

                    -- Payment details
                    payment_type TEXT NOT NULL,
                    amount NUMERIC(10, 2) NOT NULL,
                    currency TEXT DEFAULT 'USD' NOT NULL,

                    -- Payment info
                    payment_method TEXT,
                    reference_number TEXT,
                    paid_at DATETIME,
                    notes TEXT,

                    -- Audit trail
                    confirmed_by TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
                    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
                )
            """)
            print("  + Created table: itinerary_payments")

            # Create index
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_itinerary_payments_itinerary
                ON itinerary_payments(itinerary_id)
            """)
            print("  + Created index on itinerary_payments(itinerary_id)")

        conn.commit()
        print("\n" + "=" * 60)
        print("+ MIGRATION COMPLETE!")
        print("=" * 60)
        print("\nPayment schedule and tracking features are now available.")
        print("\nNew capabilities:")
        print("  - Set discount percentage on itineraries")
        print("  - Configure advance payment requirements")
        print("  - Set advance and final payment deadlines")
        print("  - Record and track actual payments received")
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
