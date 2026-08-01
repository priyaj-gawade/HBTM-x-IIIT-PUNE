"""Auth Service - signup, login, and user retrieval."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest, UserResponse
from app.utils.exceptions import DuplicateEmailError, InvalidCredentialsError
from app.utils.security import create_access_token, hash_password, verify_password

import httpx

logger = logging.getLogger(__name__)


class AuthService:
    """Business logic for authentication."""

    async def signup(self, db: AsyncSession, data: SignupRequest) -> AuthResponse:
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

    async def login(self, db: AsyncSession, data: LoginRequest) -> AuthResponse:
        """Authenticate user and return JWT token."""
        result = await db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password")

        token = create_access_token(str(user.id))

        # Log without PII
        logger.info(f"User logged in: user_id={user.id}")
        return AuthResponse(token=token, user_id=str(user.id))

    async def google_login(self, db: AsyncSession, access_token: str) -> AuthResponse:
        """Authenticate user via Google access token, auto-register if missing."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if resp.status_code != 200:
                raise InvalidCredentialsError("Invalid Google access token")
            
            user_info = resp.json()
            email = user_info.get("email")
            name = user_info.get("name", "Google User")

            if not email:
                raise InvalidCredentialsError("Google account has no email")

        # Find or create user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                name=name,
                email=email,
                password_hash=hash_password(access_token[:32]), # Randomish hash for oauth users
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            logger.info(f"New Google user registered: user_id={user.id}")

        token = create_access_token(str(user.id))
        logger.info(f"Google user logged in: user_id={user.id}")
        return AuthResponse(token=token, user_id=str(user.id))

    async def get_me(self, user: User) -> UserResponse:
        """Return current user profile."""
        return UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            created_at=user.created_at,
        )


# Singleton instance
auth_service = AuthService()
