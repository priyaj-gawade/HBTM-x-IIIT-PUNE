from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.skill_node import SkillNode
from app.schemas.learning_path import SyllabusUploadRequest, SkillNodeResponse
from app.services import learning_path_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/v1/mindmap", tags=["Mindmaps (Learning Path)"])

@router.post("/generate", response_model=List[SkillNodeResponse])
async def generate_path(
    request: SyllabusUploadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    text = f"Subject: {request.subjectTitle}, Persona: {request.persona}"
    nodes_schema = await learning_path_service.generate_path_from_syllabus(text)
    
    # Save to DB
    saved_nodes = []
    for n in nodes_schema:
        sn = SkillNode(
            user_id=request.user_id,
            title=n.title,
            description=n.description,
            prerequisite_ids=n.prerequisite_ids,
            status="LOCKED"
        )
        db.add(sn)
        saved_nodes.append(sn)
        
    if saved_nodes:
        saved_nodes[0].status = "ACTIVE" # unlock first
        
    await db.commit()
    for sn in saved_nodes:
        await db.refresh(sn)
        
    return saved_nodes

@router.get("/{user_id}", response_model=List[SkillNodeResponse])
async def get_tree(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(SkillNode).where(SkillNode.user_id == user_id))
    return result.scalars().all()

@router.post("/node/{node_id}/complete")
async def complete_node(
    node_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(SkillNode).where(SkillNode.id == node_id, SkillNode.user_id == current_user.id))
    node = result.scalars().first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
        
    node.status = "MASTERED"
    db.add(node)
    await db.commit()
    
    return {"message": "Node Mastered"}
