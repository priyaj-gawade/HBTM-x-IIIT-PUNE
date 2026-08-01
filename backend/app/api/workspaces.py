from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional
import uuid
import time
from datetime import datetime

from app.db.database import get_db
from app.utils.security import get_current_user_optional
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])


def _format_workspace_response(ws: Workspace) -> Dict[str, Any]:
    """Helper to return unified workspace JSON containing both top-level and inner data fields."""
    raw_data = ws.data if isinstance(ws.data, dict) else {}
    progress_val = raw_data.get("progress")
    progress_pct = raw_data.get("progressPercent")
    
    if progress_val is None:
        if progress_pct is not None:
            progress_val = int(progress_pct * 100) if progress_pct <= 1.0 else int(progress_pct)
        else:
            progress_val = 0
            
    if progress_pct is None:
        progress_pct = float(progress_val) / 100.0 if progress_val > 1.0 else float(progress_val)

    # Use real DB timestamps, fall back to data blob, then to current time
    real_created = None
    if ws.created_at:
        real_created = ws.created_at.isoformat()
    elif raw_data.get("createdAt"):
        real_created = raw_data["createdAt"]
    else:
        real_created = datetime.utcnow().isoformat()

    real_updated = None
    if ws.updated_at:
        real_updated = ws.updated_at.isoformat()
    elif raw_data.get("lastOpened"):
        real_updated = raw_data["lastOpened"]
    else:
        real_updated = real_created

    # Display title: ws.title is already the subject for fixed records.
    # For new records, interview saves subject as title.
    # Fallback chain: ws.title → data.subject → data.activeLearningContext
    display_title = (
        ws.title
        or raw_data.get("subject")
        or raw_data.get("activeLearningContext")
        or "Untitled Workspace"
    )

    merged = {
        **raw_data,
        "id": ws.id,
        "title": display_title,
        "personaTitle": ws.title or raw_data.get("title"),
        "user_id": str(ws.user_id) if ws.user_id else None,
        "subject": raw_data.get("subject", "General"),
        "difficulty": raw_data.get("difficulty", "Intermediate"),
        "progress": progress_val,
        "progressPercent": progress_pct,
        "activeLearningContext": raw_data.get("activeLearningContext", "Foundations"),
        "lastOpened": real_updated,
        "createdAt": real_created,
    }
    return merged


@router.get("", response_model=List[Dict[str, Any]])
async def get_workspaces(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if current_user:
        result = await db.execute(select(Workspace).where(Workspace.user_id == current_user.id))
    else:
        result = await db.execute(select(Workspace))
    
    workspaces = result.scalars().all()
    return [_format_workspace_response(ws) for ws in workspaces]


@router.get("/{workspace_id}")
async def get_workspace(
    workspace_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if current_user:
        result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, (Workspace.user_id == current_user.id) | (Workspace.user_id == None)))
    else:
        result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return _format_workspace_response(ws)


@router.post("")
async def create_workspace(
    payload: WorkspaceCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    ws_id = payload.id or f"ws_{int(time.time()*1000)}"
    user_id = current_user.id if current_user else None
    
    data_dict = dict(payload.data) if payload.data else {}
    data_dict["id"] = ws_id
    if "lastOpened" not in data_dict:
        data_dict["lastOpened"] = datetime.utcnow().isoformat()
    if "createdAt" not in data_dict:
        data_dict["createdAt"] = datetime.utcnow().isoformat()
    if "title" not in data_dict and payload.title:
        data_dict["title"] = payload.title

    existing_res = await db.execute(select(Workspace).where(Workspace.id == ws_id))
    existing_ws = existing_res.scalar_one_or_none()
    if existing_ws:
        existing_ws.title = payload.title or existing_ws.title
        merged_data = {**(existing_ws.data or {}), **data_dict}
        existing_ws.data = merged_data
        await db.commit()
        await db.refresh(existing_ws)
        return _format_workspace_response(existing_ws)

    new_ws = Workspace(
        id=ws_id,
        user_id=user_id,
        title=payload.title or data_dict.get("title", "New Workspace"),
        data=data_dict
    )
    db.add(new_ws)
    await db.commit()
    await db.refresh(new_ws)
    return _format_workspace_response(new_ws)


@router.put("/{workspace_id}")
async def update_workspace(
    workspace_id: str,
    payload: WorkspaceUpdate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if current_user:
        result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, (Workspace.user_id == current_user.id) | (Workspace.user_id == None)))
    else:
        result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        
    ws = result.scalar_one_or_none()
    if not ws:
        user_id = current_user.id if current_user else None
        data_dict = dict(payload.data) if payload.data else {}
        data_dict["id"] = workspace_id
        data_dict["lastOpened"] = datetime.utcnow().isoformat()
        ws = Workspace(
            id=workspace_id,
            user_id=user_id,
            title=payload.title or data_dict.get("title", "Workspace"),
            data=data_dict
        )
        db.add(ws)
        await db.commit()
        await db.refresh(ws)
        return _format_workspace_response(ws)
    
    if payload.title is not None:
        ws.title = payload.title
    if payload.data is not None:
        merged_data = {**(ws.data or {}), **payload.data}
        merged_data["lastOpened"] = datetime.utcnow().isoformat()
        ws.data = merged_data
        if "title" in payload.data and not payload.title:
            ws.title = payload.data["title"]
        
    await db.commit()
    await db.refresh(ws)
    return _format_workspace_response(ws)


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if current_user:
        result = await db.execute(select(Workspace).where(Workspace.id == workspace_id, (Workspace.user_id == current_user.id) | (Workspace.user_id == None)))
    else:
        result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    await db.delete(ws)
    await db.commit()
    return {"status": "deleted", "id": workspace_id}

