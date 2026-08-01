"""Resource Service - search and filter curated resources with pagination."""

import logging
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.curated_resource import CuratedResource
from app.models.user import User
from app.schemas.resources import ResourceResponse

logger = logging.getLogger(__name__)


class ResourceService:
    """Business logic for searching/filtering curated resources."""

    async def search_resources(
        self,
        db: AsyncSession,
        user: User,
        type_filter: Optional[str] = None,
        goal: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[ResourceResponse]:
        """
        Filter curated_resources by type and title with pagination.
        """
        query = select(CuratedResource).where(CuratedResource.user_id == user.id)

        if type_filter:
            query = query.where(CuratedResource.type == type_filter)

        if goal:
            # Safe SQL string search escape
            safe_goal = goal.replace("%", "\\%").replace("_", "\\_")
            query = query.where(CuratedResource.title.ilike(f"%{safe_goal}%"))

        if difficulty:
            logger.warning("difficulty filter parameter requested but not yet modeled in database")

        # Order by most recent and paginate
        query = query.order_by(CuratedResource.created_at.desc()).limit(limit).offset(offset)

        result = await db.execute(query)
        resources = result.scalars().all()

        return [
            ResourceResponse(
                id=str(r.id),
                title=r.title,
                type=r.type,
                url=r.url,
                reason=r.reason,
                created_at=r.created_at,
            )
            for r in resources
        ]


# Singleton instance
resource_service = ResourceService()
