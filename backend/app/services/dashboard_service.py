"""Dashboard Service - aggregates data for the dashboard view."""

import logging

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.planner_agent import planner_agent
from app.models.habit import Habit
from app.models.profile import Profile
from app.models.reflection import Reflection
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.services.embedding_service import embedding_service
from app.utils.growth_score import calculate_growth_score

logger = logging.getLogger(__name__)


class DashboardService:
    """Business logic for the dashboard endpoint."""

    async def get_dashboard(
        self, db: AsyncSession, user: User
    ) -> DashboardResponse:
        """
        Aggregate growth_score, streak, today_focus, mission, insights
        from DB and Growth Planner Agent.
        """
        # Get user profile
        result = await db.execute(
            select(Profile).where(Profile.user_id == user.id)
        )
        profile = result.scalar_one_or_none()

        if not profile:
            from app.utils.exceptions import ProfileNotFoundError
            raise ProfileNotFoundError("Workspace not created. Please complete the interview.")

        # Get streak from habits
        habit_result = await db.execute(
            select(func.max(Habit.current_streak)).where(Habit.user_id == user.id)
        )
        streak = habit_result.scalar() or 0

        # Count total completed reflections for growth score
        count_result = await db.execute(
            select(func.count(Reflection.id)).where(Reflection.user_id == user.id)
        )
        completed_reflections = count_result.scalar() or 0

        # Get last reflection
        reflection_result = await db.execute(
            select(Reflection)
            .where(Reflection.user_id == user.id)
            .order_by(Reflection.created_at.desc())
            .limit(1)
        )
        last_reflection = reflection_result.scalar_one_or_none()

        # Get memory context from pgvector
        memory_context = ""
        try:
            memories = await embedding_service.search_similar(
                db, user.id, profile.goal if profile else "personal growth", limit=3
            )
            if memories:
                memory_context = "\n".join(memories)
        except Exception as e:
            logger.warning(f"Memory retrieval failed for dashboard, continuing without context: {e}")

        # Generate daily plan using Growth Planner Agent
        plan = await planner_agent.generate_daily_plan(
            goal=profile.goal if profile else "personal growth",
            learning_style=profile.learning_style if profile else "visual",
            daily_time=profile.daily_time if profile else "30 min",
            current_level=profile.current_level if profile else "beginner",
            growth_blueprint=profile.growth_blueprint if profile else "",
            streak=streak,
            last_mood=last_reflection.mood if last_reflection else "neutral",
            last_focus=last_reflection.next_day_focus if last_reflection and last_reflection.next_day_focus else "general growth",
            memory_context=memory_context,
        )

        calculated_score = calculate_growth_score(streak, completed_reflections, profile_completed=profile is not None)

        return DashboardResponse(
            growth_score=plan.get("growth_score", calculated_score),
            today_focus=plan.get("today_focus", "Deep Work"),
            streak=streak,
            mission=plan.get("mission", {}),
            insights=plan.get("insights", []),
        )


# Singleton instance
dashboard_service = DashboardService()
