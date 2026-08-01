"""Identity Agent - Analyzes onboarding and creates Growth Blueprint."""

import json
import logging
from typing import Any, Dict

import google.generativeai as genai

from app.prompts.identity_prompts import IDENTITY_SYSTEM_PROMPT, IDENTITY_USER_PROMPT
from app.utils.llm_manager import llm_manager

logger = logging.getLogger(__name__)


class IdentityAgent:
    """
    Identity Agent - Triggered after onboarding.

    Input: Onboarding answers (goal, learning_style, experience, daily_time, motivation, current_level)
    Process: Analyzes user's identity profile, creates a Growth Blueprint
    Output: Structured Growth Blueprint (strengths, gaps, recommended path, personality insights)
    Stores onboarding embeddings in pgvector for long-term memory.
    """

    def __init__(self):
        pass

    async def generate_blueprint(
        self,
        goal: str,
        learning_style: str,
        experience: str,
        daily_time: str,
        motivation: str,
        current_level: str,
        memory_context: str = "",
    ) -> Dict[str, Any]:
        """Generate a Growth Blueprint from onboarding data."""
        try:
            prompt = IDENTITY_USER_PROMPT.format(
                goal=goal,
                learning_style=learning_style,
                experience=experience,
                daily_time=daily_time,
                motivation=motivation,
                current_level=current_level,
                memory_context=f"Relevant memories:\n{memory_context}" if memory_context else "",
            )

            # Async non-blocking call via rotational LLM manager
            response = await llm_manager.generate_content_async(
                prompt=prompt,
                system_instruction=IDENTITY_SYSTEM_PROMPT,
                generation_config=genai.GenerationConfig(
                    temperature=0.7,
                    response_mime_type="application/json",
                ),
                request_options={"timeout": 30},
            )
            blueprint = json.loads(response.text)

            logger.info("Identity Agent generated Growth Blueprint successfully")
            return blueprint

        except json.JSONDecodeError:
            logger.error("Identity Agent: Failed to parse JSON response")
            return self._fallback_blueprint(goal, current_level)
        except Exception as e:
            logger.error(f"Identity Agent error: {e}")
            return self._fallback_blueprint(goal, current_level)

    def _fallback_blueprint(self, goal: str, current_level: str) -> Dict[str, Any]:
        """Return a sensible fallback blueprint if AI generation fails."""
        return {
            "strengths": ["Self-awareness", "Commitment to growth", "Willingness to learn"],
            "gaps": ["Need structured learning path", "Consistency building required"],
            "recommended_path": f"Start with foundational skills for {goal}, building up from {current_level} level with daily practice.",
            "personality_insights": "You show strong motivation and readiness for growth. Your willingness to invest in yourself is your greatest asset.",
            "daily_focus_areas": ["Core skill practice", "Reflection", "Resource consumption"],
            "estimated_timeline": "30-90 days for significant progress",
        }


# Singleton instance
identity_agent = IdentityAgent()
