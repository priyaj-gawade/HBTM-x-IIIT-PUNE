"""Reflection API routes.

Endpoints:
    POST /api/reflection — Submit nightly reflection
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.schemas.reflection import ReflectionCreate, ReflectionResponse
from app.services.reflection_service import reflection_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/reflection", tags=["Reflection"])


@router.post("", response_model=ReflectionResponse)
async def create_reflection(
    data: ReflectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a nightly reflection, processed by Reflection Agent.

    Request: { "mood": "happy", "journal": "..." }
    Response: { "summary": "", "next_day_focus": "" }
    """
    return await reflection_service.create_reflection(db, current_user, data)
