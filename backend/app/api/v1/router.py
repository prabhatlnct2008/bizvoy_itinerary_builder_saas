from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, roles, activity_types, activities,
    templates, itineraries, share, public, websocket,
    company_profile, dashboard
)

api_router = APIRouter()

# Auth endpoints (no prefix, directly under /api/v1/auth/...)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Dashboard endpoints
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])

# User endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Role endpoints
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])

# Activity endpoints
api_router.include_router(activity_types.router, prefix="/activity-types", tags=["activity-types"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])

# Template endpoints
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])

# Itinerary endpoints
api_router.include_router(itineraries.router, prefix="/itineraries", tags=["itineraries"])

# Share endpoints
api_router.include_router(share.router, prefix="/itineraries", tags=["share"])

# Company Profile endpoints
api_router.include_router(company_profile.router, prefix="/company-profile", tags=["company-profile"])

# Public endpoints (no auth required)
api_router.include_router(public.router, prefix="/public", tags=["public"])

# WebSocket endpoints
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
