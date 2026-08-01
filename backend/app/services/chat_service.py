"""Chat Service - AI-powered conversational support."""

import logging

import google.generativeai as genai
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.habit import Habit
from app.models.profile import Profile
from app.models.reflection import Reflection
from app.models.user import User
from app.prompts.chat_prompts import CHAT_SYSTEM_PROMPT, CHAT_USER_PROMPT
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class ChatService:
    """Business logic for AI chat conversations."""

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=CHAT_SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(
                temperature=0.8,
            ),
        )

    async def chat(
        self, db: AsyncSession, user: User, data: ChatRequest
    ) -> ChatResponse:
        """
        Retrieve relevant memories via pgvector, send enriched prompt
        to Gemini, return reply.
        """
        # Get user profile
        result = await db.execute(
            select(Profile).where(Profile.user_id == user.id)
        )
        profile = result.scalar_one_or_none()

        # Get streak
        habit_result = await db.execute(
            select(Habit).where(Habit.user_id == user.id).limit(1)
        )
        habit = habit_result.scalar_one_or_none()
        streak = habit.current_streak if habit else 0

        # Get recent mood
        reflection_result = await db.execute(
            select(Reflection)
            .where(Reflection.user_id == user.id)
            .order_by(Reflection.created_at.desc())
            .limit(1)
        )
        last_reflection = reflection_result.scalar_one_or_none()
        recent_mood = last_reflection.mood if last_reflection else "neutral"

        # Get memory context from pgvector
        memory_context = ""
        try:
            memories = await embedding_service.search_similar(
                db, user.id, data.message, limit=5
            )
            if memories:
                memory_context = "Relevant user history:\n" + "\n".join(
                    [f"- {m}" for m in memories]
                )
        except Exception as e:
            logger.warning(f"Memory retrieval for chat failed, continuing: {e}")

        try:
            prompt = CHAT_USER_PROMPT.format(
                goal=profile.goal if profile else "Not specified",
                current_level=profile.current_level if profile else "Not specified",
                streak=streak,
                recent_mood=recent_mood,
                memory_context=memory_context,
                message=data.message,
            )

            # Async call with 30s timeout
            response = await self.model.generate_content_async(
                prompt,
                request_options={"timeout": 30},
            )
            reply = response.text

            # Store chat in embeddings for future context
            chat_text = f"User: {data.message}\nAssistant: {reply}"
            await embedding_service.create_embedding(
                db, user.id, chat_text, content_type="chat"
            )

            logger.info(f"Chat response generated for user_id={user.id}")
            return ChatResponse(reply=reply)

        except Exception as e:
            logger.error(f"Chat error: {e}")
            return ChatResponse(
                reply="I'm having trouble connecting right now. Please try again in a moment. Remember, consistency is key to growth!"
            )


# Singleton instance
chat_service = ChatService()
