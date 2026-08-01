"""Curator Service - generates and saves curated daily resources."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.curator_agent import curator_agent
from app.models.curated_resource import CuratedResource
from app.models.profile import Profile
from app.models.user import User
from app.schemas.curator import CurateRequest, CurateResponse, CuratedResourceItem
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class CuratorService:
    """Business logic for the Curate My Day feature."""

    async def generate_curation(
        self, db: AsyncSession, user: User, data: CurateRequest
    ) -> CurateResponse:
        """
        Call Curator Agent, save resources to DB, return plan + resources.
        """
        # Get user profile for context
        result = await db.execute(
            select(Profile).where(Profile.user_id == user.id)
        )
        profile = result.scalar_one_or_none()

        # Get memory context from pgvector
        memory_context = ""
        try:
            memories = await embedding_service.search_similar(
                db, user.id, data.goal, limit=3
            )
            if memories:
                memory_context = "\n".join(memories)
        except Exception as e:
            logger.warning(f"Memory retrieval failed for curator, continuing: {e}")

        # Generate curated resources using Curator Agent
        curation = await curator_agent.curate_resources(
            goal=data.goal,
            learning_style=profile.learning_style if profile else "",
            current_level=profile.current_level if profile else "",
            daily_time=profile.daily_time if profile else "",
            growth_blueprint=profile.growth_blueprint if profile else "",
            memory_context=memory_context,
        )

        # Save resources to database
        resources = curation.get("resources", [])
        for resource_data in resources:
            resource = CuratedResource(
                user_id=user.id,
                title=resource_data.get("title", ""),
                type=resource_data.get("type", "article"),
                url=resource_data.get("url", ""),
                reason=resource_data.get("reason", ""),
            )
            db.add(resource)

        await db.commit()

        logger.info(f"Curated {len(resources)} resources for user_id={user.id}")

        return CurateResponse(
            today_plan=curation.get("today_plan", {}),
            resources=[
                CuratedResourceItem(
                    title=r.get("title", ""),
                    type=r.get("type", "article"),
                    reason=r.get("reason", ""),
                    url=r.get("url", ""),
                )
                for r in resources
            ],
        )


# Singleton instance
curator_service = CuratorService()
