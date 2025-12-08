#!/usr/bin/env python3
"""
Backfill script to populate vibe_tags on activities based on activity_type and category_label.

This script maps activity types and categories to vibes:
- Dining-related types → "foodie"
- Adventure/outdoor types → "adventure"
- Cultural/historical types → "culture"
- Relaxation/wellness types → "relaxation"
- Nightlife/entertainment types → "nightlife"

Run with: python -m scripts.backfill_vibe_tags
Or: PYTHONPATH=. python scripts/backfill_vibe_tags.py
"""

import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.activity import Activity
from app.models.activity_type import ActivityType


# Mapping of keywords to vibe keys
# Keywords are matched case-insensitively against activity_type name, category_label, and activity name
VIBE_KEYWORD_MAP = {
    "foodie": [
        "brunch", "breakfast", "lunch", "dinner", "dining", "restaurant",
        "food", "culinary", "cooking", "chef", "tasting", "wine", "beer",
        "cocktail", "bar", "café", "cafe", "coffee", "tea", "bakery",
        "street food", "market", "gastronomy", "gourmet"
    ],
    "adventure": [
        "adventure", "hiking", "trekking", "climbing", "rafting", "kayak",
        "diving", "snorkeling", "surf", "ski", "snowboard", "zipline",
        "bungee", "paragliding", "skydiving", "safari", "jungle", "mountain",
        "extreme", "expedition", "off-road", "atv", "quad", "bike", "cycling",
        "water sport", "outdoor"
    ],
    "culture": [
        "culture", "cultural", "museum", "gallery", "art", "historical",
        "history", "temple", "church", "mosque", "monastery", "palace",
        "castle", "ruins", "archaeological", "heritage", "traditional",
        "local", "village", "ceremony", "festival", "theater", "theatre",
        "opera", "concert", "performance", "craft", "workshop"
    ],
    "relaxation": [
        "relax", "relaxation", "spa", "massage", "wellness", "yoga",
        "meditation", "retreat", "beach", "pool", "resort", "lounge",
        "sunset", "sunrise", "scenic", "cruise", "boat", "sailing",
        "leisure", "tranquil", "peaceful", "zen"
    ],
    "nightlife": [
        "nightlife", "night", "club", "clubbing", "disco", "party",
        "bar", "pub", "lounge", "live music", "jazz", "dj", "dance",
        "evening", "entertainment", "show", "cabaret", "casino"
    ]
}

# Category label to vibe mapping (more direct mapping)
CATEGORY_VIBE_MAP = {
    "dining": ["foodie"],
    "adventure": ["adventure"],
    "culture": ["culture"],
    "relaxation": ["relaxation"],
    "wellness": ["relaxation"],
    "entertainment": ["nightlife"],
    "sightseeing": ["culture"],
    "transfer": [],  # Transfers don't get vibes
}


def get_vibes_for_activity(
    activity_type_name: str,
    category_label: str | None,
    activity_name: str
) -> list[str]:
    """
    Determine which vibes apply to an activity based on its type, category, and name.
    """
    vibes = set()

    # Check category label first (most reliable)
    if category_label:
        category_lower = category_label.lower()
        if category_lower in CATEGORY_VIBE_MAP:
            vibes.update(CATEGORY_VIBE_MAP[category_lower])

    # Search for keywords in type name and activity name
    search_text = f"{activity_type_name} {activity_name}".lower()

    for vibe_key, keywords in VIBE_KEYWORD_MAP.items():
        for keyword in keywords:
            if keyword in search_text:
                vibes.add(vibe_key)
                break  # Found a match for this vibe, move to next

    return list(vibes)


def backfill_vibe_tags(db: Session, dry_run: bool = True) -> dict:
    """
    Backfill vibe_tags for all activities that have empty or null vibe_tags.

    Args:
        db: Database session
        dry_run: If True, only report what would be changed without making changes

    Returns:
        Summary of changes made/proposed
    """
    # Get all activities with their types
    activities = db.query(Activity).join(
        ActivityType, Activity.activity_type_id == ActivityType.id
    ).all()

    stats = {
        "total": len(activities),
        "already_tagged": 0,
        "updated": 0,
        "no_vibes_found": 0,
        "changes": []
    }

    for activity in activities:
        # Skip if already has vibe_tags
        current_tags = activity.vibe_tags
        if current_tags:
            try:
                parsed = json.loads(current_tags) if isinstance(current_tags, str) else current_tags
                if parsed and len(parsed) > 0:
                    stats["already_tagged"] += 1
                    continue
            except (json.JSONDecodeError, TypeError):
                pass

        # Get activity type name
        activity_type = db.query(ActivityType).filter(
            ActivityType.id == activity.activity_type_id
        ).first()

        type_name = activity_type.name if activity_type else ""

        # Determine vibes
        vibes = get_vibes_for_activity(
            type_name,
            activity.category_label,
            activity.name
        )

        if not vibes:
            stats["no_vibes_found"] += 1
            continue

        change_record = {
            "activity_id": activity.id,
            "activity_name": activity.name,
            "type_name": type_name,
            "category_label": activity.category_label,
            "assigned_vibes": vibes
        }
        stats["changes"].append(change_record)

        if not dry_run:
            activity.vibe_tags = json.dumps(vibes)
            stats["updated"] += 1

    if not dry_run:
        db.commit()

    return stats


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Backfill vibe_tags on activities based on type and category"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually apply the changes (default is dry-run)"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show detailed changes"
    )

    args = parser.parse_args()

    dry_run = not args.apply

    print("=" * 60)
    print("Vibe Tags Backfill Script")
    print("=" * 60)
    print(f"Mode: {'DRY RUN (no changes)' if dry_run else 'APPLYING CHANGES'}")
    print()

    db = SessionLocal()
    try:
        stats = backfill_vibe_tags(db, dry_run=dry_run)

        print("Summary:")
        print(f"  Total activities: {stats['total']}")
        print(f"  Already tagged: {stats['already_tagged']}")
        print(f"  Would update: {len(stats['changes'])}" if dry_run else f"  Updated: {stats['updated']}")
        print(f"  No vibes found: {stats['no_vibes_found']}")
        print()

        if args.verbose and stats["changes"]:
            print("Changes:")
            print("-" * 60)
            for change in stats["changes"]:
                print(f"  {change['activity_name']}")
                print(f"    Type: {change['type_name']}")
                print(f"    Category: {change['category_label']}")
                print(f"    Vibes: {', '.join(change['assigned_vibes'])}")
                print()

        if dry_run and stats["changes"]:
            print("To apply these changes, run with --apply flag:")
            print("  python -m scripts.backfill_vibe_tags --apply")

    finally:
        db.close()


if __name__ == "__main__":
    main()
