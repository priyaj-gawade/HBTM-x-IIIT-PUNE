from datetime import datetime
import re
from pydantic import BaseModel, field_validator, Field


class SignupRequest(BaseModel):
    """POST /api/auth/signup request body with validation."""
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        stripped = v.strip().lower()
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", stripped):
            raise ValueError("Invalid email format")
        return stripped

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Name cannot be empty or whitespace only")
        return stripped

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    """POST /api/auth/login request body."""
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    """POST /api/auth/google request body."""
    access_token: str


class AuthResponse(BaseModel):
    """Auth response with JWT token."""
    token: str
    user_id: str


class UserResponse(BaseModel):
    """GET /api/auth/me response."""
    id: str
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True
