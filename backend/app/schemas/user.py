from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str
    is_superuser: Optional[bool] = False
    is_active: Optional[bool] = True
    role_ids: Optional[List[str]] = []


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    role_ids: Optional[List[str]] = None


class UserResponse(UserBase):
    id: str
    agency_id: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserWithRolesResponse(UserResponse):
    roles: List[str] = []  # List of role names

    class Config:
        from_attributes = True
