from pydantic import BaseModel
from typing import Dict, Any, Optional
from uuid import UUID

class WorkspaceCreate(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = "New Workspace"
    data: Optional[Dict[str, Any]] = {}

class WorkspaceUpdate(BaseModel):
    title: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class WorkspaceResponse(BaseModel):
    id: str
    user_id: UUID
    title: str
    data: Dict[str, Any]

    class Config:
        from_attributes = True
