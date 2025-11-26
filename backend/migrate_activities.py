"""
Migration script to add new columns to activities table
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

# List of new columns to add
new_columns = [
    ("short_description", "TEXT"),
    ("description", "TEXT"),
    ("highlights", "TEXT"),
    ("pricing_model", "VARCHAR(50)"),
    ("pricing_notes", "TEXT"),
    ("min_duration_minutes", "INTEGER"),
    ("max_duration_minutes", "INTEGER"),
    ("tags", "TEXT"),
]

print("Starting migration...")

for column_name, column_type in new_columns:
    try:
        # Check if column exists
        cursor.execute(f"PRAGMA table_info(activities)")
        columns = [row[1] for row in cursor.fetchall()]

        if column_name not in columns:
            # Add the column
            cursor.execute(f"ALTER TABLE activities ADD COLUMN {column_name} {column_type}")
            print(f"✓ Added column: {column_name}")
        else:
            print(f"- Column already exists: {column_name}")
    except Exception as e:
        print(f"✗ Error adding {column_name}: {e}")

conn.commit()
conn.close()

print("\nMigration complete!")
print("You can now restart your backend server.")
