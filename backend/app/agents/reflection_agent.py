"""Reflection Agent - Processes nightly reflections and generates insights."""

import json
import logging
from typing import Any, Dict

from app.prompts.reflection_prompts import REFLECTION_SYSTEM_PROMPT, REFLECTION_USER_PROMPT
from app.utils.llm_manager import llm_manager

logger = logging.getLogger(__name__)


class ReflectionAgent:
    """
    Reflection Agent - Night reflection processing.

    Input: User's mood + journal entry + historical reflections (from pgvector)
    Process: Analyzes reflection, updates growth understanding, plans tomorrow
    Output: { summary, next_day_focus }
    Stores reflection embedding for future context.
    """

    def __init__(self):
        self.model_name = "gemini-3.1-flash-lite"
        self.generation_config = {
            "temperature": 0.7,
            "response_mime_type": "application/json",
        }

    async def process_reflection(
        self,
        mood: str,
        journal: str,
        goal: str = "",
        current_level: str = "",
        streak: int = 0,
        reflection_history: str = "",
        memory_context: str = "",
    ) -> Dict[str, Any]:
        """Process a nightly reflection and generate insights."""
        try:
            prompt = REFLECTION_USER_PROMPT.format(
                mood=mood,
                journal=journal,
                goal=goal or "Not specified",
                current_level=current_level or "Not specified",
                streak=streak,
                reflection_history=reflection_history or "No previous reflections",
                memory_context=f"Relevant memories:\n{memory_context}" if memory_context else "",
            )

            # Async non-blocking call via rotational LLM manager
            response = await llm_manager.generate_content_async(
                prompt=prompt,
                model_name=self.model_name,
                system_instruction=REFLECTION_SYSTEM_PROMPT,
                generation_config=self.generation_config,
            )
            from app.utils.llm_manager import parse_json_guarded
            result = parse_json_guarded(response.text)

            logger.info("Reflection Agent processed reflection successfully")
            return result

        except json.JSONDecodeError:
            logger.error("Reflection Agent: Failed to parse JSON response")
            return self._fallback_reflection(mood, journal)
        except Exception as e:
            logger.error(f"Reflection Agent error: {e}")
            return self._fallback_reflection(mood, journal)

    def _fallback_reflection(self, mood: str, journal: str) -> Dict[str, Any]:
        """Return fallback reflection if AI generation fails."""
        return {
            "summary": f"You reflected with a {mood} mood today. Taking time to reflect shows real commitment to your growth journey. Keep building this habit of self-awareness.",
            "next_day_focus": "Continue building on today's momentum. Focus on one small improvement that will compound over time.",
        }


# Singleton instance
reflection_agent = ReflectionAgent()
