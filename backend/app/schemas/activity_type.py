from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Request Schemas
class ActivityTypeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Activity type name")
    description: Optional[str] = Field(None, description="Optional description")
    icon: Optional[str] = Field(None, max_length=50, description="Icon name (e.g., bed, utensils, compass, car)")


class ActivityTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)


# Response Schemas
class ActivityTypeResponse(BaseModel):
    id: str
    agency_id: str
    name: str
    description: Optional[str]
    icon: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
