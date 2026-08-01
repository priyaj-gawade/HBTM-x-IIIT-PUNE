import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Profile(Base):
    """Profiles table - stores onboarding data and Growth Blueprint."""
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    goal: Mapped[str] = mapped_column(String(500), nullable=True)
    learning_style: Mapped[str] = mapped_column(String(255), nullable=True)
    experience: Mapped[str] = mapped_column(String(255), nullable=True)
    daily_time: Mapped[str] = mapped_column(String(100), nullable=True)
    motivation: Mapped[str] = mapped_column(Text, nullable=True)
    current_level: Mapped[str] = mapped_column(String(100), nullable=True)
    growth_blueprint: Mapped[str] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="profile")
