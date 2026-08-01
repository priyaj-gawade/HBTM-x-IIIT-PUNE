"""Chat API routes.

Endpoints:
    POST /api/chat — AI-powered conversational support
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    AI-powered growth conversation.

    Request: { "message": "Help me stay consistent" }
    Response: { "reply": "..." }
    """
    return await chat_service.chat(db, current_user, data)
