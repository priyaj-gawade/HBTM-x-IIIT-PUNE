"""Dashboard API routes.

Endpoints:
    GET /api/dashboard — Returns growth_score, today_focus, streak, mission, insights
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import dashboard_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get dashboard data with AI-generated daily plan.

    Response: {
        "growth_score": 84,
        "today_focus": "Deep Work",
        "streak": 11,
        "mission": {},
        "insights": []
    }
    """
    return await dashboard_service.get_dashboard(db, current_user)
