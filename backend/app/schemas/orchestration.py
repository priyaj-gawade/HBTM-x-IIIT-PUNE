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
    type: Literal['mcq', 'subjective', 'code']
    options: List[QuizOption]
    
    codeInitialTemplate: Optional[str]
    codeSolution: Optional[str]
    expectedOutput: Optional[str]
    
class QuizGenerationRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "Intermediate"
    count: Optional[int] = 5

class QuizGenerationResponse(BaseModel):
    questions: List[QuestionItem]

class InferredPersona(BaseModel):
    domain: Optional[str]
    subject: Optional[str]
    iq_logic: Optional[str] = Field(..., alias="iqLogic")
    eq_resilience: Optional[str] = Field(..., alias="eqResilience")

class InternalState(BaseModel):
    domain_identified: bool = Field(..., alias="domainIdentified")
    eq_identified: bool = Field(..., alias="eqIdentified")
    modality_identified: bool = Field(..., alias="modalityIdentified")
    confidence_score: int = Field(..., alias="confidenceScore")
    current_inferred_persona: Optional[InferredPersona] = Field(..., alias="currentInferredPersona")

class ProfilerOutputSchema(BaseModel):
    reply_to_user: str = Field(..., alias="replyToUser")
    options: List[str] = Field(..., description="List of short interactive reply options (max 2-3). MUST include an option ending with '➔' if confidence_score >= 80.")
    internal_state: InternalState = Field(..., alias="internalState")

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
