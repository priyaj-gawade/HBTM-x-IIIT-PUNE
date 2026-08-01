from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class MissionDetail(BaseModel):
    """A single mission item."""
    title: str
    description: str
    priority: str = "medium"


class InsightItem(BaseModel):
    """A single AI insight."""
    text: str
    category: str = "general"


class DashboardResponse(BaseModel):
    """GET /api/dashboard response."""
    growth_score: int
    today_focus: str
    streak: int
    mission: Dict[str, Any]
    insights: List[Dict[str, Any]]
