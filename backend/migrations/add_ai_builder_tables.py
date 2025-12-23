"""
Migration script to create AI Itinerary Builder tables.

Creates:
- ai_builder_sessions: Tracks AI builder workflow sessions
- ai_builder_draft_activities: Draft activities extracted by AI for review

Also adds helper columns to activities table for tracking AI-created activities.
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
        print("AI ITINERARY BUILDER MIGRATION")
        print("=" * 60)
        print("\nThis migration creates tables for the AI Itinerary Builder feature")

        # ============================================================
        # CREATE AI_BUILDER_SESSIONS TABLE
        # ============================================================
        print("\n[1/3] Creating ai_builder_sessions table...")

        if table_exists(cursor, "ai_builder_sessions"):
            print("  - Table 'ai_builder_sessions' already exists")
        else:
            cursor.execute("""
                CREATE TABLE ai_builder_sessions (
                    id TEXT PRIMARY KEY,
                    agency_id TEXT NOT NULL,
                    user_id TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    current_step INTEGER DEFAULT 1,
                    error_message TEXT,
                    raw_content TEXT NOT NULL,
                    destination TEXT,
                    trip_title TEXT,
                    num_days INTEGER,
                    detected_days INTEGER,
                    parsed_summary TEXT,
                    activities_created INTEGER DEFAULT 0,
                    activities_reused INTEGER DEFAULT 0,
                    template_id TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    completed_at DATETIME,
                    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL
                )
            """)
            print("  + Created table: ai_builder_sessions")

            # Create indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_ai_sessions_agency
                ON ai_builder_sessions(agency_id)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_ai_sessions_status
                ON ai_builder_sessions(status)
            """)
            print("  + Created indexes on ai_builder_sessions")

        # ============================================================
        # CREATE AI_BUILDER_DRAFT_ACTIVITIES TABLE
        # ============================================================
        print("\n[2/3] Creating ai_builder_draft_activities table...")

        if table_exists(cursor, "ai_builder_draft_activities"):
            print("  - Table 'ai_builder_draft_activities' already exists")
        else:
            cursor.execute("""
                CREATE TABLE ai_builder_draft_activities (
                    id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,

                    -- Day assignment
                    day_number INTEGER NOT NULL,
                    order_index INTEGER DEFAULT 0,
                    day_title TEXT,

                    -- Core activity fields (matching Activity model)
                    name TEXT NOT NULL,
                    activity_type_id TEXT,
                    category_label TEXT,
                    location_display TEXT,

                    -- Descriptions (AI-enriched)
                    short_description TEXT,
                    client_description TEXT,

                    -- Duration
                    default_duration_value INTEGER,
                    default_duration_unit TEXT,

                    -- Meta
                    rating REAL,
                    group_size_label TEXT,

                    -- Cost
                    cost_type TEXT DEFAULT 'included',
                    cost_display TEXT,
                    price_numeric REAL,
                    currency_code TEXT DEFAULT 'INR',

                    -- JSON fields (AI-enriched)
                    highlights TEXT,
                    tags TEXT,
                    vibe_tags TEXT,

                    -- Additional meta
                    marketing_badge TEXT,
                    optimal_time_of_day TEXT,

                    -- Matching fields
                    search_matches TEXT,
                    matched_activity_id TEXT,
                    match_score REAL,
                    match_reasoning TEXT,

                    -- User decision
                    decision TEXT NOT NULL DEFAULT 'pending',

                    -- Final outcome
                    created_activity_id TEXT,

                    -- Timestamps
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                    FOREIGN KEY (session_id) REFERENCES ai_builder_sessions(id) ON DELETE CASCADE,
                    FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE SET NULL,
                    FOREIGN KEY (matched_activity_id) REFERENCES activities(id) ON DELETE SET NULL,
                    FOREIGN KEY (created_activity_id) REFERENCES activities(id) ON DELETE SET NULL
                )
            """)
            print("  + Created table: ai_builder_draft_activities")

            # Create indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_ai_drafts_session
                ON ai_builder_draft_activities(session_id)
            """)
            print("  + Created index on ai_builder_draft_activities")

        # ============================================================
        # ADD AI_BUILDER_ENABLED TO AGENCIES TABLE
        # ============================================================
        print("\n[3/4] Adding AI Builder toggle to agencies table...")

        add_column_if_missing(
            cursor, "agencies", "ai_builder_enabled",
            "INTEGER DEFAULT 0 NOT NULL"
        )

        # ============================================================
        # ADD TRACKING COLUMNS TO ACTIVITIES TABLE
        # ============================================================
        print("\n[4/4] Adding AI tracking columns to activities table...")

        add_column_if_missing(
            cursor, "activities", "created_via_ai_builder",
            "INTEGER DEFAULT 0"
        )

        add_column_if_missing(
            cursor, "activities", "ai_builder_session_id",
            "TEXT"
        )

        conn.commit()
        print("\n" + "=" * 60)
        print("+ MIGRATION COMPLETE!")
        print("=" * 60)
        print("\nAI Itinerary Builder tables are now ready.")
        print("\nTo enable for an agency, set ai_builder_enabled = 1:")
        print("  UPDATE agencies SET ai_builder_enabled = 1")
        print("  WHERE id = 'your-agency-id';")
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
