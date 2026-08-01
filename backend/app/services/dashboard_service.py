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


from typing import Optional
from app.models.workspace import Workspace

class DashboardService:
    """Business logic for the dashboard endpoint."""

    async def get_dashboard(
        self, db: AsyncSession, user: Optional[User] = None
    ) -> DashboardResponse:
        """
        Aggregate growth_score, streak, today_focus, mission, insights
        from DB and Growth Planner Agent using Profile or Workspace.
        """
        profile = None
        user_id = user.id if user else None
        
        if user_id:
            # Get user profile
            result = await db.execute(
                select(Profile).where(Profile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()

        # Look for active/latest workspace in DB
        workspace = None
        if user_id:
            ws_result = await db.execute(
                select(Workspace).where(Workspace.user_id == user_id).order_by(Workspace.updated_at.desc())
            )
            workspace = ws_result.scalars().first()
        
        if not workspace:
            ws_result = await db.execute(
                select(Workspace).order_by(Workspace.updated_at.desc())
            )
            workspace = ws_result.scalars().first()

        if not profile and not workspace:
            from app.utils.exceptions import ProfileNotFoundError
            raise ProfileNotFoundError("Workspace not created. Please complete the interview.")

        streak = 0
        completed_reflections = 0
        last_reflection = None
        memory_context = ""

        if user_id:
            # Get streak from habits
            habit_result = await db.execute(
                select(func.max(Habit.current_streak)).where(Habit.user_id == user_id)
            )
            streak = habit_result.scalar() or 0

            # Count total completed reflections for growth score
            count_result = await db.execute(
                select(func.count(Reflection.id)).where(Reflection.user_id == user_id)
            )
            completed_reflections = count_result.scalar() or 0

            # Get last reflection
            reflection_result = await db.execute(
                select(Reflection)
                .where(Reflection.user_id == user_id)
                .order_by(Reflection.created_at.desc())
                .limit(1)
            )
            last_reflection = reflection_result.scalar_one_or_none()

            # Get memory context from pgvector
            try:
                memories = await embedding_service.search_similar(
                    db, user_id, profile.goal if profile else "personal growth", limit=3
                )
                if memories:
                    memory_context = "\n".join(memories)
            except Exception as e:
                logger.warning(f"Memory retrieval failed for dashboard, continuing without context: {e}")

        # Derive goal, learning style, and blueprint from Profile or Workspace
        ws_data = workspace.data if workspace and isinstance(workspace.data, dict) else {}
        goal = profile.goal if profile else (ws_data.get("subject") or workspace.title if workspace else "Computer Science Mastery")
        learning_style = profile.learning_style if profile else (ws_data.get("traits", ["Visual", "Hands-on"])[0] if ws_data.get("traits") else "Visual")
        daily_time = profile.daily_time if profile else "30 min"
        current_level = profile.current_level if profile else (ws_data.get("difficulty") or "Intermediate")
        growth_blueprint = profile.growth_blueprint if profile else (ws_data.get("summary") or "")
        today_focus_default = ws_data.get("activeLearningContext") or goal

        # Generate daily plan using Growth Planner Agent
        try:
            plan = await planner_agent.generate_daily_plan(
                goal=goal,
                learning_style=learning_style,
                daily_time=daily_time,
                current_level=current_level,
                growth_blueprint=growth_blueprint,
                streak=streak,
                last_mood=last_reflection.mood if last_reflection else "focused",
                last_focus=last_reflection.next_day_focus if last_reflection and last_reflection.next_day_focus else today_focus_default,
                memory_context=memory_context,
            )
        except Exception as e:
            logger.warning(f"Planner agent call failed for dashboard: {e}")
            plan = {
                "growth_score": 60,
                "today_focus": today_focus_default,
                "mission": {
                    "title": f"Master {today_focus_default}",
                    "description": f"Targeted deep dive into {today_focus_default} foundations and practical applications.",
                    "estimated_minutes": 25,
                    "difficulty": current_level
                },
                "insights": [
                    {"type": "strength", "title": "Focused Flow", "description": "High engagement on key foundational concepts."},
                    {"type": "challenge", "title": "Active Retrieval", "description": "Reinforce knowledge through spaced repetition flashcards."}
                ]
            }

        calculated_score = calculate_growth_score(streak, completed_reflections, profile_completed=(profile is not None or workspace is not None))
        progress_val = ws_data.get("progress", calculated_score)

        return DashboardResponse(
            growth_score=plan.get("growth_score", progress_val),
            today_focus=plan.get("today_focus", today_focus_default),
            streak=streak,
            mission=plan.get("mission", {}),
            insights=plan.get("insights", []),
        )


# Singleton instance
dashboard_service = DashboardService()
