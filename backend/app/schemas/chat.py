from pydantic import BaseModel


class ChatRequest(BaseModel):
    """POST /api/chat request body."""
    message: str


class ChatResponse(BaseModel):
    """POST /api/chat response."""
    reply: str
