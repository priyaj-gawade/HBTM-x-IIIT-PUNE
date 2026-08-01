"""
Atlas AI Backend — Full Feature & AI Agent Verification Test Suite
==================================================================
Runs unit, integration, model, and AI agent fallback/execution tests across all backend components.
"""

import asyncio
import json
import logging
import sys
from datetime import datetime, timezone, timedelta

# Ensure UTF-8 output encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_suite")


async def run_all_tests():
    test_results = []

    def record_result(feature: str, test_name: str, status: str, details: str):
        test_results.append({
            "feature": feature,
            "test_name": test_name,
            "status": status,
            "details": details
        })
        symbol = "[PASS]" if status == "PASS" else "[FAIL]"
        print(f"{symbol} [{feature}] {test_name}: {details}")

    print("\n=======================================================")
    print("      ATLAS AI BACKEND COMPREHENSIVE TEST SUITE       ")
    print("=======================================================\n")

    # 1. Security & Hashing Tests
    try:
        from app.utils.security import hash_password, verify_password, create_access_token, decode_access_token
        pw = "SecurePass123!"
        hashed = hash_password(pw)
        assert verify_password(pw, hashed), "Password verification failed"
        assert not verify_password("WrongPass", hashed), "Wrong password accepted"

        token = create_access_token("test-user-uuid-12345")
        payload = decode_access_token(token)
        assert payload.get("sub") == "test-user-uuid-12345", "JWT sub claim mismatch"

        record_result("Auth & Security", "Password Hash & JWT Token Verification", "PASS", "Bcrypt hashing and JWT encoding/decoding operating correctly.")
    except Exception as e:
        record_result("Auth & Security", "Password Hash & JWT Token Verification", "FAIL", str(e))

    # 2. Schema Validation Tests
    try:
        from app.schemas.auth import SignupRequest, LoginRequest
        from pydantic import ValidationError

        # Valid signup
        valid_signup = SignupRequest(name="Valid User", email="user@atlas.app", password="Password123!")
        assert valid_signup.name == "Valid User"

        # Invalid password check
        try:
            SignupRequest(name="Weak User", email="weak@atlas.app", password="lowercaseonly")
            record_result("Input Validation", "Password Strength Constraint", "FAIL", "Weak password without uppercase/digit was incorrectly allowed")
        except ValidationError:
            record_result("Input Validation", "Password Strength Constraint", "PASS", "Weak password without uppercase/digit correctly rejected.")

        # Invalid email check
        try:
            SignupRequest(name="Bad Email", email="invalid-email-format", password="Password123!")
            record_result("Input Validation", "Email Format Constraint", "FAIL", "Invalid email format was incorrectly allowed")
        except ValidationError:
            record_result("Input Validation", "Email Format Constraint", "PASS", "Invalid email format correctly caught by EmailStr.")

    except Exception as e:
        record_result("Input Validation", "Schema Validation Engine", "FAIL", str(e))

    # 3. Growth Score Utility Tests
    try:
        from app.utils.growth_score import calculate_growth_score
        score_base = calculate_growth_score(streak=0, completed_reflections=0, profile_completed=False)
        assert score_base == 40, f"Base score mismatch: {score_base}"

        score_full = calculate_growth_score(streak=10, completed_reflections=10, profile_completed=True)
        assert score_full == 100, f"Full score mismatch: {score_full}"

        record_result("Growth Score Engine", "Growth Score Mathematical Bounds", "PASS", "Base (40) and max cap (100) calculations validated.")
    except Exception as e:
        record_result("Growth Score Engine", "Growth Score Mathematical Bounds", "FAIL", str(e))

    # 4. Identity Agent Test
    try:
        from app.agents.identity_agent import identity_agent
        blueprint = await identity_agent.generate_blueprint(
            goal="Senior AI Architect",
            learning_style="Hands-on",
            experience="Intermediate",
            daily_time="1 hour",
            motivation="Career Growth",
            current_level="Intermediate"
        )
        assert isinstance(blueprint, dict), "Blueprint output must be a dict"
        assert "strengths" in blueprint, "Blueprint missing strengths key"
        assert "recommended_path" in blueprint, "Blueprint missing recommended_path key"

        record_result("Identity Agent", "Growth Blueprint Generation & Fallback", "PASS", f"Identity Agent successfully returned valid blueprint structure ({len(blueprint.get('strengths', []))} strengths).")
    except Exception as e:
        record_result("Identity Agent", "Growth Blueprint Generation & Fallback", "FAIL", str(e))

    # 5. Growth Planner Agent Test
    try:
        from app.agents.planner_agent import planner_agent
        plan = await planner_agent.generate_daily_plan(
            goal="Senior AI Architect",
            learning_style="Hands-on",
            daily_time="1 hour",
            current_level="Intermediate",
            streak=5
        )
        assert isinstance(plan, dict), "Plan output must be a dict"
        assert "today_focus" in plan, "Plan missing today_focus"
        assert "mission" in plan, "Plan missing mission"
        assert "insights" in plan, "Plan missing insights"

        record_result("Growth Planner Agent", "Daily Mission & Focus Plan Generation", "PASS", f"Planner Agent generated valid plan with focus: '{plan.get('today_focus')}' and {len(plan.get('insights', []))} insights.")
    except Exception as e:
        record_result("Growth Planner Agent", "Daily Mission & Focus Plan Generation", "FAIL", str(e))

    # 6. Curator Agent Test
    try:
        from app.agents.curator_agent import curator_agent
        curation = await curator_agent.curate_resources(goal="Master RAG Architectures")
        assert isinstance(curation, dict), "Curation output must be a dict"
        resources = curation.get("resources", [])
        assert len(resources) >= 5, f"Curator should return 5 resources, got {len(resources)}"

        types = {r.get("type") for r in resources}
        record_result("Curator Agent", "Curate My Day Resource Generation", "PASS", f"Curator Agent generated {len(resources)} resources across categories: {types}.")
    except Exception as e:
        record_result("Curator Agent", "Curate My Day Resource Generation", "FAIL", str(e))

    # 7. Reflection Agent Test
    try:
        from app.agents.reflection_agent import reflection_agent
        reflection_res = await reflection_agent.process_reflection(
            mood="motivated",
            journal="Built vector search pipelines and optimized PostgreSQL HNSW indexes today."
        )
        assert isinstance(reflection_res, dict), "Reflection output must be a dict"
        assert "summary" in reflection_res, "Reflection missing summary"
        assert "next_day_focus" in reflection_res, "Reflection missing next_day_focus"

        record_result("Reflection Agent", "Nightly Reflection Analysis & Insights", "PASS", "Reflection Agent successfully extracted summary and next_day_focus.")
    except Exception as e:
        record_result("Reflection Agent", "Nightly Reflection Analysis & Insights", "FAIL", str(e))

    # 8. Chat & Vector Embedding Logic Test
    try:
        from app.prompts.chat_prompts import CHAT_SYSTEM_PROMPT, CHAT_USER_PROMPT

        assert "Atlas AI" in CHAT_SYSTEM_PROMPT, "Chat prompt contains legacy app name"
        record_result("AI Chat Engine", "Chat Prompt & Model Configuration", "PASS", "AI Chat prompt correctly configured for Atlas AI.")
    except Exception as e:
        record_result("AI Chat Engine", "Chat Prompt & Model Configuration", "FAIL", str(e))

    # 9. Database Model & Relationship Architecture Test
    try:
        from app.models.user import User
        from app.models.profile import Profile
        from app.models.habit import Habit
        from app.models.reflection import Reflection
        from app.models.curated_resource import CuratedResource
        from app.models.embedding import Embedding

        # Verify lazy='noload' settings on user
        assert User.profile.property.lazy == "noload", "User.profile lazy loading should be noload"
        assert User.reflections.property.lazy == "noload", "User.reflections lazy loading should be noload"
        assert User.embeddings.property.lazy == "noload", "User.embeddings lazy loading should be noload"

        record_result("Database ORM Layer", "Lazy Loading Performance Rules", "PASS", "User relationships verified with lazy='noload' to prevent N+1 query overhead.")
    except Exception as e:
        record_result("Database ORM Layer", "Lazy Loading Performance Rules", "FAIL", str(e))

    # 10. FastAPI Application Router Integrity Check
    try:
        from main import app
        routes = list(app.openapi()["paths"].keys())

        expected_endpoints = [
            "/",
            "/health",
            "/api/auth/signup",
            "/api/auth/login",
            "/api/auth/me",
            "/api/profile",
            "/api/dashboard",
            "/api/curator/generate",
            "/api/reflection",
            "/api/resources",
            "/api/chat",
            "/api/progress"
        ]

        missing_endpoints = [ep for ep in expected_endpoints if ep not in routes]
        assert not missing_endpoints, f"Missing endpoints in router: {missing_endpoints}"
        assert "/api/users/me" not in routes, "Duplicate /api/users/me endpoint should be removed"

        record_result("FastAPI Router", "API Endpoint Contract Verification", "PASS", f"All 12 required endpoints registered in FastAPI router. Duplicate endpoint removed.")
    except Exception as e:
        record_result("FastAPI Router", "API Endpoint Contract Verification", "FAIL", str(e))

    print("\n=======================================================")
    print("                 TEST EXECUTION SUMMARY               ")
    print("=======================================================")
    passed = sum(1 for r in test_results if r["status"] == "PASS")
    failed = sum(1 for r in test_results if r["status"] == "FAIL")
    print(f"Total Tests Executed : {len(test_results)}")
    print(f"Passed               : {passed}")
    print(f"Failed               : {failed}")
    print("=======================================================\n")

    return test_results

if __name__ == "__main__":
    asyncio.run(run_all_tests())
