"""Auth API routes.

Endpoints:
    POST /api/auth/signup
    POST /api/auth/login
    GET  /api/auth/me
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest, UserResponse
from app.services.auth_service import auth_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/signup", response_model=AuthResponse)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.

    Request: { "name": "", "email": "", "password": "" }
    Response: { "token": "", "user_id": "" }
    """
    return await auth_service.signup(db, data)


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user and return JWT token.

    Request: { "email": "", "password": "" }
    Response: { "token": "", "user_id": "" }
    """
    return await auth_service.login(db, data)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user.

    Response: { "id": "", "name": "", "email": "", "created_at": "" }
    """
    return await auth_service.get_me(current_user)
