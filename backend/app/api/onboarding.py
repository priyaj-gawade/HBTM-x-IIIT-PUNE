"""Onboarding/Profile API routes.

Endpoints:
    POST  /api/profile  — Save onboarding, triggers Identity Agent
    GET   /api/profile  — Return Growth Blueprint
    PATCH /api/profile  — Update profile
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileResponse, ProfileUpdate
from app.services.profile_service import profile_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.post("", response_model=ProfileResponse)
async def create_profile(
    data: ProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save onboarding answers and generate Growth Blueprint via Identity Agent.

    Request: { "goal": "", "learning_style": "", "experience": "", "daily_time": "", "motivation": "", "current_level": "" }
    Response: Full profile with growth_blueprint
    """
    return await profile_service.create_profile(db, current_user, data)


@router.get("", response_model=ProfileResponse)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the user's profile with Growth Blueprint.
    """
    return await profile_service.get_profile(db, current_user)


@router.patch("", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Partially update the user's profile.
    """
    return await profile_service.update_profile(db, current_user, data)
