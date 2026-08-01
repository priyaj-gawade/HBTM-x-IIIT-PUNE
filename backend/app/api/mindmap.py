import json
import uuid
import google.generativeai as genai
from fastapi import APIRouter, HTTPException

from app.utils.llm_manager import llm_manager
from app.schemas.mindmap import MindMapRequest, MindMapSchema

router = APIRouter(prefix="/api/mindmap", tags=["Mindmap"])

MINDMAP_SYSTEM_PROMPT = """
You are a subject-matter expert and curriculum designer.
                
Given a learning subject, generate a concept mind map as a JSON object.

STRUCTURE RULES:
- Exactly ONE root node at depthLevel 0 (the subject itself)
- 4 to 7 primary branch nodes at depthLevel 1 (major sub-topics)
- 2 to 4 leaf nodes at depthLevel 2 under each branch (specific concepts)
- No deeper nesting. Maximum depth is 2.

FIELD RULES:
- "id": unique string (format: root_1, n1, n1_1, n2, n2_1, etc.)
- "label": short text, 2 to 5 words maximum
- "depthLevel": integer (0, 1, or 2)
- "isTerminal": false for depth 0 and 1, true for depth 2
- "children": array of child nodes (empty array [] for leaf nodes)
"""

@router.post("/generate", response_model=MindMapSchema)
async def generate_mindmap(request: MindMapRequest):
    if not llm_manager.keys:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")

    prompt = f"Generate a mind map for the subject: {request.subject}"

    try:
        response = await llm_manager.generate_content_async(
            prompt=prompt,
            model_name="gemini-3.1-flash-lite",
            system_instruction=MINDMAP_SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        data = json.loads(response.text)
        
        # Ensure subjectId is populated if not provided perfectly by the LLM
        if not data.get("subjectId") or data.get("subjectId") == "string":
            data["subjectId"] = "s_" + str(uuid.uuid4())[:8]
            
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mindmap generation failed: {str(e)}")
