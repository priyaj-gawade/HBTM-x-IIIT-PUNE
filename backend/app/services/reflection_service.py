"""Reflection Service - processes reflections via Reflection Agent."""

import logging
from datetime import datetime, timezone, date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.reflection_agent import reflection_agent
from app.models.habit import Habit
from app.models.profile import Profile
from app.models.reflection import Reflection as ReflectionModel
from app.models.user import User
from app.schemas.reflection import ReflectionCreate, ReflectionResponse
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class ReflectionService:
    """Business logic for nightly reflection processing."""

    async def create_reflection(
        self, db: AsyncSession, user: User, data: ReflectionCreate
    ) -> ReflectionResponse:
        """
        Save reflection, call Reflection Agent, store embedding,
        return summary + next_day_focus.
        """
        # Get user profile
        result = await db.execute(
            select(Profile).where(Profile.user_id == user.id)
        )
        profile = result.scalar_one_or_none()

        # Get habit for reflection streak
        habit_result = await db.execute(
            select(Habit).where(Habit.user_id == user.id, Habit.habit_name == "Daily Reflection").limit(1)
        )
        habit = habit_result.scalar_one_or_none()
        streak = habit.current_streak if habit else 0

        # Get recent reflection history
        history_result = await db.execute(
            select(ReflectionModel)
            .where(ReflectionModel.user_id == user.id)
            .order_by(ReflectionModel.created_at.desc())
            .limit(5)
        )
        recent_reflections = history_result.scalars().all()
        reflection_history = "\n".join(
            [
                f"- {r.created_at.strftime('%Y-%m-%d')}: Mood={r.mood}, Summary={r.summary or 'N/A'}"
                for r in recent_reflections
            ]
        )

        # Get memory context from pgvector
        memory_context = ""
        try:
            memories = await embedding_service.search_similar(
                db, user.id, data.journal, limit=3
            )
            if memories:
                memory_context = "\n".join(memories)
        except Exception as e:
            logger.warning(f"Memory search failed for reflection, continuing: {e}")

        # Process through Reflection Agent
        agent_result = await reflection_agent.process_reflection(
            mood=data.mood,
            journal=data.journal,
            goal=profile.goal if profile else "",
            current_level=profile.current_level if profile else "",
            streak=streak,
            reflection_history=reflection_history,
            memory_context=memory_context,
        )

        summary = agent_result.get("summary", "")
        next_day_focus = agent_result.get("next_day_focus", "")

        # Save reflection to database
        reflection = ReflectionModel(
            user_id=user.id,
            mood=data.mood,
            journal=data.journal,
            summary=summary,
            next_day_focus=next_day_focus,
        )
        db.add(reflection)

        # Update habit streak with proper date validation
        now = datetime.now(timezone.utc)
        today_date = now.date()

        if habit:
            if habit.last_completed_at:
                last_date = habit.last_completed_at.date()
                if last_date == today_date:
                    pass  # Already reflected today, keep current streak
                elif last_date == today_date - timedelta(days=1):
                    habit.current_streak += 1  # Consecutive day
                    habit.last_completed_at = now
                else:
                    habit.current_streak = 1  # Missed a day, reset streak
                    habit.last_completed_at = now
            else:
                habit.current_streak = 1
                habit.last_completed_at = now
        else:
            new_habit = Habit(
                user_id=user.id,
                habit_name="Daily Reflection",
                frequency="daily",
                current_streak=1,
                completion_rate=100.0,
                last_completed_at=now,
            )
            db.add(new_habit)

        await db.commit()

        # Store reflection as embedding for future context
        reflection_text = f"Mood: {data.mood}. Journal: {data.journal}. Summary: {summary}"
        await embedding_service.create_embedding(
            db, user.id, reflection_text, content_type="reflection"
        )

        logger.info(f"Reflection processed for user_id={user.id}")
        return ReflectionResponse(
            summary=summary,
            next_day_focus=next_day_focus,
        )


# Singleton instance
reflection_service = ReflectionService()
