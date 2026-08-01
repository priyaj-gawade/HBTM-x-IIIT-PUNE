from pydantic import BaseModel


class ProgressResponse(BaseModel):
    """GET /api/progress response."""
    growth_score: int
    streak: int
    completed: int
