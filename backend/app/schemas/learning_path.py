from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class SkillNodeBase(BaseModel):
    title: str = Field(description="Title of the skill or concept")
    description: str = Field(description="Brief description of the skill")
    prerequisite_ids: Optional[str] = Field(None, description="Comma separated IDs of prerequisite nodes")

class SkillNodeResponse(SkillNodeBase):
    id: UUID
    user_id: UUID
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class SyllabusUploadRequest(BaseModel):
    subjectTitle: str
    persona: str
    user_id: UUID
