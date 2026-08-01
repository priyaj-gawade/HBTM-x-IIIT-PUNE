"""Progress Service - calculates growth metrics."""

import logging

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.habit import Habit
from app.models.reflection import Reflection
from app.models.user import User
from app.models.profile import Profile
from app.schemas.progress import ProgressResponse
from app.utils.growth_score import calculate_growth_score

logger = logging.getLogger(__name__)


class ProgressService:
    """Business logic for progress tracking."""

    async def get_progress(
        self, db: AsyncSession, user: User
    ) -> ProgressResponse:
        """Calculate growth_score, streak, and completed count."""
        # Get max streak
        streak_result = await db.execute(
            select(func.max(Habit.current_streak)).where(Habit.user_id == user.id)
        )
        streak = streak_result.scalar() or 0

        # Count completed reflections
        completed_result = await db.execute(
            select(func.count(Reflection.id)).where(Reflection.user_id == user.id)
        )
        completed = completed_result.scalar() or 0

        # Check profile
        profile_result = await db.execute(
            select(Profile.id).where(Profile.user_id == user.id)
        )
        has_profile = profile_result.scalar_one_or_none() is not None

        # Calculate growth score using centralized utility
        growth_score = calculate_growth_score(streak, completed, profile_completed=has_profile)

        return ProgressResponse(
            growth_score=growth_score,
            streak=streak,
            completed=completed,
        )


# Singleton instance
progress_service = ProgressService()
