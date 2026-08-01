from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
import uuid
import time

from app.db.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_workspaces(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.user_id == current_user.id))
    workspaces = result.scalars().all()
    # Return just the data part to match the legacy Java API behavior
    return [ws.data for ws in workspaces]

@router.get("/{workspace_id}")
async def get_workspace(workspace_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ws.data

@router.post("")
async def create_workspace(payload: WorkspaceCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    ws_id = payload.id or f"ws_{int(time.time()*1000)}"
    new_ws = Workspace(
        id=ws_id,
        user_id=current_user.id,
        title=payload.title,
        data=payload.data
    )
    db.add(new_ws)
    await db.commit()
    await db.refresh(new_ws)
    return new_ws.data

@router.put("/{workspace_id}")
async def update_workspace(workspace_id: str, payload: WorkspaceUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    if payload.title is not None:
        ws.title = payload.title
    if payload.data is not None:
        ws.data = payload.data
        
    await db.commit()
    await db.refresh(ws)
    return ws.data

@router.delete("/{workspace_id}")
async def delete_workspace(workspace_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    await db.delete(ws)
    await db.commit()
    return {"status": "deleted"}
