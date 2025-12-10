"""
Migration to add accepted_currencies to agencies table.
"""
import os
import sqlite3


DB_PATH = "./travel_saas.db"


def column_exists(cursor: sqlite3.Cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def add_column_if_missing(cursor: sqlite3.Cursor, table: str, column: str, ddl: str) -> None:
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
        print("Adding accepted_currencies to agencies...")
        add_column_if_missing(cursor, "agencies", "accepted_currencies", "TEXT")
        conn.commit()
        print("Done.")
        return 0
    except Exception as exc:
        conn.rollback()
        print(f"Error: {exc}")
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
