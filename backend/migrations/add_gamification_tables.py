"""
Migration script to add gamification tables and columns for Phase 1.
Run this once to update the SQLite schema for the Gamified Discovery Engine.
"""
import os
import sqlite3


DB_PATH = "./travel_saas.db"


def column_exists(cursor: sqlite3.Cursor, table: str, column: str) -> bool:
    """Check if a column exists in a table"""
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def table_exists(cursor: sqlite3.Cursor, table: str) -> bool:
    """Check if a table exists"""
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table,)
    )
    return cursor.fetchone() is not None


def add_column_if_missing(cursor: sqlite3.Cursor, table: str, column: str, ddl: str) -> None:
    """Add a column to a table if it doesn't exist"""
    if column_exists(cursor, table, column):
        print(f"  - Column '{table}.{column}' already exists")
        return
    cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")
    print(f"  ✓ Added column: {table}.{column}")


def create_table_if_missing(cursor: sqlite3.Cursor, table: str, ddl: str) -> None:
    """Create a table if it doesn't exist"""
    if table_exists(cursor, table):
        print(f"  - Table '{table}' already exists")
        return
    cursor.execute(ddl)
    print(f"  ✓ Created table: {table}")


def main() -> int:
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found!")
        return 1

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("=" * 60)
        print("GAMIFICATION MIGRATION - PHASE 1")
        print("=" * 60)

        # ============================================================
        # CREATE NEW TABLES
        # ============================================================
        print("\n[1/6] Creating new tables...")

        # agency_vibes
        create_table_if_missing(cursor, "agency_vibes", """
            CREATE TABLE agency_vibes (
                id TEXT PRIMARY KEY,
                agency_id TEXT NOT NULL,
                vibe_key TEXT NOT NULL,
                display_name TEXT NOT NULL,
                emoji TEXT,
                color_hex TEXT,
                is_global INTEGER DEFAULT 0,
                is_enabled INTEGER DEFAULT 1,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
                UNIQUE (agency_id, vibe_key)
            )
        """)

        # agency_personalization_settings
        create_table_if_missing(cursor, "agency_personalization_settings", """
            CREATE TABLE agency_personalization_settings (
                id TEXT PRIMARY KEY,
                agency_id TEXT NOT NULL UNIQUE,
                is_enabled INTEGER DEFAULT 0,
                default_deck_size INTEGER DEFAULT 20,
                personalization_policy TEXT DEFAULT 'flexible',
                max_price_per_traveler NUMERIC(10, 2),
                max_price_per_day NUMERIC(10, 2),
                default_currency TEXT DEFAULT 'USD',
                allowed_activity_type_ids TEXT,
                show_readiness_warnings INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
            )
        """)

        # personalization_sessions
        create_table_if_missing(cursor, "personalization_sessions", """
            CREATE TABLE personalization_sessions (
                id TEXT PRIMARY KEY,
                itinerary_id TEXT NOT NULL,
                share_link_id TEXT,
                device_id TEXT,
                selected_vibes TEXT,
                deck_size INTEGER DEFAULT 20,
                cards_viewed INTEGER DEFAULT 0,
                cards_liked INTEGER DEFAULT 0,
                cards_passed INTEGER DEFAULT 0,
                cards_saved INTEGER DEFAULT 0,
                total_time_seconds INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                last_interaction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_agent TEXT,
                ip_hash TEXT,
                FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
                FOREIGN KEY (share_link_id) REFERENCES share_links(id) ON DELETE SET NULL
            )
        """)

        # user_deck_interactions
        create_table_if_missing(cursor, "user_deck_interactions", """
            CREATE TABLE user_deck_interactions (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                itinerary_id TEXT NOT NULL,
                activity_id TEXT NOT NULL,
                action TEXT NOT NULL,
                seconds_viewed NUMERIC(10, 2) DEFAULT 0,
                card_position INTEGER,
                swipe_velocity NUMERIC(10, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES personalization_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
                FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
            )
        """)

        # itinerary_cart_items
        create_table_if_missing(cursor, "itinerary_cart_items", """
            CREATE TABLE itinerary_cart_items (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                itinerary_id TEXT NOT NULL,
                activity_id TEXT NOT NULL,
                day_id TEXT,
                quoted_price NUMERIC(10, 2),
                currency_code TEXT DEFAULT 'USD',
                time_slot TEXT,
                fit_status TEXT DEFAULT 'pending',
                fit_reason TEXT,
                miss_reason TEXT,
                swap_suggestion_activity_id TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES personalization_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
                FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
                FOREIGN KEY (day_id) REFERENCES itinerary_days(id) ON DELETE SET NULL,
                FOREIGN KEY (swap_suggestion_activity_id) REFERENCES activities(id) ON DELETE SET NULL
            )
        """)

        # ============================================================
        # EXTEND ACTIVITIES TABLE
        # ============================================================
        print("\n[2/6] Extending activities table...")

        add_column_if_missing(cursor, "activities", "price_numeric", "NUMERIC(10, 2)")
        add_column_if_missing(cursor, "activities", "currency_code", "TEXT DEFAULT 'USD'")
        add_column_if_missing(cursor, "activities", "marketing_badge", "TEXT")
        add_column_if_missing(cursor, "activities", "review_count", "INTEGER DEFAULT 0")
        add_column_if_missing(cursor, "activities", "review_rating", "NUMERIC(3, 2)")
        add_column_if_missing(cursor, "activities", "optimal_time_of_day", "TEXT")
        add_column_if_missing(cursor, "activities", "blocked_days_of_week", "TEXT")
        add_column_if_missing(cursor, "activities", "latitude", "NUMERIC(10, 7)")
        add_column_if_missing(cursor, "activities", "longitude", "NUMERIC(10, 7)")
        add_column_if_missing(cursor, "activities", "vibe_tags", "TEXT")
        add_column_if_missing(cursor, "activities", "gamification_readiness_score", "NUMERIC(3, 2) DEFAULT 0")
        add_column_if_missing(cursor, "activities", "gamification_readiness_issues", "TEXT")

        # ============================================================
        # EXTEND TEMPLATE_DAY_ACTIVITIES TABLE
        # ============================================================
        print("\n[3/6] Extending template_day_activities table...")

        add_column_if_missing(cursor, "template_day_activities", "start_time", "TEXT")
        add_column_if_missing(cursor, "template_day_activities", "end_time", "TEXT")
        add_column_if_missing(cursor, "template_day_activities", "is_locked_by_agency", "INTEGER DEFAULT 1")

        # ============================================================
        # EXTEND ITINERARY_DAY_ACTIVITIES TABLE
        # ============================================================
        print("\n[4/6] Extending itinerary_day_activities table...")

        add_column_if_missing(cursor, "itinerary_day_activities", "start_time", "TEXT")
        add_column_if_missing(cursor, "itinerary_day_activities", "end_time", "TEXT")
        add_column_if_missing(cursor, "itinerary_day_activities", "is_locked_by_agency", "INTEGER DEFAULT 0")
        add_column_if_missing(cursor, "itinerary_day_activities", "source_cart_item_id", "TEXT")
        add_column_if_missing(cursor, "itinerary_day_activities", "added_by_personalization", "INTEGER DEFAULT 0")

        # ============================================================
        # EXTEND ITINERARIES TABLE
        # ============================================================
        print("\n[5/6] Extending itineraries table...")

        add_column_if_missing(cursor, "itineraries", "personalization_enabled", "INTEGER DEFAULT 0")
        add_column_if_missing(cursor, "itineraries", "personalization_policy", "TEXT DEFAULT 'flexible'")
        add_column_if_missing(cursor, "itineraries", "personalization_lock_policy", "TEXT DEFAULT 'respect_locks'")
        add_column_if_missing(cursor, "itineraries", "personalization_completed", "INTEGER DEFAULT 0")
        add_column_if_missing(cursor, "itineraries", "personalization_completed_at", "TIMESTAMP")
        add_column_if_missing(cursor, "itineraries", "personalization_session_id", "TEXT")

        # ============================================================
        # CREATE INDEXES FOR PERFORMANCE
        # ============================================================
        print("\n[6/6] Creating indexes...")

        indexes = [
            ("idx_agency_vibes_agency", "CREATE INDEX IF NOT EXISTS idx_agency_vibes_agency ON agency_vibes(agency_id)"),
            ("idx_personalization_sessions_itinerary", "CREATE INDEX IF NOT EXISTS idx_personalization_sessions_itinerary ON personalization_sessions(itinerary_id)"),
            ("idx_personalization_sessions_status", "CREATE INDEX IF NOT EXISTS idx_personalization_sessions_status ON personalization_sessions(status)"),
            ("idx_user_deck_interactions_session", "CREATE INDEX IF NOT EXISTS idx_user_deck_interactions_session ON user_deck_interactions(session_id)"),
            ("idx_user_deck_interactions_activity", "CREATE INDEX IF NOT EXISTS idx_user_deck_interactions_activity ON user_deck_interactions(activity_id)"),
            ("idx_cart_items_session", "CREATE INDEX IF NOT EXISTS idx_cart_items_session ON itinerary_cart_items(session_id)"),
            ("idx_cart_items_itinerary", "CREATE INDEX IF NOT EXISTS idx_cart_items_itinerary ON itinerary_cart_items(itinerary_id)"),
            ("idx_cart_items_status", "CREATE INDEX IF NOT EXISTS idx_cart_items_status ON itinerary_cart_items(status)"),
            ("idx_activities_readiness", "CREATE INDEX IF NOT EXISTS idx_activities_readiness ON activities(gamification_readiness_score)"),
        ]

        for idx_name, idx_sql in indexes:
            cursor.execute(idx_sql)
            print(f"  ✓ Created index: {idx_name}")

        conn.commit()
        print("\n" + "=" * 60)
        print("✓ MIGRATION COMPLETE!")
        print("=" * 60)
        print("\nYou can now restart the backend server.")
        return 0

    except Exception as exc:
        conn.rollback()
        print(f"\n✗ Error during migration: {exc}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
