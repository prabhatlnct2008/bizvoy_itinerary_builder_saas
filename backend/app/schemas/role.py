from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PermissionResponse(BaseModel):
    id: str
    module: str
    action: str
    codename: str

    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: List[str] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = None


class RoleResponse(RoleBase):
    id: str
    agency_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoleWithPermissionsResponse(RoleResponse):
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True
