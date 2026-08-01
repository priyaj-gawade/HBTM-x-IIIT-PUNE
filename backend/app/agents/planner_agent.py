"""Growth Planner Agent - Generates daily missions and insights."""

import json
import logging
from typing import Any, Dict

import google.generativeai as genai

from app.prompts.planner_prompts import PLANNER_SYSTEM_PROMPT, PLANNER_USER_PROMPT
from app.utils.growth_score import calculate_growth_score

logger = logging.getLogger(__name__)


class PlannerAgent:
    """
    Growth Planner Agent - Generates daily missions and insights.

    Input: User profile + recent reflections + growth history (from pgvector)
    Process: Creates personalized daily focus, missions, and actionable insights
    Output: { today_focus, mission, insights[], growth_score }
    Used by the Dashboard endpoint.
    """

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=PLANNER_SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                response_mime_type="application/json",
            ),
        )

    async def generate_daily_plan(
        self,
        goal: str,
        learning_style: str,
        daily_time: str,
        current_level: str,
        growth_blueprint: str = "",
        streak: int = 0,
        last_mood: str = "neutral",
        last_focus: str = "general growth",
        memory_context: str = "",
    ) -> Dict[str, Any]:
        """Generate a personalized daily growth plan."""
        try:
            prompt = PLANNER_USER_PROMPT.format(
                goal=goal,
                learning_style=learning_style,
                daily_time=daily_time,
                current_level=current_level,
                growth_blueprint=growth_blueprint or "Not yet generated",
                streak=streak,
                last_mood=last_mood,
                last_focus=last_focus,
                memory_context=f"Relevant memories:\n{memory_context}" if memory_context else "",
            )

            # Async non-blocking call with 30s timeout
            response = await self.model.generate_content_async(
                prompt,
                request_options={"timeout": 30},
            )
            plan = json.loads(response.text)

            logger.info("Growth Planner generated daily plan successfully")
            return plan

        except json.JSONDecodeError:
            logger.error("Growth Planner: Failed to parse JSON response")
            return self._fallback_plan(goal, streak)
        except Exception as e:
            logger.error(f"Growth Planner error: {e}")
            return self._fallback_plan(goal, streak)

    def _fallback_plan(self, goal: str, streak: int) -> Dict[str, Any]:
        """Return a sensible fallback plan if AI generation fails."""
        return {
            "today_focus": "Deep Work",
            "mission": {
                "title": f"Continue working toward: {goal}",
                "description": "Focus on deliberate practice today. Review your materials and work on one specific skill.",
                "estimated_time": "30 min",
                "difficulty": "medium",
                "steps": [
                    "Review yesterday's progress",
                    "Pick one skill to practice",
                    "Spend focused time on it",
                    "Reflect on what you learned",
                ],
            },
            "insights": [
                {
                    "text": f"You're on a {streak}-day streak! Consistency is your superpower.",
                    "category": "habit",
                },
                {
                    "text": "Focus on progress, not perfection. Small steps compound.",
                    "category": "mindset",
                },
            ],
            "growth_score": calculate_growth_score(streak, 0),
        }


# Singleton instance
planner_agent = PlannerAgent()
