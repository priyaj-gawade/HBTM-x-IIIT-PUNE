from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any

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
    time_commitment: Optional[str] = Field(default=None, alias="timeCommitment")

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

class BlueprintNode(BaseModel):
    id: Optional[str] = "node-1"
    dayRange: Optional[str] = None
    title: str = "Foundation"
    description: Optional[str] = "Core concepts overview"
    topics: List[str] = Field(default_factory=list)
    alternatives: List[str] = Field(default_factory=list)
    selectedFormat: Optional[str] = "Interactive Sandbox"
    isHandsOnFocus: bool = True

class MetricDetails(BaseModel):
    score: int = Field(default=80, description="Score from 1 to 100")
    meaning: str = Field(default="Baseline score", description="Short explanation of what this score means for the learner")

class PersonaMetrics(BaseModel):
    analytical: MetricDetails = Field(default_factory=MetricDetails)
    practical: MetricDetails = Field(default_factory=MetricDetails)
    consistency: MetricDetails = Field(default_factory=MetricDetails)
    focus: MetricDetails = Field(default_factory=MetricDetails)
    time_factor: MetricDetails = Field(default_factory=MetricDetails)

class PersonaProfileSchema(BaseModel):
    renderMode: str = "default"
    title: str = "Learner"
    subtitle: str = "Personalized learning path"
    summary: str = "Tailored study blueprint."
    traits: List[str] = Field(default_factory=list)
    metrics: PersonaMetrics
    blueprintNodes: List[BlueprintNode] = Field(default_factory=list)

class InterviewRequest(BaseModel):
    message: str = "I want to learn Spring Boot"
    history: str = "No prior history."
