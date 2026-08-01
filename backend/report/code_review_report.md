# Atlas AI Backend — Senior Code Review Report

**Reviewer**: Senior Backend Engineer
**Date**: August 1, 2026
**Codebase**: Atlas AI Backend (FastAPI + PostgreSQL + pgvector + Gemini)
**Verdict**: ⚠️ **NOT production-ready** — Multiple critical, high, and medium severity issues found

---

## Executive Summary

The codebase has a well-organized structure and demonstrates a clear understanding of the FastAPI + async SQLAlchemy stack. However, there are **8 Critical**, **12 High**, and **15 Medium** severity issues that must be resolved before this can go to production. The most concerning issues are around **security**, **error handling**, **naming** (wrong app name used everywhere), and **missing validation**.

---

## 🔴 CRITICAL Issues (Must Fix Immediately)

### CR-01: Wrong App Name — "GrowthPilot" used instead of "Atlas"

**Severity**: 🔴 Critical
**Files Affected**: 12+ files across the entire codebase

The app is called **Atlas**, but "GrowthPilot" or "GrowthPilot AI" appears in:

| File | Location | Wrong Text |
|------|----------|-----------|
| [main.py](file:///e:/HBTM/backend/main.py#L1-L3) | Docstring, line 2 | `GrowthPilot AI Backend` |
| [main.py](file:///e:/HBTM/backend/main.py#L42) | FastAPI title | `title="GrowthPilot AI"` |
| [main.py](file:///e:/HBTM/backend/main.py#L73) | Health endpoint | `"app": "GrowthPilot AI"` |
| [config.py](file:///e:/HBTM/backend/app/utils/config.py#L23) | APP_NAME default | `APP_NAME: str = "GrowthPilot AI"` |
| [config.py](file:///e:/HBTM/backend/app/utils/config.py#L9) | DATABASE_URL | `growthpilot` database name |
| [.env.example](file:///e:/HBTM/backend/.env.example) | DATABASE_URL | `growthpilot` database name |
| [identity_prompts.py](file:///e:/HBTM/backend/app/prompts/identity_prompts.py#L3) | System prompt | `GrowthPilot AI` |
| [chat_prompts.py](file:///e:/HBTM/backend/app/prompts/chat_prompts.py#L3) | System prompt | `GrowthPilot AI` |
| [curator_prompts.py](file:///e:/HBTM/backend/app/prompts/curator_prompts.py) | System prompt | `GrowthPilot AI` |
| [planner_prompts.py](file:///e:/HBTM/backend/app/prompts/planner_prompts.py) | System prompt | `GrowthPilot AI` |
| [reflection_prompts.py](file:///e:/HBTM/backend/app/prompts/reflection_prompts.py) | System prompt | `GrowthPilot AI` |
| [alembic.ini](file:///e:/HBTM/backend/alembic.ini) | sqlalchemy.url | `growthpilot` database name |

**Fix**: Global find-and-replace `GrowthPilot AI` → `Atlas` and `growthpilot` → `atlas` in database URLs.

---

### CR-02: EmailStr imported but not used — No email validation

**Severity**: 🔴 Critical
**File**: [schemas/auth.py](file:///e:/HBTM/backend/app/schemas/auth.py#L4)

```python
from pydantic import BaseModel, EmailStr  # EmailStr imported

class SignupRequest(BaseModel):
    email: str  # ← uses plain `str`, NOT EmailStr!
```

`EmailStr` is imported but the `email` field is `str`. This means:
- Users can signup with `email: "not-an-email"` or `email: ""` — no validation at all
- Also, `EmailStr` requires the `email-validator` package which is **not in requirements.txt**

**Fix**: Either use `EmailStr` (and add `email-validator` to requirements) or add `@field_validator` for email format.

---

### CR-03: No password validation — Empty/weak passwords accepted

**Severity**: 🔴 Critical
**File**: [schemas/auth.py](file:///e:/HBTM/backend/app/schemas/auth.py#L7-L11)

```python
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str  # ← No min length, no complexity check
```

A user can register with `password: ""` or `password: "1"`. There's zero validation on:
- Minimum length
- Maximum length
- Complexity requirements

**Fix**: Add `@field_validator('password')` or use `constr(min_length=8, max_length=128)`.

---

### CR-04: No name validation — Empty names accepted

**Severity**: 🔴 Critical
**File**: [schemas/auth.py](file:///e:/HBTM/backend/app/schemas/auth.py#L9)

```python
name: str  # ← Can be empty string ""
```

**Fix**: Use `constr(min_length=1, max_length=255)` or add a validator.

---

### CR-05: CORS set to allow ALL origins in production

**Severity**: 🔴 Critical
**File**: [main.py](file:///e:/HBTM/backend/main.py#L49-L55)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← DANGEROUS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

`allow_origins=["*"]` with `allow_credentials=True` is a security vulnerability. Any website can make authenticated requests to your API.

**Fix**: Load allowed origins from environment variable: `CORS_ORIGINS=http://localhost:3000,https://atlas.app`.

---

### CR-06: Inline imports of HTTPException inside service methods

**Severity**: 🔴 Critical
**Files**: [auth_service.py](file:///e:/HBTM/backend/app/services/auth_service.py#L25), [profile_service.py](file:///e:/HBTM/backend/app/services/profile_service.py#L77)

```python
async def login(self, db, data):
    from fastapi import HTTPException, status  # ← Import INSIDE method body!
```

This pattern appears in multiple service files. Problems:
- Circular import smell — if you need deferred imports, the architecture has a dependency issue
- Performance hit on every call (Python caches it, but it's still bad practice)
- Services should NOT raise HTTP exceptions — they should raise domain exceptions that routes translate to HTTP

**Fix**: Create `app/utils/exceptions.py` with custom exceptions (`UserNotFoundError`, `DuplicateEmailError`, etc.) and handle them in routes or with FastAPI exception handlers.

---

### CR-07: SQL Injection risk in resource search

**Severity**: 🔴 Critical
**File**: [resource_service.py](file:///e:/HBTM/backend/app/services/resource_service.py#L37)

```python
if goal:
    query = query.where(CuratedResource.title.ilike(f"%{goal}%"))
```

While SQLAlchemy ORM typically parameterizes this, the `ilike` with direct string interpolation using `f"%{goal}%"` can be problematic. The `goal` parameter comes directly from user input.

**Fix**: Use SQLAlchemy's `contains()` method or explicit parameterized binding.

---

### CR-08: Raw SQL with string concatenation in embedding service

**Severity**: 🔴 Critical
**File**: [embedding_service.py](file:///e:/HBTM/backend/app/services/embedding_service.py#L99)

```python
vector_str = "[" + ",".join(str(v) for v in query_vector) + "]"
```

While the vector values come from the Gemini API (not user input), building SQL strings by concatenation is a dangerous pattern. If the embedding API ever returns unexpected values, this could break.

**Fix**: Use pgvector's proper Python binding for passing vectors as parameters.

---

## 🟠 HIGH Severity Issues

### HI-01: Duplicate `/me` endpoint

**Severity**: 🟠 High
**Files**: [api/auth.py](file:///e:/HBTM/backend/app/api/auth.py#L43) + [api/users.py](file:///e:/HBTM/backend/app/api/users.py#L14)

Both files expose a "get current user" endpoint:
- `GET /api/auth/me` → in `auth.py`
- `GET /api/users/me` → in `users.py`

They do the same thing. This creates confusion in the API docs and for frontend developers.

**Fix**: Remove the duplicate from `users.py` and keep only `GET /api/auth/me` as specified in the requirements.

---

### HI-02: All agents call `genai.configure()` in `__init__` — Race condition

**Severity**: 🟠 High
**Files**: All 4 agent files + chat_service.py + embedding_service.py

```python
def __init__(self):
    genai.configure(api_key=settings.GEMINI_API_KEY)  # ← Called 6 times!
```

`genai.configure()` is called 6 separate times (once per singleton). This is a global mutation — if any of these run concurrently during import, it could race.

**Fix**: Call `genai.configure()` once in `main.py` lifespan startup, and remove it from all individual classes.

---

### HI-03: Agents use synchronous `generate_content` — blocks the event loop

**Severity**: 🟠 High
**Files**: All 4 agents + chat_service.py

```python
response = self.model.generate_content(prompt)  # ← SYNCHRONOUS CALL
```

Despite being `async def`, the actual Gemini API call is **synchronous** (`generate_content()` is not awaitable). This blocks the entire event loop while waiting for the AI response (could be 2-10 seconds).

**Fix**: Use `generate_content_async()` instead:
```python
response = await self.model.generate_content_async(prompt)
```

---

### HI-04: `genai.embed_content` is also synchronous

**Severity**: 🟠 High
**File**: [embedding_service.py](file:///e:/HBTM/backend/app/services/embedding_service.py#L44)

```python
result = genai.embed_content(...)  # ← blocks event loop
```

Same issue as HI-03. The embedding calls block the async event loop.

**Fix**: Use `asyncio.to_thread()` to run blocking calls or use the async variant.

---

### HI-05: No request timeout on Gemini API calls

**Severity**: 🟠 High
**Files**: All agents

If Gemini API hangs, the request hangs forever. No timeout is configured.

**Fix**: Add `request_options={"timeout": 30}` to `generate_content()` calls.

---

### HI-06: Streak logic is incorrect — always increments

**Severity**: 🟠 High
**File**: [reflection_service.py](file:///e:/HBTM/backend/app/services/reflection_service.py#L100-L111)

```python
if habit:
    habit.current_streak += 1  # ← Always increments, no date checking
```

The streak always increments when a reflection is created, even if:
- The user submits 5 reflections in one day (streak goes up by 5)
- The user skips a day and comes back (streak should reset to 1)

**Fix**: Check if the last reflection was yesterday. If yes, increment. If same day, skip. If older, reset to 1.

---

### HI-07: No pagination on resource listing

**Severity**: 🟠 High
**File**: [resource_service.py](file:///e:/HBTM/backend/app/services/resource_service.py)

`GET /api/resources` returns ALL resources with no pagination. If a user has 1000+ resources, this returns all of them in one response.

**Fix**: Add `limit` and `offset` query parameters with sensible defaults (e.g., `limit=20`).

---

### HI-08: `difficulty` filter parameter is accepted but never used

**Severity**: 🟠 High
**File**: [resource_service.py](file:///e:/HBTM/backend/app/services/resource_service.py#L26)

The `difficulty` parameter is accepted by the API but completely ignored in the service. The `curated_resources` table also doesn't have a `difficulty` column.

**Fix**: Either add a `difficulty` column to the model and implement the filter, or remove the parameter from the API.

---

### HI-09: No rate limiting on AI endpoints

**Severity**: 🟠 High
**Files**: [curator.py](file:///e:/HBTM/backend/app/api/curator.py), [chat.py](file:///e:/HBTM/backend/app/api/chat.py), [reflection.py](file:///e:/HBTM/backend/app/api/reflection.py)

AI endpoints call Gemini API with no rate limiting. A malicious user could:
- Spam `/api/chat` and burn through your Gemini API quota
- Spam `/api/curator/generate` and flood the resources table
- Spam `/api/reflection` and inflate their streak artificially

**Fix**: Add rate limiting middleware (e.g., `slowapi` or custom Redis-based limiter).

---

### HI-10: `selectin` lazy loading on ALL relationships

**Severity**: 🟠 High
**File**: [models/user.py](file:///e:/HBTM/backend/app/models/user.py#L25-L30)

```python
profile = relationship("Profile", back_populates="user", uselist=False, lazy="selectin")
habits = relationship("Habit", back_populates="user", lazy="selectin")
reflections = relationship("Reflection", back_populates="user", lazy="selectin")
curated_resources = relationship("CuratedResource", back_populates="user", lazy="selectin")
embeddings = relationship("Embedding", back_populates="user", lazy="selectin")
```

Every time you load a User, it eagerly loads ALL their profiles, habits, reflections, curated_resources, AND embeddings. For a user with 500 reflections and 200 embeddings, this is a massive performance hit.

**Fix**: Change to `lazy="noload"` or `lazy="raise"` and explicitly load only what each endpoint needs using `joinedload()` or `selectinload()`.

---

### HI-11: Logging PII — user emails logged

**Severity**: 🟠 High
**Files**: [auth_service.py](file:///e:/HBTM/backend/app/services/auth_service.py#L43)

```python
logger.info(f"New user registered: {data.email}")
logger.info(f"User logged in: {data.email}")
```

User emails are PII and should not be logged in plaintext. This violates GDPR/data protection requirements.

**Fix**: Log user IDs instead: `logger.info(f"New user registered: {user.id}")`.

---

### HI-12: `get_db()` auto-commits on every request

**Severity**: 🟠 High
**File**: [database.py](file:///e:/HBTM/backend/app/db/database.py#L18-L28)

```python
async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()  # ← Auto-commits even on GET requests
        except Exception:
            await session.rollback()
            raise
```

Every request auto-commits, even read-only GET endpoints. This adds unnecessary overhead and can mask bugs where a service accidentally mutates data during a read operation.

**Fix**: Let services/routes explicitly commit. Or use separate read-only and read-write dependencies.

---

## 🟡 MEDIUM Severity Issues

### ME-01: No Alembic migration script template

The `alembic/` directory only has `env.py` but is missing the `script.py.mako` template and `versions/` directory. Running `alembic revision --autogenerate` will fail.

---

### ME-02: `json` import unused in some service files

[dashboard_service.py](file:///e:/HBTM/backend/app/services/dashboard_service.py#L3) imports `json` but never uses it. Same for `UUID` import in auth_service.py, curator_service.py, etc.

---

### ME-03: No health check for database connectivity

The `/health` endpoint returns a static response without actually checking if the database is reachable.

---

### ME-04: Growth score calculation is naive and inconsistent

Two different formulas used in different places:
- `progress_service.py`: `min(100, 40 + (streak * 3) + (completed * 2))`
- `planner_agent.py` fallback: `min(50 + streak * 2, 100)`
- `dashboard_service.py` fallback: `50 + streak * 2`

---

### ME-05: No `created_at` or `updated_at` on Habits table

Unlike other tables, `habits` has no timestamps. You can't tell when a habit was created or last updated.

---

### ME-06: Agents initialized at import time

All agent singletons are created at module import time. If the Gemini API key is empty/invalid, the app may silently create broken agents. No startup validation occurs.

---

### ME-07: No response caching for dashboard

`GET /api/dashboard` calls the Growth Planner Agent on every request. For the same user within the same day, the response should be cached.

---

### ME-08: Broad `except Exception: pass` pattern

Multiple services silently swallow exceptions:
```python
except Exception:
    pass  # pgvector search failure — user gets degraded experience with no indication
```

---

### ME-09: `Profile.growth_blueprint` stored as JSON string, not JSONB

The blueprint is stored as `Text` and serialized with `json.dumps()`. PostgreSQL supports native `JSONB` which would allow indexing and querying.

---

### ME-10: No `__repr__` or `__str__` on models

Makes debugging harder. When you print a User, you get `<User object at 0x...>`.

---

### ME-11: No API versioning

All routes are under `/api/` with no version prefix. If the API changes, there's no way to maintain backward compatibility.

---

### ME-12: No structured error response format

Errors return inconsistent formats. Some use `{"detail": "message"}`, others might return FastAPI's default.

---

### ME-13: No logging correlation/request IDs

No way to trace a request across logs from route → service → agent → DB.

---

### ME-14: `UUID` import unused in multiple service files

`from uuid import UUID` imported but never used in `auth_service.py`, `curator_service.py`, etc.

---

### ME-15: No `Dockerfile` or deployment configuration

No containerization setup, no `docker-compose.yml` for the full stack (PostgreSQL + pgvector + Redis + FastAPI).

---

## Feature-by-Feature Review

### 🔐 Authentication (`/api/auth/*`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Signup | ⚠️ Issues | No email/password/name validation |
| Login | ⚠️ Issues | No brute-force protection |
| JWT tokens | ✅ Working | Proper creation and validation |
| Get me | ⚠️ Duplicate | Same endpoint in both auth.py and users.py |
| Password hashing | ✅ Good | bcrypt via passlib |
| Token expiry | ✅ Good | Configurable via env |
| Refresh tokens | ❌ Missing | No refresh token mechanism |

### 📋 Onboarding / Profile (`/api/profile`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Create profile | ✅ Working | Triggers Identity Agent correctly |
| Get profile | ✅ Working | Returns Growth Blueprint |
| Update profile | ✅ Working | Partial updates supported |
| Re-onboarding | ✅ Good | Handles existing profile gracefully |
| Identity Agent trigger | ⚠️ Slow | Synchronous Gemini call blocks event loop |
| Blueprint storage | ⚠️ Suboptimal | Should use JSONB, not Text |

### 📊 Dashboard (`/api/dashboard`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Growth score | ⚠️ Issues | Inconsistent formulas across codebase |
| Today's focus | ✅ Working | Generated by Planner Agent |
| Streak | ⚠️ Issues | Logic doesn't validate daily gaps |
| Mission | ✅ Working | Structured JSON output |
| Insights | ✅ Working | AI-generated |
| Performance | ⚠️ Slow | No caching, AI call on every request |

### 🎯 Curator (`/api/curator/generate`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Resource generation | ✅ Working | 5 types: video, article, book, podcast, challenge |
| DB persistence | ✅ Working | Resources saved after generation |
| Reasoning | ✅ Good | Each resource includes `reason` |
| Duplicate prevention | ❌ Missing | Same resources can be generated repeatedly |
| Rate limiting | ❌ Missing | Can spam the endpoint |

### 🌙 Reflection (`/api/reflection`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Reflection creation | ✅ Working | Saves to DB with agent analysis |
| Reflection Agent | ✅ Working | Returns summary + next_day_focus |
| Embedding storage | ✅ Working | Stores in pgvector |
| Streak update | ⚠️ Buggy | Always increments, no date validation |
| Multi-submit protection | ❌ Missing | Can submit multiple per day |

### 📈 Progress (`/api/progress`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Growth score | ⚠️ Issues | Naive formula |
| Streak | ✅ Working | Max streak from habits |
| Completed count | ✅ Working | Count of reflections |
| Historical trends | ❌ Missing | No historical data points |

### 📚 Resources (`/api/resources`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Type filter | ✅ Working | Filters by resource type |
| Goal filter | ✅ Working | ilike search on title |
| Difficulty filter | ❌ Broken | Accepted but never used |
| Pagination | ❌ Missing | Returns all results |

### 💬 Chat (`/api/chat`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Message handling | ✅ Working | Sends to Gemini with context |
| Memory retrieval | ✅ Good | pgvector similarity search |
| Conversation history | ⚠️ Partial | Stored as embeddings only, no chat thread |
| Error handling | ✅ Good | Returns friendly fallback message |
| Rate limiting | ❌ Missing | Can spam |

### 🧠 AI Agents

| Agent | Status | Issues |
|-------|--------|--------|
| Identity Agent | ⚠️ Works | Sync Gemini call, no timeout |
| Growth Planner | ⚠️ Works | Sync Gemini call, no timeout |
| Curator Agent | ⚠️ Works | Sync Gemini call, no timeout |
| Reflection Agent | ⚠️ Works | Sync Gemini call, no timeout |
| Fallback responses | ✅ Good | All agents have sensible fallbacks |
| Prompt engineering | ✅ Good | Well-structured system/user prompts |

### 🗄️ Database & pgvector

| Aspect | Status | Notes |
|--------|--------|-------|
| Schema design | ✅ Good | Proper FK, UUID PKs, cascading deletes |
| Async support | ✅ Good | asyncpg + async session |
| Migrations | ⚠️ Incomplete | Missing script template + versions dir |
| Vector search | ✅ Working | Cosine distance with pgvector |
| Indexes | ⚠️ Missing | No indexes on user_id FKs |

---

## Issue Count Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 8 | Must fix before launch |
| 🟠 High | 12 | Should fix before launch |
| 🟡 Medium | 15 | Nice to fix |
| **Total** | **35** | |

---

*End of Code Review Report*
