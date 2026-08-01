from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProfileCreate(BaseModel):
    """POST /api/profile - save onboarding."""
    goal: str
    learning_style: str
    experience: str
    daily_time: str
    motivation: str
    current_level: str


class ProfileUpdate(BaseModel):
    """PATCH /api/profile - partial update."""
    goal: Optional[str] = None
    learning_style: Optional[str] = None
    experience: Optional[str] = None
    daily_time: Optional[str] = None
    motivation: Optional[str] = None
    current_level: Optional[str] = None


class ProfileResponse(BaseModel):
    """GET /api/profile - return Growth Blueprint."""
    id: str
    user_id: str
    goal: Optional[str] = None
    learning_style: Optional[str] = None
    experience: Optional[str] = None
    daily_time: Optional[str] = None
    motivation: Optional[str] = None
    current_level: Optional[str] = None
    growth_blueprint: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
