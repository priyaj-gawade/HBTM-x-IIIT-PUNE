import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.utils.config import settings
from app.db.base import Base

# Import all models to ensure they are registered with Base.metadata
from app.models.user import User
from app.models.profile import Profile
from app.models.habit import Habit
from app.models.curated_resource import CuratedResource
from app.models.reflection import Reflection
from app.models.embedding import Embedding
from app.models.workspace import Workspace
from app.models.chat_thread import ChatThread
from app.models.learning_plan import LearningPlan
from app.models.skill_node import SkillNode

async def init_db():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        # We need to enable pgvector extension in Postgres first before creating tables that use it
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialized successfully.")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(init_db())

