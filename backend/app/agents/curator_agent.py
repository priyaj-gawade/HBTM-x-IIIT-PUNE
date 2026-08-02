"""Curator Agent - Curate My Day: generates personalized learning resources."""

import json
import logging
from typing import Any, Dict

from app.prompts.curator_prompts import CURATOR_SYSTEM_PROMPT, CURATOR_USER_PROMPT
from app.utils.llm_manager import llm_manager

logger = logging.getLogger(__name__)


class CuratorAgent:
    """
    Curator Agent - "Curate My Day" button.

    Input: User's goal + profile + recent activity (from pgvector memory)
    Process: Generates personalized learning resources with reasoning
    Output: { today_plan, resources[{ title, type, url, reason }] }
    Resource types: youtube, article, book, podcast, challenge
    """

    def __init__(self):
        self.model_name = "gemini-3.1-flash-lite"
        self.generation_config = {
            "temperature": 0.8,
            "response_mime_type": "application/json",
        }

    async def curate_resources(
        self,
        goal: str,
        learning_style: str = "",
        current_level: str = "",
        daily_time: str = "",
        growth_blueprint: str = "",
        memory_context: str = "",
    ) -> Dict[str, Any]:
        """Generate curated daily learning resources."""
        try:
            prompt = CURATOR_USER_PROMPT.format(
                goal=goal,
                learning_style=learning_style or "visual",
                current_level=current_level or "beginner",
                daily_time=daily_time or "1 hour",
                growth_blueprint=growth_blueprint or "Not yet generated",
                memory_context=f"Relevant memories:\n{memory_context}" if memory_context else "",
            )

            # Async non-blocking call via rotational LLM manager
            response = await llm_manager.generate_content_async(
                prompt=prompt,
                model_name=self.model_name,
                system_instruction=CURATOR_SYSTEM_PROMPT,
                generation_config=self.generation_config,
            )
            from app.utils.llm_manager import parse_json_guarded
            curation = parse_json_guarded(response.text)

            logger.info("Curator Agent generated resources successfully")
            return curation

        except json.JSONDecodeError:
            logger.error("Curator Agent: Failed to parse JSON response")
            return self._fallback_curation(goal)
        except Exception as e:
            logger.error(f"Curator Agent error: {e}")
            return self._fallback_curation(goal)

    def _fallback_curation(self, goal: str) -> Dict[str, Any]:
        """Return fallback resources if AI generation fails."""
        return {
            "today_plan": {
                "theme": f"Getting started with {goal}",
                "focus_area": "Foundation building",
                "estimated_total_time": "1.5 hours",
                "learning_objective": f"Build a solid foundation for {goal}",
            },
            "resources": [
                {
                    "title": f"Introduction to {goal} - Getting Started",
                    "type": "youtube",
                    "url": "",
                    "reason": "A comprehensive intro video to set the foundation.",
                },
                {
                    "title": f"The Beginner's Guide to {goal}",
                    "type": "article",
                    "url": "",
                    "reason": "Covers the fundamental concepts you need.",
                },
                {
                    "title": f"Mastering {goal}: A Complete Guide",
                    "type": "book",
                    "url": "",
                    "reason": "A deep-dive reference for ongoing learning.",
                },
                {
                    "title": f"{goal} Insights Podcast",
                    "type": "podcast",
                    "url": "",
                    "reason": "Learn from practitioners during your commute.",
                },
                {
                    "title": f"30-Minute {goal} Challenge",
                    "type": "challenge",
                    "url": "",
                    "reason": "Hands-on practice to cement today's learning.",
                },
            ],
        }


# Singleton instance
curator_agent = CuratorAgent()
