from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
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
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assessments/generate", response_model=QuizGenerationResponse)
async def generate_quiz(request: QuizGenerationRequest):
    if not llm_manager.keys:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")

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
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
            generation_config={"response_mime_type": "application/json"}
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
        
    context = (
        f"Domain: {persona.domain or 'General'}, "
        f"Subject: {persona.subject or 'Core Concepts'}, "
        f"IQ/Logic: {persona.iq_logic or 'High'}, "
        f"EQ/Resilience: {persona.eq_resilience or 'Medium'}, "
        f"Time Commitment: {persona.time_commitment or 'Flexible'}"
    )
    
    try:
        response = await llm_manager.generate_content_async(
            prompt=f"Generate a customized persona profile for a learner described as follows: {context}",
            model_name="gemini-3.1-flash-lite",
            system_instruction=PERSONA_SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json"},
        )
        data = json.loads(response.text)

        # Normalize blueprint nodes cleanly whether returned as dicts or strings
        raw_nodes = data.get("blueprintNodes") or []
        normalized_nodes = []
        for idx, node in enumerate(raw_nodes):
            if isinstance(node, str):
                normalized_nodes.append({
                    "id": f"node-{idx+1}",
                    "dayRange": f"Phase {idx+1}",
                    "title": node,
                    "description": f"Targeted milestone for {node}",
                    "topics": [node]
                })
            elif isinstance(node, dict):
                normalized_nodes.append({
                    "id": node.get("id") or f"node-{idx+1}",
                    "dayRange": node.get("dayRange") or f"Phase {idx+1}",
                    "title": node.get("title") or node.get("name") or f"Phase {idx+1}",
                    "description": node.get("description") or node.get("summary") or "",
                    "topics": node.get("topics") or []
                })

        # Ensure default metrics structure if any keys missing
        metrics = data.get("metrics") or {}
        
        def safe_metric(key: str, default: int) -> int:
            val = metrics.get(key, default)
            try:
                val = float(val)
                return int(val * 100) if val <= 1.0 else int(val)
            except (ValueError, TypeError):
                return default

        default_metrics = {
            "Analytical": safe_metric("analytical", 85),
            "Practical": safe_metric("practical", 80),
            "Consistency": safe_metric("consistency", 75),
            "Focus": safe_metric("focus", 70),
            "Time Factor": safe_metric("time_factor", 75),
        }

        return {
            "renderMode": data.get("renderMode") or "default",
            "title": data.get("title") or "The Adaptive Learner",
            "subtitle": data.get("subtitle") or f"Mastery of {persona.subject or 'Core Concepts'}",
            "summary": data.get("summary") or f"Targeted learning path focusing on {persona.subject or 'core concepts'}.",
            "traits": data.get("traits") or ["Analytical", "Motivated"],
            "metrics": default_metrics,
            "blueprintNodes": normalized_nodes
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
