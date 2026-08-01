from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class RoadmapActivity(BaseModel):
    id: str = Field(description="Unique identifier for the activity, e.g., 'act-1-1-1'")
    title: str = Field(description="Title of the activity")
    type: Literal['Watch Video', 'Read Article', 'Practice Lab', 'Take Quiz', 'Generate Flashcards'] = Field(description="Type of learning activity")
    status: Literal['Completed', 'In Progress', 'Pending'] = Field(description="Initial status, usually 'Pending'")
    estimatedTime: str = Field(description="Estimated time to complete, e.g., '15m' or '1h'")

class RoadmapSection(BaseModel):
    id: str = Field(description="Unique identifier for the section, e.g., 'sec-1-1'")
    title: str = Field(description="Title of the section")
    estimatedTime: str = Field(description="Estimated time to complete the section")
    activities: List[RoadmapActivity] = Field(description="List of activities in this section")

class RoadmapModule(BaseModel):
    id: str = Field(description="Unique identifier for the module, e.g., 'mod-1'")
    title: str = Field(description="Title of the module")
    subtitle: str = Field(description="Subtitle or description of the module")
    progressPercent: float = Field(description="Initial progress, usually 0.0")
    sections: List[RoadmapSection] = Field(description="List of sections in this module")

class RoadmapGenerationRequest(BaseModel):
    topic: str
    target_role: Optional[str] = "Learner"
    experience_level: Optional[str] = "Beginner"

class RoadmapGenerationResponse(BaseModel):
    modules: List[RoadmapModule]
