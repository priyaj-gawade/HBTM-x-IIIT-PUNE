"""Custom domain exceptions for Atlas AI Backend."""

class AtlasBaseError(Exception):
    """Base exception class for application domain errors."""
    pass


class UserNotFoundError(AtlasBaseError):
    """Raised when a requested user is not found."""
    pass


class DuplicateEmailError(AtlasBaseError):
    """Raised when trying to register an email that already exists."""
    pass


class InvalidCredentialsError(AtlasBaseError):
    """Raised when login authentication fails."""
    pass


class ProfileNotFoundError(AtlasBaseError):
    """Raised when a profile is requested but does not exist."""
    pass


class AIGenerationError(AtlasBaseError):
    """Raised when AI agent or Gemini generation fails unexpectedly."""
    pass
