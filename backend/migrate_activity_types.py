"""
Migration script to rename icon column to description in activity_types table
Run this once to update the database schema
"""
import sqlite3
import os

db_path = "./travel_saas.db"

if not os.path.exists(db_path):
    print(f"Database {db_path} not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Starting migration...")

try:
    # Check if icon column exists
    cursor.execute("PRAGMA table_info(activity_types)")
    columns = {row[1]: row[2] for row in cursor.fetchall()}

    if 'icon' in columns and 'description' not in columns:
        # SQLite doesn't support RENAME COLUMN in older versions
        # We need to create new table, copy data, drop old, rename new

        print("Renaming 'icon' column to 'description'...")

        # Create new table with description column
        cursor.execute("""
            CREATE TABLE activity_types_new (
                id TEXT PRIMARY KEY,
                agency_id TEXT NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
            )
        """)

        # Copy data from old table to new table
        cursor.execute("""
            INSERT INTO activity_types_new (id, agency_id, name, description, created_at)
            SELECT id, agency_id, name, icon, created_at FROM activity_types
        """)

        # Drop old table
        cursor.execute("DROP TABLE activity_types")

        # Rename new table to activity_types
        cursor.execute("ALTER TABLE activity_types_new RENAME TO activity_types")

        # Recreate index
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_activity_types_agency_id ON activity_types(agency_id)")

        print("✓ Successfully renamed 'icon' to 'description'")
    elif 'description' in columns:
        print("- Column 'description' already exists")
    else:
        # Neither exists, add description
        cursor.execute("ALTER TABLE activity_types ADD COLUMN description TEXT")
        print("✓ Added 'description' column")

    conn.commit()
    print("\nMigration complete!")

except Exception as e:
    print(f"✗ Error during migration: {e}")
    conn.rollback()
finally:
    conn.close()

print("You can now restart your backend server.")
