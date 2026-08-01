from typing import Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    """POST /api/chat request body."""
    message: str
    roadmap_context: Optional[str] = None


class ChatResponse(BaseModel):
    """POST /api/chat response."""
    reply: str
