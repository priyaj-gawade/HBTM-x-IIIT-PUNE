from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class Flashcard(BaseModel):
    id: str
    front: str
    back: str

class FlashcardGenerationRequest(BaseModel):
    topic: str
    count: Optional[int] = 5
    video_id: Optional[str] = None
    video_timestamp: Optional[int] = None

class FlashcardGenerationResponse(BaseModel):
    flashcards: List[Flashcard]

class QuizOption(BaseModel):
    id: str
    text: str
    isCorrect: bool

class QuestionItem(BaseModel):
    id: str
    topicTag: str
    questionText: str
    type: Literal['mcq', 'subjective', 'code'] = "mcq"
    options: Optional[List[QuizOption]] = Field(default_factory=list)
    codeInitialTemplate: Optional[str] = None
    codeSolution: Optional[str] = None
    expectedOutput: Optional[str] = None
    
class QuizGenerationRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "Intermediate"
    count: Optional[int] = 5

class QuizGenerationResponse(BaseModel):
    questions: List[QuestionItem]

class InferredPersona(BaseModel):
    domain: Optional[str] = None
    subject: Optional[str] = None
    iq_logic: Optional[str] = Field(default=None, alias="iqLogic")
    eq_resilience: Optional[str] = Field(default=None, alias="eqResilience")

    class Config:
        populate_by_name = True

class InternalState(BaseModel):
    domain_identified: bool = Field(default=False, alias="domainIdentified")
    eq_identified: bool = Field(default=False, alias="eqIdentified")
    modality_identified: bool = Field(default=False, alias="modalityIdentified")
    confidence_score: int = Field(default=0, alias="confidenceScore")
    current_inferred_persona: Optional[InferredPersona] = Field(default=None, alias="currentInferredPersona")

    class Config:
        populate_by_name = True

class ProfilerOutputSchema(BaseModel):
    reply_to_user: str = Field(default="", alias="replyToUser")
    options: List[str] = Field(default_factory=list, description="List of short interactive reply options (max 2-3).")
    internal_state: Optional[InternalState] = Field(default_factory=InternalState, alias="internalState")

    class Config:
        populate_by_name = True

class CognitiveMetrics(BaseModel):
    visualization: float = 0.5
    applied: float = 0.5
    theoretical: float = 0.5
    pacing: float = 0.5
    logic: float = 0.5

class BlueprintNode(BaseModel):
    id: str = "node-1"
    dayRange: str = "Day 1-3"
    title: str = "Foundation"
    description: str = "Core concepts overview"
    topics: List[str] = []
    alternatives: List[str] = []
    selectedFormat: str = "Interactive Sandbox"
    isHandsOnFocus: bool = True

class PersonaProfileSchema(BaseModel):
    renderMode: str = "default"
    title: str = "Learner"
    subtitle: str = "Personalized learning path"
    summary: str = "Tailored study blueprint."
    traits: List[str] = []
    metrics: CognitiveMetrics = Field(default_factory=CognitiveMetrics)
    blueprintNodes: List[BlueprintNode] = Field(default_factory=list)

class InterviewRequest(BaseModel):
    message: str = "I want to learn Spring Boot"
    history: str = "No prior history."
