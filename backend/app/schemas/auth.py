from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator, Field


class SignupRequest(BaseModel):
    """POST /api/auth/signup request body with validation."""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

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
    email: EmailStr
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
