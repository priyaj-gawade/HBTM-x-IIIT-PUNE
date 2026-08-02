import json
import uuid
from fastapi import APIRouter, HTTPException

from app.utils.llm_manager import llm_manager
from app.schemas.mindmap import MindMapRequest, MindMapSchema

router = APIRouter(prefix="/api/mindmap", tags=["Mindmap"])

FLOWCHART_SYSTEM_PROMPT = """You are an authoritative Curriculum Architect and Knowledge Graph Engineer.

Given a learning subject, generate a comprehensive DAG learning flowchart as a strict JSON object.

RULES:
1. Generate 8 to 14 well-structured concept nodes organized in sequential learning tiers:
   - "section": major phase/module milestone header
   - "topic": essential core concept along the main spine/trunk
   - "subtopic": specialized side branch concept
   - "quiz": quick checkpoint evaluation activity
   - "project": practical coding/architecture project milestone
2. Connect nodes logically via "edges" (source -> target).
3. Generate a clean "mermaidGraph" string (using 'graph TD') representing the flowchart. Do NOT wrap it with markdown triple backticks.
4. Set realistic "estimatedHours" (1 to 8) and "tier" (0 to 6) for proper vertical progression.
5. Set "activityType" to "VIDEO_LESSON", "QUIZ", or "CODE_CHALLENGE".

OUTPUT SCHEMA:
{
  "subjectId": "s_12345678",
  "subjectTitle": "Subject Name",
  "mermaidGraph": "graph TD\\n  n1[Module 1: Foundations] --> n2[Variables & Types]\\n  n2 --> n3[Control Flow]\\n  n3 -.-> n4(Quiz: Basics)\\n  ...",
  "nodes": [
    {
      "id": "n1",
      "type": "section",
      "label": "Module 1: Foundations",
      "description": "Core syntax and fundamentals",
      "tier": 0,
      "estimatedHours": 2,
      "status": "not_started",
      "activityType": "VIDEO_LESSON"
    },
    {
      "id": "n2",
      "type": "topic",
      "label": "Variables & Types",
      "description": "Primitives and memory allocation",
      "tier": 1,
      "estimatedHours": 3,
      "status": "not_started",
      "activityType": "VIDEO_LESSON"
    },
    {
      "id": "n3",
      "type": "quiz",
      "label": "Quiz: Basics Checkpoint",
      "description": "Interactive assessment",
      "tier": 1,
      "estimatedHours": 1,
      "status": "not_started",
      "activityType": "QUIZ"
    }
  ],
  "edges": [
    {
      "id": "e_n1_n2",
      "source": "n1",
      "target": "n2",
      "isDashed": false
    },
    {
      "id": "e_n2_n3",
      "source": "n2",
      "target": "n3",
      "isDashed": true
    }
  ]
}

OUTPUT: Return ONLY valid raw JSON without markdown wrapping.
"""

@router.post("/generate", response_model=MindMapSchema)
async def generate_mindmap(request: MindMapRequest):
    if not llm_manager.keys:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")

    prompt = f"Generate a comprehensive curriculum flowchart DAG for the subject: {request.subject}"

    try:
        response = await llm_manager.generate_content_async(
            prompt=prompt,
            model_name="gemini-3.1-flash-lite",
            system_instruction=FLOWCHART_SYSTEM_PROMPT,
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": MindMapSchema
            }
        )
        from app.utils.llm_manager import parse_json_guarded
        data = parse_json_guarded(response.text, MindMapSchema)
        
        # Clean up mermaidGraph string if enclosed in backticks
        if data.get("mermaidGraph"):
            mg = data["mermaidGraph"]
            if mg.startswith("```mermaid"):
                mg = mg[10:]
            if mg.startswith("```"):
                mg = mg[3:]
            if mg.endswith("```"):
                mg = mg[:-3]
            data["mermaidGraph"] = mg.strip()

        # Ensure subjectId and subjectTitle are populated
        if not data.get("subjectId") or data.get("subjectId") == "string":
            data["subjectId"] = "s_" + str(uuid.uuid4())[:8]
        if not data.get("subjectTitle"):
            data["subjectTitle"] = request.subject

        # Validate nodes and edges
        if "nodes" not in data or not isinstance(data["nodes"], list):
            data["nodes"] = []
        if "edges" not in data or not isinstance(data["edges"], list):
            data["edges"] = []

        return data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Mindmap generation failed: {str(e)}")
