from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class CurateRequest(BaseModel):
    """POST /api/curator/generate request body."""
    goal: str


class CuratedResourceItem(BaseModel):
    """A single curated resource."""
    title: str
    type: str  # youtube, article, book, podcast, challenge
    reason: str
    url: Optional[str] = None


class CurateResponse(BaseModel):
    """POST /api/curator/generate response."""
    today_plan: Dict[str, Any]
    resources: List[CuratedResourceItem]
