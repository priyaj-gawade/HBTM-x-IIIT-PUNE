from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class RoadmapActivity(BaseModel):
    id: str = "act-1"
    title: str = "Activity"
    type: str = "Watch Video"
    status: str = "Pending"
    estimatedTime: str = "15m"

class RoadmapSection(BaseModel):
    id: str = "sec-1"
    title: str = "Section"
    estimatedTime: str = "45m"
    activities: List[RoadmapActivity] = Field(default_factory=list)

class RoadmapModule(BaseModel):
    id: str = "mod-1"
    title: str = "Module"
    subtitle: str = "Module Description"
    progressPercent: float = 0.0
    sections: List[RoadmapSection] = Field(default_factory=list)

class RoadmapGenerationRequest(BaseModel):
    topic: str
    target_role: Optional[str] = "Learner"
    experience_level: Optional[str] = "Beginner"

class RoadmapGenerationResponse(BaseModel):
    modules: List[RoadmapModule]
