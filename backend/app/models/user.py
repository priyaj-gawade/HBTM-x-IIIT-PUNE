import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    """Users table."""
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships — use lazy="noload" to prevent massive eager query performance hits
    profile = relationship("Profile", back_populates="user", uselist=False, lazy="noload")
    habits = relationship("Habit", back_populates="user", lazy="noload")
    reflections = relationship("Reflection", back_populates="user", lazy="noload")
    curated_resources = relationship("CuratedResource", back_populates="user", lazy="noload")
    embeddings = relationship("Embedding", back_populates="user", lazy="noload")
