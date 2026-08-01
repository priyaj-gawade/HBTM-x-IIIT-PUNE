"""
Atlas AI Backend
================
FastAPI application entry point.

Tech Stack:
- FastAPI + Uvicorn
- PostgreSQL + pgvector + SQLAlchemy (async)
- Gemini AI (4 agents)
- JWT Authentication
- Redis (optional cache)
"""

import logging
from contextlib import asynccontextmanager

import google.generativeai as genai
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import auth, users, onboarding, dashboard, curator, reflection, resources, chat
from app.api import progress, catalog, workspaces, roadmap, mindmap, orchestration
from app.db.database import get_db
from app.utils.config import settings
from app.utils.llm_manager import llm_manager
from app.utils.exceptions import (
    DuplicateEmailError,
    InvalidCredentialsError,
    ProfileNotFoundError,
    UserNotFoundError,
    AIGenerationError,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup validation
    if not llm_manager.keys:
        logger.warning("No GEMINI_KEYs are set — AI agents will use fallback responses")
    if settings.JWT_SECRET_KEY == "your-super-secret-key-change-this":
        logger.error("JWT_SECRET_KEY is using default value — CHANGE THIS IN PRODUCTION")

    logger.info(f"Starting {settings.APP_NAME}...")
    try:
        from create_db import init_db
        await init_db()
        logger.info("Database schema verified and initialized.")
    except Exception as e:
        logger.warning(f"Database auto-initialization skipped or encountered an error: {e}")

    logger.info("Gemini AI configured. Database and agents initialized.")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title="Atlas AI",
    description="AI-powered personal growth platform with 4 intelligent agents.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware — use allowed origins from config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Exception Handlers ---

@app.exception_handler(DuplicateEmailError)
async def handle_duplicate_email(request, exc):
    return JSONResponse(status_code=409, content={"error": "email_exists", "message": str(exc)})


@app.exception_handler(InvalidCredentialsError)
async def handle_invalid_credentials(request, exc):
    return JSONResponse(status_code=401, content={"error": "invalid_credentials", "message": str(exc)})


@app.exception_handler(ProfileNotFoundError)
async def handle_profile_not_found(request, exc):
    return JSONResponse(status_code=404, content={"error": "profile_not_found", "message": str(exc)})


@app.exception_handler(UserNotFoundError)
async def handle_user_not_found(request, exc):
    return JSONResponse(status_code=404, content={"error": "user_not_found", "message": str(exc)})


@app.exception_handler(AIGenerationError)
async def handle_ai_error(request, exc):
    return JSONResponse(status_code=503, content={"error": "ai_generation_failed", "message": str(exc)})


# --- Routers ---

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(onboarding.router)
app.include_router(dashboard.router)
app.include_router(curator.router)
app.include_router(reflection.router)
app.include_router(resources.router)
app.include_router(chat.router)
app.include_router(progress.router)
app.include_router(catalog.router)
app.include_router(workspaces.router)
app.include_router(roadmap.router)
app.include_router(mindmap.router)
app.include_router(orchestration.router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "app": "Atlas AI",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check with actual DB ping."""
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "gemini_api": "configured" if llm_manager.keys else "missing",
        "agents": [
            "Identity Agent",
            "Growth Planner",
            "Curator Agent",
            "Reflection Agent",
        ],
        "version": "1.0.0",
    }
