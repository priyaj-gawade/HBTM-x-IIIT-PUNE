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


from typing import Optional
from app.models.workspace import Workspace

class ProgressService:
    """Business logic for progress tracking."""

    async def get_progress(
        self, db: AsyncSession, user: Optional[User] = None
    ) -> ProgressResponse:
        """Calculate growth_score, streak, and completed count."""
        streak = 0
        completed = 0
        has_profile = False
        user_id = user.id if user else None

        if user_id:
            # Get max streak
            streak_result = await db.execute(
                select(func.max(Habit.current_streak)).where(Habit.user_id == user_id)
            )
            streak = streak_result.scalar() or 0

            # Count completed reflections
            completed_result = await db.execute(
                select(func.count(Reflection.id)).where(Reflection.user_id == user_id)
            )
            completed = completed_result.scalar() or 0

            # Check profile
            profile_result = await db.execute(
                select(Profile.id).where(Profile.user_id == user_id)
            )
            has_profile = profile_result.scalar_one_or_none() is not None

        # Check for workspace if no profile
        progress_val = None
        if not has_profile:
            ws_query = select(Workspace)
            if user_id:
                ws_query = ws_query.where(Workspace.user_id == user_id)
            ws_res = await db.execute(ws_query.order_by(Workspace.updated_at.desc()))
            ws = ws_res.scalars().first()
            if ws and isinstance(ws.data, dict):
                has_profile = True
                progress_val = ws.data.get("progress")

        # Calculate growth score using centralized utility
        growth_score = progress_val if progress_val is not None else calculate_growth_score(streak, completed, profile_completed=has_profile)

        return ProgressResponse(
            growth_score=growth_score,
            streak=streak,
            completed=completed,
        )


# Singleton instance
progress_service = ProgressService()
