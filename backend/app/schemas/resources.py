from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ResourceFilter(BaseModel):
    """GET /api/resources query params."""
    type: Optional[str] = None
    goal: Optional[str] = None
    difficulty: Optional[str] = None


class ResourceResponse(BaseModel):
    """A single resource item."""
    id: str
    title: str
    type: str
    url: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
