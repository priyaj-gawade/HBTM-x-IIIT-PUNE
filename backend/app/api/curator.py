"""Curator API routes.

Endpoints:
    POST /api/curator/generate — Curate My Day
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.schemas.curator import CurateRequest, CurateResponse
from app.services.curator_service import curator_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/curator", tags=["Curator"])


@router.post("/generate", response_model=CurateResponse)
async def generate_curation(
    data: CurateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate curated daily learning resources via Curator Agent.

    Request: { "goal": "Become AI Engineer" }
    Response: {
        "today_plan": {},
        "resources": [
            { "title": "", "type": "youtube", "reason": "" }
        ]
    }
    """
    return await curator_service.generate_curation(db, current_user, data)
