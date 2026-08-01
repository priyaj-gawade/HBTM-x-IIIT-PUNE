"""Users API routes - admin & user utility management."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/users", tags=["Users"])

# Note: GET /api/auth/me is the primary user profile endpoint.
# Admin user management endpoints will be registered under /api/users in future releases.
