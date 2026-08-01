from __future__ import annotations
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

class GraphNode(BaseModel):
    id: str = Field(..., description="Unique node identifier, e.g. n1, n2")
    type: Literal["section", "topic", "subtopic", "quiz", "project"] = Field("topic", description="Node milestone classification")
    label: str = Field(..., description="Short title label for the node")
    description: Optional[str] = Field("", description="Concept summary or milestone description")
    tier: int = Field(0, description="Vertical sequencing tier (0, 1, 2, ...)")
    estimatedHours: Optional[int] = Field(2, description="Estimated study time in hours")
    status: Optional[str] = Field("not_started", description="Completion status: not_started, in_progress, completed")
    activityType: Optional[str] = Field("VIDEO_LESSON", description="Target activity type: VIDEO_LESSON, QUIZ, CODE_CHALLENGE")

class GraphEdge(BaseModel):
    id: str = Field(..., description="Unique edge identifier, e.g. e_n1_n2")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    isDashed: bool = Field(False, description="True for side branches or optional checkpoints")
    label: Optional[str] = Field(None, description="Optional edge label text")

class MindMapSchema(BaseModel):
    subjectId: str = Field(..., description="Unique subject identifier")
    subjectTitle: Optional[str] = Field(None, description="Formatted subject title")
    mermaidGraph: Optional[str] = Field(None, description="Mermaid.js 'graph TD' string")
    nodes: List[GraphNode] = Field(default_factory=list, description="DAG flowchart nodes")
    edges: List[GraphEdge] = Field(default_factory=list, description="DAG flowchart edges")

class MindMapRequest(BaseModel):
    subject: str = Field(..., description="The subject title for which to generate the mindmap flowchart.")
