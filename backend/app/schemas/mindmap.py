from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field

class MindMapNode(BaseModel):
    id: str = Field(..., description="Unique string identifier (e.g. root_1, n1, n1_1)")
    label: str = Field(..., description="Short text label, 2 to 5 words maximum")
    depthLevel: int = Field(..., description="Integer (0, 1, or 2)")
    isTerminal: bool = Field(..., description="false for depth 0 and 1, true for depth 2")
    children: List[MindMapNode] = Field(default_factory=list, description="Array of child nodes")

class MindMapSchema(BaseModel):
    subjectId: str = Field(..., description="A unique identifier for the subject, e.g., an 8 character short uuid string.")
    rootNode: MindMapNode = Field(..., description="Exactly ONE root node at depthLevel 0")

class MindMapRequest(BaseModel):
    subject: str = Field(..., description="The subject title for which to generate the mindmap.")
