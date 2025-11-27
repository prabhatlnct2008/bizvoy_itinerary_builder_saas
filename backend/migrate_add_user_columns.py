#!/usr/bin/env python3
"""
Migration script to add new columns to the users table.
Run via shell: python migrate_add_user_columns.py

This adds:
- phone (VARCHAR(50), nullable)
- is_bizvoy_admin (BOOLEAN, default False)
- force_password_reset (BOOLEAN, default False)
"""
import sys
sys.path.insert(0, '.')

from app.db.session import engine
from sqlalchemy import text

def migrate():
    """Add missing columns to users table."""
    print("Starting migration...")

    # Define columns to add (name, type, default)
    columns_to_add = [
        ("phone", "VARCHAR(50)", None),
        ("is_bizvoy_admin", "BOOLEAN", "0"),
        ("force_password_reset", "BOOLEAN", "0"),
    ]

    with engine.connect() as conn:
        for col_name, col_type, default_val in columns_to_add:
            try:
                # Check if column exists
                result = conn.execute(text(f"PRAGMA table_info(users)"))
                columns = [row[1] for row in result.fetchall()]

                if col_name in columns:
                    print(f"  Column '{col_name}' already exists, skipping.")
                    continue

                # Add column
                if default_val is not None:
                    sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_type} DEFAULT {default_val}"
                else:
                    sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"

                conn.execute(text(sql))
                conn.commit()
                print(f"  Added column '{col_name}'")

            except Exception as e:
                print(f"  Error adding column '{col_name}': {e}")

    print("Migration complete!")


if __name__ == "__main__":
    migrate()
