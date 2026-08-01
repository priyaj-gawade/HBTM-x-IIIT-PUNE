# Atlas AI Backend — Senior Software Tester Comprehensive QA & Test Plan Report

**Author**: Senior QA Lead / Software Test Engineer  
**Date**: August 1, 2026  
**Target System**: Atlas AI Backend (FastAPI, PostgreSQL + pgvector, Gemini 1.5 Flash AI Engine)  
**Report Type**: Master Test Plan, Feature-by-Feature Test Suite, Edge Case Matrix & Defect Inventory  

---

## 1. Executive Summary & Test Strategy

### 1.1 Overview
This report presents a thorough, professional quality assurance audit and test suite specification for the **Atlas AI** personal growth platform backend. As Senior QA Lead, I evaluated the application architecture, database schemas, security layers, async execution pipelines, and AI agent orchestrators across all 12 core API endpoints.

### 1.2 Testing Scope & Dimensions
- **Functional Testing**: Endpoint contracts, request validation, business logic, ORM database mutations, response schemas.
- **AI Agent Testing**: Prompt stability, JSON response parsing, fallback safety, response time SLA (<3s requirement), grounding, and memory integration via pgvector.
- **Security & Authorization**: JWT token lifecycle, payload tampered validation, input sanitization, rate limiting, SQL injection defense, CORS isolation, and PII protection.
- **Performance & Async Concurrency**: Event loop non-blocking validation, database pool exhaustion checks, async IO scaling.
- **Edge Cases & Failure Modes**: Invalid payloads, missing headers, database timeouts, Gemini API degradation, empty vector search results, boundary conditions.

---

## 2. Priority Classification Matrix

| Priority Level | SLA / Action Required | Description |
|---|---|---|
| 🚨 **P0 — Urgent / Critical** | Block Release / Immediate Fix | Security breach, authentication collapse, system crash, data loss, API downtime. |
| 🔴 **P1 — High Priority** | Fix before Staging / Pre-Prod | Major feature failure, invalid streak calculation, broken AI agent output, missing validation. |
| 🟡 **P2 — Medium Priority** | Fix in next sprint | Suboptimal error messages, missing pagination default limits, edge-case UI mismatch. |
| 🟢 **P3 — Low Priority** | Backlog / Polish | Minor logging formatting, non-critical docstring discrepancy, minor schema field description. |

---

## 3. Comprehensive Feature-by-Feature Test Suite

### Module 1: Authentication & Authorization (`/api/auth/*`)

#### Test Case ID: `TC-AUTH-001` (Positive Signup)
- **Priority**: 🚨 P0 — Urgent
- **Description**: Verify successful user registration with valid name, email, and strong password.
- **Preconditions**: Email does not exist in DB.
- **Input Payload**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex.mercer@example.com",
    "password": "Password123!"
  }
  ```
- **Expected Output**: HTTP 200 OK. Returns `{ "token": "<JWT_STRING>", "user_id": "<UUID>" }`. User row created in PostgreSQL `users` table with bcrypt password hash.

#### Test Case ID: `TC-AUTH-002` (Duplicate Email Signup)
- **Priority**: 🚨 P0 — Urgent
- **Description**: Verify system rejects registration with an already existing email address.
- **Input Payload**: Same email as `TC-AUTH-001`.
- **Expected Output**: HTTP 409 Conflict. Returns `{ "error": "email_exists", "message": "Email already registered" }`.

#### Test Case ID: `TC-AUTH-003` (Weak Password Rejected)
- **Priority**: 🔴 P1 — High
- **Description**: Verify passwords failing complexity rules (e.g. no uppercase or no numbers) are rejected.
- **Input Payload**: `{"name": "Test", "email": "valid@example.com", "password": "weakpassword"}`
- **Expected Output**: HTTP 422 Unprocessable Entity. Pydantic field validator fails with explicit error message.

#### Test Case ID: `TC-AUTH-004` (Invalid Email Format)
- **Priority**: 🔴 P1 — High
- **Description**: Verify malformed email strings are caught by `EmailStr`.
- **Input Payload**: `{"name": "Test", "email": "not-an-email-address", "password": "Password123!"}`
- **Expected Output**: HTTP 422 Unprocessable Entity.

#### Test Case ID: `TC-AUTH-005` (Successful Login)
- **Priority**: 🚨 P0 — Urgent
- **Description**: Verify valid credentials yield JWT access token.
- **Expected Output**: HTTP 200 OK with valid JWT signed with `HS256`.

#### Test Case ID: `TC-AUTH-006` (Invalid Login Credentials)
- **Priority**: 🚨 P0 — Urgent
- **Description**: Verify incorrect password or non-existent email fails gracefully.
- **Expected Output**: HTTP 401 Unauthorized. Returns `{ "error": "invalid_credentials", "message": "Invalid email or password" }`.

#### Test Case ID: `TC-AUTH-007` (Get Authenticated User `/api/auth/me`)
- **Priority**: 🚨 P0 — Urgent
- **Headers**: `Authorization: Bearer <VALID_JWT_TOKEN>`
- **Expected Output**: HTTP 200 OK. Returns User profile `{ "id": "<UUID>", "name": "Alex Mercer", "email": "alex.mercer@example.com", "created_at": "<TIMESTAMP>" }`.

#### Test Case ID: `TC-AUTH-008` (Unauthenticated Access Denied)
- **Priority**: 🚨 P0 — Urgent
- **Headers**: No header or invalid token.
- **Expected Output**: HTTP 401 Unauthorized / HTTP 403 Forbidden.

---

### Module 2: Onboarding & User Profile (`/api/profile`)

#### Test Case ID: `TC-PROF-001` (Create Onboarding Profile & Identity Agent Execution)
- **Priority**: 🚨 P0 — Urgent
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Input Payload**:
  ```json
  {
    "goal": "Become a Senior AI Architect",
    "learning_style": "Visual & Hands-on",
    "experience": "Intermediate Python",
    "daily_time": "1 hour",
    "motivation": "Career acceleration & building intelligent systems",
    "current_level": "Intermediate"
  }
  ```
- **Expected Output**:
  - HTTP 200 OK. Profile created in `profiles` table.
  - **Identity Agent Trigger**: Executes asynchronously (`generate_content_async`), builds `Growth Blueprint` stored as structured JSON.
  - **Embedding Pipeline**: Stores onboarding text in `embeddings` table via pgvector.

#### Test Case ID: `TC-PROF-002` (Get Profile & Blueprint)
- **Priority**: 🔴 P1 — High
- **Description**: Fetch profile and verify Growth Blueprint JSON structure (strengths, gaps, recommended_path, personality_insights).
- **Expected Output**: HTTP 200 OK with populated `growth_blueprint`.

#### Test Case ID: `TC-PROF-003` (Profile Update `/api/profile` PATCH)
- **Priority**: 🟡 P2 — Medium
- **Input Payload**: `{"daily_time": "2 hours"}`
- **Expected Output**: HTTP 200 OK. Only `daily_time` updated in DB; other fields remain untouched.

---

### Module 3: Growth Planner & Dashboard (`/api/dashboard`)

#### Test Case ID: `TC-DASH-001` (Dashboard Data Aggregation)
- **Priority**: 🚨 P0 — Urgent
- **Headers**: Valid Auth JWT.
- **Expected Output**:
  - HTTP 200 OK. Returns `{ "growth_score": 84, "today_focus": "Deep Work", "streak": 0, "mission": {...}, "insights": [...] }`.
  - Growth Planner Agent runs non-blocking, incorporating user profile + pgvector memories + recent mood.

#### Test Case ID: `TC-DASH-002` (Dashboard Graceful Fallback when Gemini API fails)
- **Priority**: 🔴 P1 — High
- **Preconditions**: Invalid/Simulated timeout on Gemini API.
- **Expected Output**: HTTP 200 OK. System uses `_fallback_plan()` seamlessly without crashing or throwing HTTP 500.

---

### Module 4: Curator Agent & Resource Recommendation (`/api/curator/generate`)

#### Test Case ID: `TC-CUR-001` (Curate My Day Resource Generation)
- **Priority**: 🚨 P0 — Urgent
- **Input Payload**: `{"goal": "Master Vector Databases & RAG"}`
- **Expected Output**:
  - HTTP 200 OK. Returns `today_plan` object and exactly 5 curated resource items (youtube, article, book, podcast, challenge).
  - 5 resource rows persisted to `curated_resources` table linked to `user_id`.

#### Test Case ID: `TC-CUR-002` (Curator Fallback Response)
- **Priority**: 🔴 P1 — High
- **Preconditions**: Gemini network timeout.
- **Expected Output**: HTTP 200 OK with default 5 fallback resources (video, article, book, podcast, challenge).

---

### Module 5: Night Reflection & Streak Engine (`/api/reflection`)

#### Test Case ID: `TC-REFL-001` (Submit Nightly Reflection)
- **Priority**: 🚨 P0 — Urgent
- **Input Payload**:
  ```json
  {
    "mood": "motivated",
    "journal": "Completed 2 modules of vector database indexing today. Learned HNSW indexing."
  }
  ```
- **Expected Output**:
  - HTTP 200 OK. Returns AI-generated `summary` and `next_day_focus`.
  - Habit streak updated from `0` to `1`. `last_completed_at` timestamp set to UTC now.
  - Reflection embedding saved to pgvector `embeddings` table (`content_type="reflection"`).

#### Test Case ID: `TC-REFL-002` (Same-Day Double Submission Streak Handling)
- **Priority**: 🔴 P1 — High
- **Description**: User submits reflection twice on the same UTC date.
- **Expected Output**: HTTP 200 OK. Second reflection saved, but habit streak **remains 1** (does not double increment).

#### Test Case ID: `TC-REFL-003` (Consecutive Day Streak Increment)
- **Priority**: 🔴 P1 — High
- **Preconditions**: Last reflection was yesterday (`today - 1 day`).
- **Expected Output**: Streak increments from `1` to `2`.

#### Test Case ID: `TC-REFL-004` (Missed Day Streak Reset)
- **Priority**: 🔴 P1 — High
- **Preconditions**: Last reflection was 3 days ago.
- **Expected Output**: Streak resets back to `1`.

---

### Module 6: Progress & Analytics (`/api/progress`)

#### Test Case ID: `TC-PROG-001` (Fetch Growth Metrics)
- **Priority**: 🟡 P2 — Medium
- **Expected Output**: HTTP 200 OK. Returns `{ "growth_score": 52, "streak": 1, "completed": 1 }`. Verified calculation using `calculate_growth_score()`.

---

### Module 7: Resource Search & Filtering (`/api/resources`)

#### Test Case ID: `TC-RES-001` (Filter Resources by Type & Pagination)
- **Priority**: 🟡 P2 — Medium
- **Query Params**: `?type=youtube&limit=10&offset=0`
- **Expected Output**: HTTP 200 OK. Returns list of YouTube resources created for the user.

#### Test Case ID: `TC-RES-002` (SQL Injection Protection on Goal Search)
- **Priority**: 🚨 P0 — Urgent
- **Query Params**: `?goal='; DROP TABLE users;--`
- **Expected Output**: HTTP 200 OK. Safe parameterized query executes without error or table drop.

---

### Module 8: AI Chat & Vector Memory Retrieval (`/api/chat`)

#### Test Case ID: `TC-CHAT-001` (Interactive AI Advice with RAG Memory)
- **Priority**: 🚨 P0 — Urgent
- **Input Payload**: `{"message": "How can I stay consistent with my learning goals?"}`
- **Expected Output**:
  - Searches pgvector embeddings for user's past onboarding & reflections.
  - Generates personalized advice using Gemini 1.5 Flash.
  - Stores conversation exchange as a new `chat` embedding in pgvector.

---

## 4. Non-Functional & Security Testing Summary

| Test Area | Status | Verification Method |
|---|---|---|
| **SQL Injection** | ✅ PASS | All SQLAlchemy queries use parameterized text bindings or ORM models. |
| **Authentication & Secrets** | ✅ PASS | Passwords hashed via bcrypt. JWT token secret configurable via env. |
| **CORS Security** | ✅ PASS | Restrictive `CORS_ORIGINS` setting implemented in FastAPI middleware. |
| **PII Data Privacy** | ✅ PASS | Logging sanitizes emails and logs only non-PII `user_id`. |
| **Non-blocking Event Loop** | ✅ PASS | Gemini calls use `generate_content_async` with 30s timeout; embeddings use `asyncio.to_thread`. |
| **Error Contract Uniformity** | ✅ PASS | Domain exceptions handled via explicit JSONResponse exception handlers. |
| **Container Readiness** | ✅ PASS | `Dockerfile` and `docker-compose.yml` validated. |

---

## 5. Defect Inventory & Action Items

### 🔴 P1 High Priority Action Items (Pre-Production Hardening)
1. **Rate Limiting Deployment**: Ensure `slowapi` rate limiters are enabled on `/api/chat` and `/api/curator/generate` in production to prevent Gemini API quota exhaustion.
2. **PostgreSQL Vector Extension Verification**: Ensure `CREATE EXTENSION IF NOT EXISTS vector;` is executed on fresh PostgreSQL databases before running Alembic migrations.

### 🟡 P2 Medium Priority Enhancements
1. **Redis Caching for Dashboard**: Implement Redis caching layer for `GET /api/dashboard` responses to reduce Gemini API calls for identical requests within a 1-hour window.
2. **Difficulty Column Addition**: Add `difficulty` column to `curated_resources` table schema in future migration.

---

## 6. Automated Pytest Test Suite Template

The following automated test script template can be executed immediately against the backend using `pytest`:

```python
# e:\HBTM\backend\tests\test_api_flow.py
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_full_user_lifecycle():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 1. Signup
        signup_res = await ac.post("/api/auth/signup", json={
            "name": "Test User",
            "email": "qa.test@atlas.app",
            "password": "Password123!"
        })
        assert signup_res.status_code == 200
        token = signup_res.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Me
        me_res = await ac.get("/api/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "qa.test@atlas.app"

        # 3. Create Profile / Onboarding
        prof_res = await ac.post("/api/profile", headers=headers, json={
            "goal": "Master AI Systems",
            "learning_style": "Visual",
            "experience": "Intermediate",
            "daily_time": "1 hour",
            "motivation": "Growth",
            "current_level": "Intermediate"
        })
        assert prof_res.status_code == 200

        # 4. Get Dashboard
        dash_res = await ac.get("/api/dashboard", headers=headers)
        assert dash_res.status_code == 200
        assert "growth_score" in dash_res.json()

        # 5. Reflection Submission
        refl_res = await ac.post("/api/reflection", headers=headers, json={
            "mood": "motivated",
            "journal": "Great day testing the backend API."
        })
        assert refl_res.status_code == 200
        assert "summary" in refl_res.json()
```

---
*End of Senior Software Tester QA & Test Plan Report*
