# Atlas AI Backend — Complete Fix Plan

**Date**: August 1, 2026
**Scope**: Fix all 35 issues from Code Review Report + Production Readiness improvements
**Estimated Time**: ~6-8 hours for all fixes

---

## Phase 1: Naming & Branding Fix (All "GrowthPilot" → "Atlas")

### Fix CR-01: Rename entire codebase from "GrowthPilot" to "Atlas"

| # | File | Change |
|---|------|--------|
| 1 | `main.py` | Docstring: `GrowthPilot AI Backend` → `Atlas AI Backend` |
| 2 | `main.py` | `title="GrowthPilot AI"` → `title="Atlas AI"` |
| 3 | `main.py` | `description` → update to Atlas |
| 4 | `main.py` | Health endpoint: `"app": "GrowthPilot AI"` → `"app": "Atlas AI"` |
| 5 | `app/utils/config.py` | `APP_NAME: str = "GrowthPilot AI"` → `"Atlas AI"` |
| 6 | `app/utils/config.py` | `DATABASE_URL` default: `growthpilot` → `atlas` |
| 7 | `.env.example` | `growthpilot` → `atlas` |
| 8 | `alembic.ini` | `growthpilot` → `atlas` |
| 9 | `app/prompts/identity_prompts.py` | `GrowthPilot AI` → `Atlas AI` |
| 10 | `app/prompts/planner_prompts.py` | `GrowthPilot AI` → `Atlas AI` |
| 11 | `app/prompts/curator_prompts.py` | `GrowthPilot AI` → `Atlas AI` |
| 12 | `app/prompts/reflection_prompts.py` | `GrowthPilot AI` → `Atlas AI` |
| 13 | `app/prompts/chat_prompts.py` | `GrowthPilot AI` → `Atlas AI` |
| 14 | `app/__init__.py` | `GrowthPilot` → `Atlas` |

---

## Phase 2: Security Fixes (Critical + High)

### Fix CR-02 + CR-03 + CR-04: Input Validation

**File**: `app/schemas/auth.py`

**Solution**:
```python
from pydantic import BaseModel, EmailStr, field_validator, constr

class SignupRequest(BaseModel):
    name: constr(min_length=1, max_length=255, strip_whitespace=True)
    email: EmailStr
    password: constr(min_length=8, max_length=128)

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
```

**Also add** `email-validator` to `requirements.txt`.

---

### Fix CR-05: CORS Security

**File**: `app/utils/config.py` + `main.py`

**Solution**:
```python
# config.py — add new field
CORS_ORIGINS: str = "http://localhost:3000"

# main.py — use config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

### Fix CR-06: Custom Exceptions (Remove inline imports)

**New File**: `app/utils/exceptions.py`

**Solution**:
```python
from fastapi import HTTPException, status

class AtlasBaseError(Exception):
    pass

class UserNotFoundError(AtlasBaseError):
    pass

class DuplicateEmailError(AtlasBaseError):
    pass

class InvalidCredentialsError(AtlasBaseError):
    pass

class ProfileNotFoundError(AtlasBaseError):
    pass

class AIGenerationError(AtlasBaseError):
    pass
```

**main.py** — Add exception handlers:
```python
from app.utils.exceptions import *

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
```

**Update Services** — Replace all inline `from fastapi import HTTPException` with domain exceptions:
```python
# auth_service.py — BEFORE
from fastapi import HTTPException, status
raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

# auth_service.py — AFTER
from app.utils.exceptions import DuplicateEmailError
raise DuplicateEmailError("Email already registered")
```

Apply same pattern to `profile_service.py` (replace inline imports with `ProfileNotFoundError`).

---

### Fix CR-07: Safe Resource Search

**File**: `app/services/resource_service.py`

**Solution**:
```python
# BEFORE (potential SQL issue)
query = query.where(CuratedResource.title.ilike(f"%{goal}%"))

# AFTER (safe parameterized)
from sqlalchemy import func
query = query.where(CuratedResource.title.ilike("%" + func.replace(goal, "%", "\\%") + "%"))
```

---

### Fix CR-08: Safe pgvector Query

**File**: `app/services/embedding_service.py`

**Solution**: Use pgvector's Python binding properly instead of string concatenation:
```python
from pgvector.sqlalchemy import Vector

# BEFORE
vector_str = "[" + ",".join(str(v) for v in query_vector) + "]"

# AFTER — pass vector directly via proper binding
stmt = text("""
    SELECT content FROM embeddings
    WHERE user_id = :user_id
    ORDER BY embedding <=> :query_vector::vector
    LIMIT :limit
""")
rows = await db.execute(stmt, {
    "user_id": str(user_id),
    "query_vector": str(query_vector),
    "limit": limit,
})
```

---

## Phase 3: Architecture Fixes (High)

### Fix HI-01: Remove Duplicate Endpoint

**File**: `app/api/users.py`

**Solution**: Strip down to bare minimum — remove the duplicate `/me`:
```python
"""Users API routes - reserved for future admin endpoints."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/users", tags=["Users"])

# Future: admin user management endpoints
```

---

### Fix HI-02: Centralize Gemini Configuration

**Solution**: Call `genai.configure()` once in `main.py`, remove from all 6 classes.

**main.py** lifespan:
```python
import google.generativeai as genai

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.info(f"Starting {settings.APP_NAME}...")
    logger.info("Gemini AI configured.")
    logger.info("Database and agents initialized.")
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}...")
```

**Remove** `genai.configure(api_key=settings.GEMINI_API_KEY)` from:
- `identity_agent.py` `__init__`
- `planner_agent.py` `__init__`
- `curator_agent.py` `__init__`
- `reflection_agent.py` `__init__`
- `chat_service.py` `__init__`
- `embedding_service.py` `__init__`

---

### Fix HI-03 + HI-04: Use Async Gemini Calls

**All 4 agents + chat_service.py**: Replace synchronous calls:

```python
# BEFORE (blocks event loop)
response = self.model.generate_content(prompt)

# AFTER (non-blocking)
response = await self.model.generate_content_async(prompt)
```

**embedding_service.py**: Use `asyncio.to_thread` for embed_content:
```python
import asyncio

# BEFORE
result = genai.embed_content(model="models/embedding-001", content=content, task_type="retrieval_document")

# AFTER
result = await asyncio.to_thread(
    genai.embed_content,
    model="models/embedding-001",
    content=content,
    task_type="retrieval_document",
)
```

---

### Fix HI-05: Add Request Timeouts

**All agents**: Add timeout to generate calls:
```python
response = await self.model.generate_content_async(
    prompt,
    request_options={"timeout": 30},
)
```

---

### Fix HI-06: Fix Streak Logic

**File**: `app/services/reflection_service.py`

**Solution**:
```python
from datetime import date, timedelta

# In create_reflection():
if habit:
    # Check if last completion was yesterday (continue streak)
    # or today (don't double count) or older (reset streak)
    if habit.last_completed_at:
        last_date = habit.last_completed_at.date()
        today = date.today()
        if last_date == today:
            pass  # Already completed today, don't increment
        elif last_date == today - timedelta(days=1):
            habit.current_streak += 1  # Continue streak
            habit.last_completed_at = datetime.now(timezone.utc)
        else:
            habit.current_streak = 1  # Reset streak
            habit.last_completed_at = datetime.now(timezone.utc)
    else:
        habit.current_streak = 1
        habit.last_completed_at = datetime.now(timezone.utc)
else:
    new_habit = Habit(
        user_id=user.id,
        habit_name="Daily Reflection",
        frequency="daily",
        current_streak=1,
        completion_rate=100.0,
        last_completed_at=datetime.now(timezone.utc),
    )
    db.add(new_habit)
```

**Also requires** adding `last_completed_at` column to Habit model.

---

### Fix HI-07: Add Pagination to Resources

**File**: `app/api/resources.py` + `app/services/resource_service.py`

**Solution**:
```python
# API route
@router.get("", response_model=list[ResourceResponse])
async def get_resources(
    type: Optional[str] = Query(None),
    goal: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ...
):
    return await resource_service.search_resources(
        db, current_user, type_filter=type, goal=goal, limit=limit, offset=offset
    )

# Service
async def search_resources(self, db, user, type_filter=None, goal=None, limit=20, offset=0):
    query = select(CuratedResource).where(CuratedResource.user_id == user.id)
    # ... filters ...
    query = query.order_by(CuratedResource.created_at.desc()).limit(limit).offset(offset)
```

---

### Fix HI-08: Remove Unused `difficulty` Parameter

**Solution**: Keep the parameter but document it as reserved. Since the model has no `difficulty` column, just log a warning if provided:
```python
if difficulty:
    logger.warning("difficulty filter is not yet implemented")
```

---

### Fix HI-09: Add Rate Limiting

**New dependency**: Add `slowapi` to `requirements.txt`

**File**: `main.py` + rate-limited endpoints

**Solution**:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

Apply limits to AI endpoints in their route files.

---

### Fix HI-10: Fix Eager Loading

**File**: `app/models/user.py`

**Solution**:
```python
# Change all relationships to lazy="noload"
profile = relationship("Profile", back_populates="user", uselist=False, lazy="noload")
habits = relationship("Habit", back_populates="user", lazy="noload")
reflections = relationship("Reflection", back_populates="user", lazy="noload")
curated_resources = relationship("CuratedResource", back_populates="user", lazy="noload")
embeddings = relationship("Embedding", back_populates="user", lazy="noload")
```

No service code changes needed because services already query these tables directly.

---

### Fix HI-11: Stop Logging PII

**File**: `app/services/auth_service.py`

**Solution**:
```python
# BEFORE
logger.info(f"New user registered: {data.email}")
logger.info(f"User logged in: {data.email}")

# AFTER
logger.info(f"New user registered: user_id={user.id}")
logger.info(f"User logged in: user_id={user.id}")
```

---

### Fix HI-12: Fix Auto-Commit on GET Requests

**File**: `app/db/database.py`

**Solution**: Remove auto-commit from dependency, let services handle it:
```python
async def get_db():
    async with async_session() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

Add explicit `await db.commit()` in service methods that write data (auth_service, profile_service, curator_service, reflection_service, chat_service).

---

## Phase 4: Medium Fixes

### Fix ME-01: Complete Alembic Setup

**New File**: `alembic/script.py.mako` — standard Alembic template
**New Dir**: `alembic/versions/` — empty directory for migrations

---

### Fix ME-02: Remove Unused Imports

Clean up across all files:
- `dashboard_service.py`: remove `import json`
- `auth_service.py`: remove `from uuid import UUID`
- `curator_service.py`: remove `from uuid import UUID`
- `planner_agent.py`: remove `List, Optional` from typing

---

### Fix ME-03: Real Health Check

**File**: `main.py`

**Solution**:
```python
@app.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "gemini_api": "configured" if settings.GEMINI_API_KEY else "missing",
        "agents": ["Identity Agent", "Growth Planner", "Curator Agent", "Reflection Agent"],
        "version": "1.0.0",
    }
```

---

### Fix ME-04: Consistent Growth Score

**New File**: `app/utils/growth_score.py`

**Solution**: Single source of truth for growth score calculation:
```python
def calculate_growth_score(streak: int, completed: int, profile_completeness: float = 1.0) -> int:
    base = 40
    streak_bonus = min(streak * 3, 30)
    activity_bonus = min(completed * 2, 20)
    profile_bonus = int(profile_completeness * 10)
    return min(100, base + streak_bonus + activity_bonus + profile_bonus)
```

Use this function in `progress_service.py`, `dashboard_service.py`, and `planner_agent.py` fallback.

---

### Fix ME-05: Add Timestamps to Habits

**File**: `app/models/habit.py`

**Solution**: Add `created_at`, `updated_at`, and `last_completed_at`:
```python
created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
last_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
```

---

### Fix ME-06: Add Startup Validation

**File**: `main.py` lifespan

**Solution**:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate critical config
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set — AI agents will use fallback responses")
    if settings.JWT_SECRET_KEY == "your-super-secret-key-change-this":
        logger.error("JWT_SECRET_KEY is using default value — CHANGE THIS IN PRODUCTION")
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.info(f"Starting {settings.APP_NAME}...")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")
```

---

### Fix ME-08: Replace Silent Exception Swallowing

**All services** with `except Exception: pass`:

**Solution**:
```python
# BEFORE
except Exception:
    pass

# AFTER
except Exception as e:
    logger.warning(f"pgvector search failed, continuing without memory context: {e}")
```

---

### Fix ME-09: Use JSONB for Blueprint

**File**: `app/models/profile.py`

**Solution**:
```python
from sqlalchemy.dialects.postgresql import JSONB

growth_blueprint = mapped_column(JSONB, nullable=True)  # Instead of Text
```

**Update** `profile_service.py` — remove `json.dumps()` call, store dict directly.

---

### Fix ME-14: Remove All Unused Imports

Scan and clean across entire codebase.

---

### Fix ME-15: Add Dockerfile & docker-compose

**New Files**:
- `Dockerfile`
- `docker-compose.yml`
- `.gitignore`
- `.dockerignore`

---

## Phase 5: DevOps & Deployment Files

### New: `.gitignore`

```
__pycache__/
*.pyc
*.pyo
.env
.venv/
venv/
*.egg-info/
dist/
build/
alembic/versions/*.pyc
.DS_Store
*.db
```

### New: `Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### New: `docker-compose.yml`

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: atlas
      POSTGRES_USER: atlas_user
      POSTGRES_PASSWORD: atlas_pass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - db
      - redis

volumes:
  pgdata:
```

---

## Complete File Change Summary

### New Files (7)
| # | File | Purpose |
|---|------|---------|
| 1 | `app/utils/exceptions.py` | Custom exception hierarchy |
| 2 | `app/utils/growth_score.py` | Centralized growth score formula |
| 3 | `alembic/script.py.mako` | Alembic migration template |
| 4 | `.gitignore` | Git ignore rules |
| 5 | `.dockerignore` | Docker ignore rules |
| 6 | `Dockerfile` | Container build |
| 7 | `docker-compose.yml` | Full stack orchestration |

### Modified Files (30+)
| # | File | Changes |
|---|------|---------|
| 1 | `main.py` | Rename to Atlas, CORS fix, exception handlers, Gemini init, health check, startup validation |
| 2 | `requirements.txt` | Add `email-validator`, `slowapi` |
| 3 | `.env.example` | Rename DB to atlas, add CORS_ORIGINS |
| 4 | `alembic.ini` | Rename DB to atlas |
| 5 | `app/__init__.py` | Rename to Atlas |
| 6 | `app/utils/config.py` | Rename to Atlas, add CORS_ORIGINS |
| 7 | `app/utils/security.py` | No changes needed |
| 8 | `app/db/database.py` | Remove auto-commit, add pool_pre_ping |
| 9 | `app/models/user.py` | Change lazy="selectin" → lazy="noload" |
| 10 | `app/models/habit.py` | Add created_at, updated_at, last_completed_at |
| 11 | `app/models/profile.py` | Change growth_blueprint to JSONB |
| 12 | `app/schemas/auth.py` | Add EmailStr, password validation, name validation |
| 13 | `app/schemas/reflection.py` | Add mood enum, journal length limit |
| 14 | `app/services/auth_service.py` | Use custom exceptions, fix PII logging, add explicit commit |
| 15 | `app/services/profile_service.py` | Use custom exceptions, remove json.dumps, add explicit commit |
| 16 | `app/services/dashboard_service.py` | Remove unused import, use growth_score util, fix exception logging |
| 17 | `app/services/curator_service.py` | Remove unused import, fix exception logging, add explicit commit |
| 18 | `app/services/reflection_service.py` | Fix streak logic, fix exception logging, add explicit commit |
| 19 | `app/services/progress_service.py` | Use growth_score util |
| 20 | `app/services/resource_service.py` | Fix ilike safety, add pagination |
| 21 | `app/services/embedding_service.py` | Fix vector query, use asyncio.to_thread, fix exception logging |
| 22 | `app/services/chat_service.py` | Remove genai.configure, use async call, add explicit commit |
| 23 | `app/agents/identity_agent.py` | Remove genai.configure, use async call, add timeout |
| 24 | `app/agents/planner_agent.py` | Remove genai.configure, use async call, add timeout, fix unused imports |
| 25 | `app/agents/curator_agent.py` | Remove genai.configure, use async call, add timeout |
| 26 | `app/agents/reflection_agent.py` | Remove genai.configure, use async call, add timeout |
| 27 | `app/api/users.py` | Remove duplicate /me endpoint |
| 28 | `app/api/resources.py` | Add pagination params |
| 29 | `app/prompts/identity_prompts.py` | Rename to Atlas |
| 30 | `app/prompts/planner_prompts.py` | Rename to Atlas |
| 31 | `app/prompts/curator_prompts.py` | Rename to Atlas |
| 32 | `app/prompts/reflection_prompts.py` | Rename to Atlas |
| 33 | `app/prompts/chat_prompts.py` | Rename to Atlas |

---

## Execution Order

```
Phase 1: Naming Fix (14 files)           → ~15 min
Phase 2: Security Fixes (8 changes)       → ~45 min
Phase 3: Architecture Fixes (12 changes)  → ~90 min
Phase 4: Medium Fixes (10 changes)        → ~60 min
Phase 5: DevOps Files (7 new files)       → ~15 min
─────────────────────────────────────────────────────
Total                                     → ~4 hours
```

---

## Post-Fix Verification

After all fixes are applied:

1. **Import Check**: `python -c "from main import app"` — verify no import errors
2. **Swagger Check**: Start server, open `/docs`, verify all 12 endpoints present
3. **Endpoint List Verification**:
   - `POST /api/auth/signup` ✓
   - `POST /api/auth/login` ✓
   - `GET /api/auth/me` ✓
   - `POST /api/profile` ✓
   - `GET /api/profile` ✓
   - `PATCH /api/profile` ✓
   - `GET /api/dashboard` ✓
   - `POST /api/curator/generate` ✓
   - `POST /api/reflection` ✓
   - `GET /api/progress` ✓
   - `GET /api/resources` ✓
   - `POST /api/chat` ✓
4. **No "GrowthPilot"**: `grep -r "GrowthPilot" backend/` → should return 0 results
5. **No "growthpilot"**: `grep -ri "growthpilot" backend/` → should return 0 results

---

*Awaiting approval to proceed with implementation.*
