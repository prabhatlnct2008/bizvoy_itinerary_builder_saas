import sqlite3

# Migration script to add pricing fields to itinerary_day_activities

def upgrade(db_path="travel_saas.db"):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Add new columns if they don't exist
    columns = [
        ("price_amount", "NUMERIC"),
        ("price_currency", "TEXT DEFAULT 'USD'"),
        ("pricing_unit", "TEXT DEFAULT 'flat'"),
        ("quantity", "INTEGER DEFAULT 1"),
        ("item_discount_amount", "NUMERIC")
    ]

    cur.execute("PRAGMA table_info(itinerary_day_activities);")
    existing = {row[1] for row in cur.fetchall()}

    for col_name, col_type in columns:
        if col_name not in existing:
            cur.execute(f"ALTER TABLE itinerary_day_activities ADD COLUMN {col_name} {col_type}")

    conn.commit()
    conn.close()


def downgrade(db_path="travel_saas.db"):
    # SQLite does not support dropping columns easily; no-op downgrade.
    pass

if __name__ == "__main__":
    upgrade()
