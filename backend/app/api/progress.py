"""Progress API routes.

Endpoints:
    GET /api/progress — Returns growth_score, streak, completed
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.schemas.progress import ProgressResponse
from app.services.progress_service import progress_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/progress", tags=["Progress"])


@router.get("", response_model=ProgressResponse)
async def get_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get user progress metrics.

    Response: {
        "growth_score": 82,
        "streak": 14,
        "completed": 8
    }
    """
    return await progress_service.get_progress(db, current_user)
