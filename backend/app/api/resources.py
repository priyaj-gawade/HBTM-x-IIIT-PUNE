"""Resources API routes.

Endpoints:
    GET /api/resources — Search/filter curated resources
"""

from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.schemas.resources import ResourceResponse
from app.services.resource_service import resource_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/resources", tags=["Resources"])


@router.get("", response_model=List[ResourceResponse])
async def get_resources(
    type: Optional[str] = Query(None, description="Filter by resource type"),
    goal: Optional[str] = Query(None, description="Filter by goal keyword"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    limit: int = Query(20, ge=1, le=100, description="Max number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search and filter curated resources with pagination.

    Query params: type, goal, difficulty, limit, offset
    Response: List of resources
    """
    return await resource_service.search_resources(
        db, current_user, type_filter=type, goal=goal, difficulty=difficulty, limit=limit, offset=offset
    )
