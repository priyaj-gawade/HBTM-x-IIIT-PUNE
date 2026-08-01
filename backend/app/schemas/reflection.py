from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReflectionCreate(BaseModel):
    """POST /api/reflection request body."""
    mood: str
    journal: str


class ReflectionResponse(BaseModel):
    """POST /api/reflection response."""
    summary: str
    next_day_focus: str


class ReflectionHistoryItem(BaseModel):
    """A single reflection entry for history."""
    id: str
    mood: str
    journal: str
    summary: Optional[str] = None
    next_day_focus: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
