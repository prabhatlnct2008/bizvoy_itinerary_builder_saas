"""
Dashboard API endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import List

from app.core.deps import get_db, get_current_user, get_current_agency_id
from app.models.user import User
from app.models.itinerary import Itinerary
from app.models.template import Template
from app.models.activity import Activity
from app.models.share import ShareLink
from pydantic import BaseModel

router = APIRouter()


class DashboardStats(BaseModel):
    total_itineraries: int
    draft_itineraries: int
    sent_itineraries: int
    confirmed_itineraries: int
    total_templates: int
    total_activities: int
    total_share_links: int
    total_views: int


class ItineraryStatusCount(BaseModel):
    status: str
    count: int


class RecentItinerary(BaseModel):
    id: str
    trip_name: str
    client_name: str
    destination: str
    start_date: str
    status: str
    total_price: float | None


class RecentActivity(BaseModel):
    id: str
    name: str
    category_label: str | None
    location_display: str | None
    is_active: bool


class DashboardOverview(BaseModel):
    stats: DashboardStats
    status_breakdown: List[ItineraryStatusCount]
    recent_itineraries: List[RecentItinerary]
    recent_activities: List[RecentActivity]


@router.get("/stats", response_model=DashboardOverview)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agency_id: str = Depends(get_current_agency_id),
):
    """
    Get dashboard statistics and overview data.
    """
    # Get itinerary counts by status
    itinerary_counts = (
        db.query(Itinerary.status, func.count(Itinerary.id))
        .filter(Itinerary.agency_id == agency_id)
        .group_by(Itinerary.status)
        .all()
    )

    status_map = {status.value: count for status, count in itinerary_counts}
    total_itineraries = sum(status_map.values())

    # Get total templates
    total_templates = (
        db.query(func.count(Template.id))
        .filter(Template.agency_id == agency_id)
        .scalar() or 0
    )

    # Get total activities
    total_activities = (
        db.query(func.count(Activity.id))
        .filter(Activity.agency_id == agency_id)
        .scalar() or 0
    )

    # Get share link stats
    share_links = (
        db.query(ShareLink)
        .join(Itinerary)
        .filter(Itinerary.agency_id == agency_id)
        .all()
    )

    total_share_links = len(share_links)
    total_views = sum(link.view_count for link in share_links)

    # Build stats
    stats = DashboardStats(
        total_itineraries=total_itineraries,
        draft_itineraries=status_map.get('draft', 0),
        sent_itineraries=status_map.get('sent', 0),
        confirmed_itineraries=status_map.get('confirmed', 0),
        total_templates=total_templates,
        total_activities=total_activities,
        total_share_links=total_share_links,
        total_views=total_views,
    )

    # Build status breakdown
    status_breakdown = [
        ItineraryStatusCount(status=status, count=count)
        for status, count in status_map.items()
    ]

    # Get recent itineraries
    recent_itineraries_query = (
        db.query(Itinerary)
        .filter(Itinerary.agency_id == agency_id)
        .order_by(Itinerary.updated_at.desc())
        .limit(5)
        .all()
    )

    recent_itineraries = [
        RecentItinerary(
            id=itin.id,
            trip_name=itin.trip_name,
            client_name=itin.client_name,
            destination=itin.destination,
            start_date=itin.start_date.isoformat(),
            status=itin.status.value,
            total_price=float(itin.total_price) if itin.total_price else None,
        )
        for itin in recent_itineraries_query
    ]

    # Get recent activities
    recent_activities_query = (
        db.query(Activity)
        .filter(Activity.agency_id == agency_id)
        .order_by(Activity.updated_at.desc())
        .limit(5)
        .all()
    )

    recent_activities = [
        RecentActivity(
            id=act.id,
            name=act.name,
            category_label=act.category_label,
            location_display=act.location_display,
            is_active=act.is_active,
        )
        for act in recent_activities_query
    ]

    return DashboardOverview(
        stats=stats,
        status_breakdown=status_breakdown,
        recent_itineraries=recent_itineraries,
        recent_activities=recent_activities,
    )
