from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
import google.generativeai as genai
import json

from app.utils.config import settings
from app.schemas.roadmap import RoadmapGenerationRequest, RoadmapGenerationResponse, RoadmapModule
from app.utils.llm_manager import llm_manager

router = APIRouter(prefix="/api/roadmap", tags=["Roadmap"])

ROADMAP_SYSTEM_PROMPT = """
You are an expert curriculum designer. 
Generate a highly structured learning roadmap as a JSON object containing a list of 'modules'.
Each module should have 'sections', and each section should have 'activities'.
"""

@router.post("/generate", response_model=RoadmapGenerationResponse)
async def generate_roadmap(request: RoadmapGenerationRequest):
    if not llm_manager.keys:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")

    prompt = f"Generate a roadmap for the topic: '{request.topic}'. Target audience: {request.target_role}. Experience level: {request.experience_level}."

    try:
        response = await llm_manager.generate_content_async(
            prompt=prompt,
            model_name="gemini-3.1-flash-lite",
            system_instruction=ROADMAP_SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=RoadmapGenerationResponse
            )
        )
        roadmap_data = json.loads(response.text)
        return roadmap_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")
