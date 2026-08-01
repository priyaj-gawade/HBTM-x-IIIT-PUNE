from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
import google.generativeai as genai
import json

from app.utils.config import settings
from app.schemas.orchestration import (
    FlashcardGenerationRequest, FlashcardGenerationResponse,
    QuizGenerationRequest, QuizGenerationResponse,
    InterviewRequest, ProfilerOutputSchema, PersonaProfileSchema, InferredPersona
)
from app.prompts.orchestration_prompts import PROFILER_SYSTEM_PROMPT, PERSONA_SYSTEM_PROMPT
from app.prompts.sandbox_prompts import SANDBOX_EXPLAINER_PROMPT
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.embedding_service import embedding_service
from app.services.transcript_service import transcript_service
from app.utils.llm_manager import llm_manager

router = APIRouter(prefix="/api/orchestration", tags=["Orchestration"])

MOCK_FLASHCARDS = [
  { "id": "fc-1", "front": "What is Heap Memory?", "back": "A region of memory used for dynamic allocation, where variables are allocated and freed manually or via garbage collection." },
  { "id": "fc-2", "front": "What is a Stack?", "back": "A linear data structure that follows the Last In, First Out (LIFO) principle." },
  { "id": "fc-3", "front": "Garbage Collection", "back": "An automatic memory management feature that reclaims memory occupied by objects that are no longer in use." },
]

MOCK_MICRO_QUIZ = [
  {
    "id": 'q1',
    "topicTag": 'Python Basics',
    "questionText": 'What is the correct syntax to output "Hello World" in Python?',
    "type": 'mcq',
    "options": [
      { "id": 'opt1', "text": 'echo "Hello World"', "isCorrect": False },
      { "id": 'opt2', "text": 'print("Hello World")', "isCorrect": True },
      { "id": 'opt3', "text": 'console.log("Hello World")', "isCorrect": False },
      { "id": 'opt4', "text": 'printf("Hello World")', "isCorrect": False },
    ]
  }
]

@router.post("/flashcards", response_model=FlashcardGenerationResponse)
async def generate_flashcards(request: FlashcardGenerationRequest):
    if not llm_manager.keys:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")

    transcript_context = ""
    if request.video_id and request.video_timestamp is not None:
        transcript = transcript_service.get_cumulative_transcript(request.video_id, request.video_timestamp)
        if transcript:
            transcript_context = f"\n\nContext from current lecture video up to this point:\n{transcript}"

    prompt = f"""
    Create {request.count} educational flashcards about "{request.topic}".
    Each flashcard needs a 'front' (the question or term) and a 'back' (the answer or definition).{transcript_context}
    Output as JSON.
    """
    
    try:
        response = await llm_manager.generate_content_async(
            prompt=prompt,
            model_name="gemini-3.1-flash-lite",
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assessments/generate", response_model=QuizGenerationResponse)
async def generate_quiz(request: QuizGenerationRequest):
    if not llm_manager.keys:
        return {"questions": MOCK_MICRO_QUIZ}

    prompt = f"""
    Create a quiz with {request.count} questions about "{request.topic}" at a {request.difficulty} difficulty level.
    The output should be a JSON object with format:
    {{
        "questions": [
            {{
                "id": "q1",
                "topicTag": "{request.topic}",
                "questionText": "Question text here",
                "type": "mcq",
                "options": [
                    {{"id": "opt1", "text": "Option 1", "isCorrect": true}},
                    {{"id": "opt2", "text": "Option 2", "isCorrect": false}}
                ]
            }}
        ]
    }}
    """
    
    try:
        response = await llm_manager.generate_content_async(
            prompt=prompt,
            model_name="gemini-3.1-flash-lite",
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception:
        return {"questions": MOCK_MICRO_QUIZ}

@router.post("/interview", response_model=ProfilerOutputSchema)
async def trigger_interview(request: InterviewRequest):
    if not llm_manager.keys:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")
        
    prompt = PROFILER_SYSTEM_PROMPT.format(history=request.history)
    
    try:
        response = await llm_manager.generate_content_async(
            prompt=request.message,
            model_name="gemini-3.1-flash-lite",
            system_instruction=prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        data = json.loads(response.text)
        reply = (
            data.get("replyToUser") or 
            data.get("reply_to_user") or 
            data.get("reply") or 
            data.get("message") or 
            data.get("response") or 
            data.get("text") or 
            "Hello! I am Atlas Tutor. What subject or skill would you like to master today?"
        )
        options = data.get("options") or ["I'm ready to learn", "Explore topics"]
        state = data.get("internalState") or data.get("internal_state") or {}
        
        return {
            "replyToUser": reply,
            "options": options,
            "internalState": state
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interview/complete", response_model=PersonaProfileSchema)
async def complete_interview(persona: InferredPersona):
    if not llm_manager.keys:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")
        
    context = f"Domain: {persona.domain}, Subject: {persona.subject}, IQ Logic: {persona.iq_logic}, EQ Resilience: {persona.eq_resilience}"
    
    try:
        response = await llm_manager.generate_content_async(
            prompt=f"Generate a persona profile for a learner described as follows: {context}",
            model_name="gemini-3.1-flash-lite",
            system_instruction=PERSONA_SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        data = json.loads(response.text)
        return {
            "renderMode": data.get("renderMode") or "default",
            "title": data.get("title") or "The Dedicated Learner",
            "subtitle": data.get("subtitle") or f"Mastering {persona.subject or 'Core Concepts'}",
            "summary": data.get("summary") or "A systematic approach to hands-on learning and concept mastery.",
            "traits": data.get("traits") or ["Analytical", "Methodical", "Resilient"],
            "metrics": data.get("metrics") or {
                "visualization": 0.8,
                "theory": 0.7,
                "practice": 0.9,
                "pace": 0.6,
                "retention": 0.85
            },
            "blueprintNodes": data.get("blueprintNodes") or ["Foundations", "Core Practice", "Mastery Project"]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class CanvasExplainRequest(BaseModel):
    video_id: str
    video_timestamp: int
    video_transcript: Optional[str] = None
    language: str = "English"
    difficulty_instructions: str = ""
    question: str

@router.post("/canvas-explain")
async def canvas_explain(request: CanvasExplainRequest, db: AsyncSession = Depends(get_db)):
    if not llm_manager.keys:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")
        
    # Get transcript context
    transcript_text = request.video_transcript
    if not transcript_text:
        transcript_text = transcript_service.get_cumulative_transcript(
            request.video_id, request.video_timestamp
        ) or f"Video {request.video_id} segment at timestamp {request.video_timestamp}s."

    # Search RAG
    try:
        # We use a hardcoded user_id for now for anonymous sandbox
        memories = await embedding_service.search_similar(db, 0, request.question, limit=3)
        context = "\n".join(memories) if memories else transcript_text
    except Exception:
        context = transcript_text
        
    system_prompt = SANDBOX_EXPLAINER_PROMPT.format(
        video_timestamp=request.video_timestamp,
        video_id=request.video_id,
        video_transcript=context,
        language=request.language,
        difficulty_instructions=request.difficulty_instructions
    )
    
    try:
        # Use a non-structured output model for explanation (text + markdown/canvas-diagram JSON)
        response = await llm_manager.generate_content_async(
            prompt=request.question,
            model_name="gemini-3.1-flash-lite",
            system_instruction=system_prompt
        )
        return {"explanation": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
