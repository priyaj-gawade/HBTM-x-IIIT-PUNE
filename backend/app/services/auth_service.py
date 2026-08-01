"""Auth Service - signup, login, and user retrieval."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest, UserResponse
from app.utils.exceptions import DuplicateEmailError, InvalidCredentialsError
from app.utils.security import create_access_token, hash_password, verify_password

logger = logging.getLogger(__name__)


async def signup(db: AsyncSession, data: SignupRequest) -> AuthResponse:
    """Register a new user and return JWT token."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise DuplicateEmailError("Email already registered")

    # Create user
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Generate token
    token = create_access_token(str(user.id))

    # Log without PII
    logger.info(f"New user registered: user_id={user.id}")
    return AuthResponse(token=token, user_id=str(user.id))

async def login(db: AsyncSession, data: LoginRequest) -> AuthResponse:
    """Authenticate user and return JWT token."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise InvalidCredentialsError("Invalid email or password")

    token = create_access_token(str(user.id))

    # Log without PII
    logger.info(f"User logged in: user_id={user.id}")
    return AuthResponse(token=token, user_id=str(user.id))

async def get_me(user: User) -> UserResponse:
    """Return current user profile."""
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        created_at=user.created_at,
    )
