from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
import json

from app.utils.config import settings
from app.schemas.roadmap import RoadmapGenerationRequest, RoadmapGenerationResponse, RoadmapModule
from app.utils.llm_manager import llm_manager

router = APIRouter(prefix="/api/roadmap", tags=["Roadmap"])

ROADMAP_SYSTEM_PROMPT = """You are an expert curriculum designer.
Generate a structured learning roadmap for the given topic.

Return a JSON object with this EXACT structure:
{
  "modules": [
    {
      "id": "mod-1",
      "title": "Module Title",
      "subtitle": "Short description of what you will learn",
      "progressPercent": 0.0,
      "sections": [
        {
          "id": "sec-1-1",
          "title": "Section Title",
          "estimatedTime": "45m",
          "activities": [
            {
              "id": "act-1-1-1",
              "title": "Activity Title",
              "type": "Watch Video",
              "status": "Pending",
              "estimatedTime": "15m"
            }
          ]
        }
      ]
    }
  ]
}
"""

@router.post("/generate", response_model=RoadmapGenerationResponse)
async def generate_roadmap(request: RoadmapGenerationRequest):
    prompt = f"Generate a detailed learning roadmap for: '{request.topic}'. Target audience: {request.target_role}. Level: {request.experience_level}."

    try:
        response = await llm_manager.generate_content_async(
            prompt=prompt,
            model_name="gemini-3.1-flash-lite",
            system_instruction=ROADMAP_SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json"}
        )
        from app.utils.llm_manager import parse_json_guarded
        data = parse_json_guarded(response.text)
        
        # Normalize if root is array or wrapped under 'roadmap'
        raw_modules = data.get("modules") or data.get("roadmap") or []
        if isinstance(data, list):
            raw_modules = data

        normalized_modules = []
        for m_idx, m in enumerate(raw_modules):
            mod_id = m.get("id") or f"mod-{m_idx + 1}"
            mod_title = m.get("title") or m.get("module_name") or f"Module {m_idx + 1}"
            mod_sub = m.get("subtitle") or m.get("description") or "Core curriculum module"
            
            raw_sections = m.get("sections") or []
            normalized_sections = []
            for s_idx, s in enumerate(raw_sections):
                sec_id = s.get("id") or f"sec-{m_idx + 1}-{s_idx + 1}"
                sec_title = s.get("title") or s.get("section_title") or f"Section {s_idx + 1}"
                sec_time = s.get("estimatedTime") or "45m"
                
                raw_activities = s.get("activities") or []
                normalized_activities = []
                for a_idx, a in enumerate(raw_activities):
                    if isinstance(a, str):
                        act_title = a
                        act_type = "Practice Lab" if "implement" in a.lower() or "build" in a.lower() else "Watch Video"
                    else:
                        act_title = a.get("title") or a.get("activity_title") or f"Activity {a_idx + 1}"
                        act_type = a.get("type") or "Watch Video"
                    
                    normalized_activities.append({
                        "id": f"act-{m_idx + 1}-{s_idx + 1}-{a_idx + 1}",
                        "title": act_title,
                        "type": act_type,
                        "status": "Pending",
                        "estimatedTime": "15m"
                    })
                
                normalized_sections.append({
                    "id": sec_id,
                    "title": sec_title,
                    "estimatedTime": sec_time,
                    "activities": normalized_activities
                })
            
            normalized_modules.append({
                "id": mod_id,
                "title": mod_title,
                "subtitle": mod_sub,
                "progressPercent": 0.0,
                "sections": normalized_sections
            })

        return {"modules": normalized_modules}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")
