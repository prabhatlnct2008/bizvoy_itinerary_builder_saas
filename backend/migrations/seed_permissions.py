"""
Seed default permissions into the permissions table.
Safe to run multiple times (skips existing codenames).
"""
import os
import sqlite3
import uuid


DB_PATH = "./travel_saas.db"

# Derived from require_permission usages across the codebase
PERMISSIONS = [
    ("users", "view", "users.view"),
    ("users", "create", "users.create"),
    ("users", "edit", "users.edit"),
    ("users", "delete", "users.delete"),
    ("roles", "view", "roles.view"),
    ("roles", "create", "roles.create"),
    ("roles", "edit", "roles.edit"),
    ("roles", "delete", "roles.delete"),
    ("itineraries", "view", "itineraries.view"),
    ("itineraries", "create", "itineraries.create"),
    ("itineraries", "edit", "itineraries.edit"),
    ("itineraries", "delete", "itineraries.delete"),
    ("itineraries", "share", "itineraries.share"),
    ("itineraries", "export", "itineraries.export"),
    ("templates", "view", "templates.view"),
    ("templates", "create", "templates.create"),
    ("templates", "edit", "templates.edit"),
    ("templates", "delete", "templates.delete"),
    ("activities", "view", "activities.view"),
    ("activities", "create", "activities.create"),
    ("activities", "edit", "activities.edit"),
    ("activities", "delete", "activities.delete"),
    ("settings", "view", "settings.view"),
    ("settings", "edit", "settings.edit"),
]


def main() -> int:
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found")
        return 1

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute("CREATE TABLE IF NOT EXISTS permissions (id TEXT PRIMARY KEY, module TEXT NOT NULL, action TEXT NOT NULL, codename TEXT NOT NULL UNIQUE)")
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_codename ON permissions(codename)")

        inserted = 0
        for module, action, codename in PERMISSIONS:
            cur.execute("SELECT 1 FROM permissions WHERE codename = ?", (codename,))
            if cur.fetchone():
                continue
            cur.execute(
                "INSERT INTO permissions (id, module, action, codename) VALUES (?, ?, ?, ?)",
                (str(uuid.uuid4()), module, action, codename),
            )
            inserted += 1

        conn.commit()
        print(f"Seeded {inserted} permission(s).")
        return 0
    except Exception as exc:
        conn.rollback()
        print(f"Error seeding permissions: {exc}")
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
