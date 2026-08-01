"""Profile Service - onboarding, Growth Blueprint, and profile updates."""

import json
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.identity_agent import identity_agent
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileResponse, ProfileUpdate
from app.services.embedding_service import embedding_service
from app.utils.exceptions import ProfileNotFoundError

logger = logging.getLogger(__name__)


class ProfileService:
    """Business logic for user profiles and onboarding."""

    async def create_profile(
        self, db: AsyncSession, user: User, data: ProfileCreate
    ) -> ProfileResponse:
        """
        Save onboarding answers and trigger Identity Agent to create Growth Blueprint.
        """
        # Check if profile already exists
        result = await db.execute(
            select(Profile).where(Profile.user_id == user.id)
        )
        existing = result.scalar_one_or_none()
        if existing:
            # Update existing profile
            for field, value in data.model_dump().items():
                setattr(existing, field, value)
            profile = existing
        else:
            # Create new profile
            profile = Profile(
                user_id=user.id,
                **data.model_dump(),
            )
            db.add(profile)

        await db.flush()

        # Trigger Identity Agent to generate Growth Blueprint
        blueprint = await identity_agent.generate_blueprint(
            goal=data.goal,
            learning_style=data.learning_style,
            experience=data.experience,
            daily_time=data.daily_time,
            motivation=data.motivation,
            current_level=data.current_level,
        )

        profile.growth_blueprint = json.dumps(blueprint)
        await db.commit()
        await db.refresh(profile)

        # Store onboarding data as embedding for long-term memory
        onboarding_text = (
            f"Goal: {data.goal}. Learning style: {data.learning_style}. "
            f"Experience: {data.experience}. Daily time: {data.daily_time}. "
            f"Motivation: {data.motivation}. Current level: {data.current_level}."
        )
        await embedding_service.create_embedding(
            db, user.id, onboarding_text, content_type="onboarding"
        )

        logger.info(f"Profile created for user_id={user.id} with Growth Blueprint")
        return self._to_response(profile)

    async def get_profile(self, db: AsyncSession, user: User) -> ProfileResponse:
        """Return the user's profile with Growth Blueprint."""
        result = await db.execute(
            select(Profile).where(Profile.user_id == user.id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise ProfileNotFoundError("Profile not found. Complete onboarding first.")
        return self._to_response(profile)

    async def update_profile(
        self, db: AsyncSession, user: User, data: ProfileUpdate
    ) -> ProfileResponse:
        """Partially update a user's profile."""
        result = await db.execute(
            select(Profile).where(Profile.user_id == user.id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise ProfileNotFoundError("Profile not found. Complete onboarding first.")

        # Update only provided fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(profile, field, value)

        await db.commit()
        await db.refresh(profile)

        logger.info(f"Profile updated for user_id={user.id}")
        return self._to_response(profile)

    def _to_response(self, profile: Profile) -> ProfileResponse:
        """Convert Profile model to response schema."""
        return ProfileResponse(
            id=str(profile.id),
            user_id=str(profile.user_id),
            goal=profile.goal,
            learning_style=profile.learning_style,
            experience=profile.experience,
            daily_time=profile.daily_time,
            motivation=profile.motivation,
            current_level=profile.current_level,
            growth_blueprint=profile.growth_blueprint,
            updated_at=profile.updated_at,
        )


# Singleton instance
profile_service = ProfileService()
