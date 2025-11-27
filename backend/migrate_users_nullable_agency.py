#!/usr/bin/env python3
"""
Migration script to make agency_id nullable in the users table and add new columns.
This is required for bizvoy admin users who don't belong to any agency.

Run via shell: python migrate_users_nullable_agency.py

SQLite requires table recreation to change column constraints.
This script safely:
1. Creates a new users table with the correct schema
2. Copies existing data
3. Drops the old table
4. Renames the new table
"""
import sys
sys.path.insert(0, '.')

from app.db.session import engine
from sqlalchemy import text


def migrate():
    """Make agency_id nullable and add new columns to users table."""
    print("=" * 60)
    print("  Users Table Migration - Make agency_id Nullable")
    print("=" * 60)
    print("\nThis migration allows bizvoy admin users without an agency.\n")

    with engine.connect() as conn:
        try:
            # Check current schema
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = {row[1]: row for row in result.fetchall()}
            print("Current columns:")
            for name, info in columns.items():
                print(f"  {name}: notnull={info[3]}")

            # Check if migration is needed
            if 'is_bizvoy_admin' in columns:
                # Check if agency_id is already nullable
                agency_info = columns.get('agency_id')
                if agency_info and agency_info[3] == 0:  # notnull=0 means nullable
                    print("\n✓ Migration already applied (agency_id is nullable)")
                    return True

            print("\nStarting migration...")

            # Step 1: Disable foreign key checks temporarily
            conn.execute(text("PRAGMA foreign_keys=OFF"))
            print("  [1/6] Disabled foreign key checks")

            # Step 2: Start a transaction
            conn.execute(text("BEGIN TRANSACTION"))
            print("  [2/6] Started transaction")

            # Step 3: Create new table with correct schema
            conn.execute(text("""
                CREATE TABLE users_new (
                    id VARCHAR NOT NULL PRIMARY KEY,
                    agency_id VARCHAR,
                    email VARCHAR(255) NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    is_superuser BOOLEAN NOT NULL DEFAULT 0,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    phone VARCHAR(50),
                    is_bizvoy_admin BOOLEAN NOT NULL DEFAULT 0,
                    force_password_reset BOOLEAN NOT NULL DEFAULT 0,
                    FOREIGN KEY(agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
                    UNIQUE(agency_id, email)
                )
            """))
            print("  [3/6] Created new users table with nullable agency_id")

            # Step 4: Copy data from old table
            # Handle case where old table may or may not have new columns
            if 'is_bizvoy_admin' in columns:
                conn.execute(text("""
                    INSERT INTO users_new
                    SELECT id, agency_id, email, hashed_password, full_name,
                           is_active, is_superuser, created_at, updated_at,
                           phone, is_bizvoy_admin, force_password_reset
                    FROM users
                """))
            else:
                conn.execute(text("""
                    INSERT INTO users_new (id, agency_id, email, hashed_password,
                                           full_name, is_active, is_superuser,
                                           created_at, updated_at, phone,
                                           is_bizvoy_admin, force_password_reset)
                    SELECT id, agency_id, email, hashed_password, full_name,
                           is_active, is_superuser, created_at, updated_at,
                           NULL, 0, 0
                    FROM users
                """))
            print("  [4/6] Copied data to new table")

            # Step 5: Drop old table
            conn.execute(text("DROP TABLE users"))
            print("  [5/6] Dropped old users table")

            # Step 6: Rename new table
            conn.execute(text("ALTER TABLE users_new RENAME TO users"))
            print("  [6/6] Renamed new table to users")

            # Create indexes
            conn.execute(text("CREATE INDEX ix_users_agency_id ON users(agency_id)"))
            conn.execute(text("CREATE INDEX ix_users_email ON users(email)"))
            print("  Created indexes")

            # Commit transaction
            conn.execute(text("COMMIT"))
            print("  Committed transaction")

            # Re-enable foreign key checks
            conn.execute(text("PRAGMA foreign_keys=ON"))
            print("  Re-enabled foreign key checks")

            # Verify migration
            result = conn.execute(text("PRAGMA table_info(users)"))
            print("\nNew schema:")
            for row in result.fetchall():
                notnull_str = "NOT NULL" if row[3] else "NULLABLE"
                print(f"  {row[1]}: {notnull_str}")

            print("\n" + "=" * 60)
            print("  Migration completed successfully!")
            print("=" * 60)
            return True

        except Exception as e:
            # Rollback on error
            try:
                conn.execute(text("ROLLBACK"))
            except:
                pass
            try:
                conn.execute(text("PRAGMA foreign_keys=ON"))
            except:
                pass
            print(f"\n✗ Migration failed: {e}")
            return False


if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)
