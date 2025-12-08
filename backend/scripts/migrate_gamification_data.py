"""
Data Migration Script for Gamification Phase 1
Migrates existing activity data to support gamification features.
"""
import sys
import os
import re
import json
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models.activity import Activity
from app.models.agency import Agency
from app.services.gamification.vibe_service import VibeService
from app.services.gamification.settings_service import SettingsService
from app.services.gamification.readiness_calculator import ReadinessCalculator


# Vibe mapping based on common tags
VIBE_MAPPINGS = {
    "adventure": ["adventure", "hiking", "trekking", "safari", "outdoor", "extreme"],
    "luxury": ["luxury", "premium", "exclusive", "5-star", "high-end", "upscale"],
    "culture": ["culture", "cultural", "heritage", "museum", "history", "art"],
    "relaxation": ["relaxation", "spa", "wellness", "peaceful", "tranquil", "calm"],
    "foodie": ["foodie", "dining", "culinary", "food", "restaurant", "cuisine"],
    "nature": ["nature", "wildlife", "natural", "eco", "garden", "park"],
    "family": ["family", "kids", "children", "family-friendly"],
    "romantic": ["romantic", "couples", "honeymoon", "intimate"],
    "nightlife": ["nightlife", "bar", "club", "entertainment", "night"],
    "wellness": ["wellness", "yoga", "meditation", "fitness", "health"],
}

# Time of day mapping based on activity types
TIME_OF_DAY_MAPPINGS = {
    "early_morning": ["sunrise", "dawn", "morning safari"],
    "morning": ["breakfast", "brunch", "morning"],
    "afternoon": ["lunch", "afternoon", "daytime"],
    "evening": ["sunset", "dinner", "evening"],
    "night": ["nightlife", "stargazing", "night"],
}


def parse_price_from_cost_display(cost_display: str) -> tuple:
    """
    Parse numeric price and currency from cost_display string.

    Examples:
        "From $120 per person" -> (120.00, "USD")
        "€50-€80" -> (50.00, "EUR")
        "$1,200" -> (1200.00, "USD")

    Returns:
        Tuple of (price_numeric, currency_code)
    """
    if not cost_display:
        return None, None

    # Currency symbols and codes
    currency_map = {
        "$": "USD",
        "€": "EUR",
        "£": "GBP",
        "¥": "JPY",
        "₹": "INR",
    }

    # Remove common words
    text = cost_display.lower()
    text = re.sub(r'\b(from|per|person|traveler|pp|pax)\b', '', text)

    # Find currency symbol
    currency_code = "USD"  # Default
    for symbol, code in currency_map.items():
        if symbol in cost_display:
            currency_code = code
            break

    # Extract numbers (with optional comma separators)
    numbers = re.findall(r'[\d,]+\.?\d*', text)
    if not numbers:
        return None, currency_code

    # Take the first number (in ranges like "$50-$80")
    price_str = numbers[0].replace(',', '')
    try:
        price = Decimal(price_str)
        return price, currency_code
    except:
        return None, currency_code


def derive_vibe_tags(activity: Activity) -> list:
    """Derive vibe tags from existing tags and activity data"""
    vibes = set()

    # Parse existing tags
    existing_tags = []
    if activity.tags:
        if isinstance(activity.tags, list):
            existing_tags = activity.tags
        elif isinstance(activity.tags, str):
            try:
                existing_tags = json.loads(activity.tags)
            except:
                pass

    # Convert tags to lowercase for matching
    tags_lower = [tag.lower() for tag in existing_tags]

    # Also check name and description
    searchable_text = " ".join([
        activity.name or "",
        activity.short_description or "",
        activity.client_description or "",
        *existing_tags
    ]).lower()

    # Match vibes
    for vibe_key, keywords in VIBE_MAPPINGS.items():
        for keyword in keywords:
            if keyword in searchable_text:
                vibes.add(vibe_key)
                break

    return list(vibes)


def infer_optimal_time_of_day(activity: Activity) -> str:
    """Infer optimal time of day from activity type and name"""
    searchable_text = " ".join([
        activity.name or "",
        activity.activity_type.name if activity.activity_type else "",
        activity.category_label or "",
    ]).lower()

    # Check for time-specific keywords
    for time_slot, keywords in TIME_OF_DAY_MAPPINGS.items():
        for keyword in keywords:
            if keyword in searchable_text:
                return time_slot

    # Defaults based on category
    category = (activity.category_label or "").lower()
    if "dining" in category or "meal" in category:
        if "breakfast" in searchable_text:
            return "morning"
        elif "lunch" in searchable_text:
            return "afternoon"
        elif "dinner" in searchable_text:
            return "evening"
        return "evening"  # Default for dining

    if "transfer" in category or "transport" in category:
        return "morning"  # Default for transfers

    if "accommodation" in category or "hotel" in category:
        return "night"  # Default for accommodation

    # Default to afternoon for general activities
    return "afternoon"


def migrate_activity_data(db: Session) -> dict:
    """Migrate activity data for gamification"""
    stats = {
        "total_activities": 0,
        "price_parsed": 0,
        "vibes_added": 0,
        "time_inferred": 0,
        "readiness_calculated": 0,
    }

    activities = db.query(Activity).all()
    stats["total_activities"] = len(activities)

    print(f"Processing {len(activities)} activities...")

    for activity in activities:
        updated = False

        # Parse price
        if activity.cost_display and not activity.price_numeric:
            price, currency = parse_price_from_cost_display(activity.cost_display)
            if price:
                activity.price_numeric = price
                activity.currency_code = currency
                stats["price_parsed"] += 1
                updated = True

        # Derive vibe tags
        if not activity.vibe_tags:
            vibes = derive_vibe_tags(activity)
            if vibes:
                activity.vibe_tags = json.dumps(vibes)
                stats["vibes_added"] += 1
                updated = True

        # Infer optimal time of day
        if not activity.optimal_time_of_day:
            time_slot = infer_optimal_time_of_day(activity)
            activity.optimal_time_of_day = time_slot
            stats["time_inferred"] += 1
            updated = True

        # Calculate readiness score
        score, issues = ReadinessCalculator.calculate_score(activity)
        activity.gamification_readiness_score = score
        activity.gamification_readiness_issues = json.dumps(issues) if issues else None
        stats["readiness_calculated"] += 1
        updated = True

    db.commit()
    print(f"✓ Activity data migration complete")
    return stats


def seed_agency_vibes(db: Session) -> int:
    """Seed global vibes for all agencies"""
    agencies = db.query(Agency).all()
    total_seeded = 0

    print(f"Seeding vibes for {len(agencies)} agencies...")

    for agency in agencies:
        count = VibeService.seed_global_vibes(db, agency.id)
        if count > 0:
            print(f"  ✓ Seeded {count} vibes for {agency.name}")
            total_seeded += count

    return total_seeded


def create_agency_settings(db: Session) -> int:
    """Create default personalization settings for all agencies"""
    agencies = db.query(Agency).all()
    created = 0

    print(f"Creating settings for {len(agencies)} agencies...")

    for agency in agencies:
        existing = SettingsService.get_settings(db, agency.id)
        if not existing:
            SettingsService.create_default_settings(db, agency.id)
            print(f"  ✓ Created settings for {agency.name}")
            created += 1

    return created


def main():
    """Run the data migration"""
    print("=" * 60)
    print("GAMIFICATION DATA MIGRATION - PHASE 1")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Step 1: Migrate activity data
        print("\n[1/3] Migrating activity data...")
        activity_stats = migrate_activity_data(db)
        print(f"  - Prices parsed: {activity_stats['price_parsed']}")
        print(f"  - Vibes added: {activity_stats['vibes_added']}")
        print(f"  - Time slots inferred: {activity_stats['time_inferred']}")
        print(f"  - Readiness scores calculated: {activity_stats['readiness_calculated']}")

        # Step 2: Seed vibes
        print("\n[2/3] Seeding agency vibes...")
        vibe_count = seed_agency_vibes(db)
        print(f"  - Total vibes seeded: {vibe_count}")

        # Step 3: Create settings
        print("\n[3/3] Creating agency settings...")
        settings_count = create_agency_settings(db)
        print(f"  - Settings created: {settings_count}")

        print("\n" + "=" * 60)
        print("✓ DATA MIGRATION COMPLETE!")
        print("=" * 60)
        print("\nSummary:")
        print(f"  - Activities processed: {activity_stats['total_activities']}")
        print(f"  - Agency vibes created: {vibe_count}")
        print(f"  - Agency settings created: {settings_count}")
        print("\nNext steps:")
        print("  1. Review activity readiness scores in the admin panel")
        print("  2. Enable personalization for agencies via settings")
        print("  3. Enable personalization on specific itineraries")

    except Exception as e:
        print(f"\n✗ Error during migration: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
