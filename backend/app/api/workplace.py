from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
import uuid
import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.learning_plan import LearningPlan
from app.schemas.planner import GeneratePlanRequest, AdaptPlanRequest, TaskCompleteRequest
from app.services import planner_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces (Planner)"])

@router.post("")
async def generate_plan(
    request: GeneratePlanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal_summary = await planner_service.summarize_chat(request.chat_transcript)
    plan_data = await planner_service.generate_plan(goal_summary)
    
    result = await db.execute(select(LearningPlan).where(LearningPlan.user_id == current_user.id))
    plan = result.scalars().first()
    
    if not plan:
        plan = LearningPlan(user_id=current_user.id)
        db.add(plan)
        
    plan.goal_statement = goal_summary
    plan.plan_data = plan_data.model_dump()
    
    await db.commit()
    await db.refresh(plan)
    return plan

@router.get("/")
async def get_plan(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(LearningPlan).where(LearningPlan.user_id == current_user.id))
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@router.put("/task/{task_id}/complete")
async def complete_task(
    task_id: str,
    request: TaskCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(LearningPlan).where(LearningPlan.user_id == current_user.id))
    plan = result.scalars().first()
    if not plan or not plan.plan_data:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    # Update JSON
    data = plan.plan_data
    for milestone in data.get("milestones", []):
        for task in milestone.get("tasks", []):
            if task.get("id") == task_id:
                task["is_completed"] = True
                task["actual_time_spent_minutes"] = request.actual_time_spent_minutes
                
    plan.plan_data = data
    db.add(plan) # Flag for update
    await db.commit()
    await db.refresh(plan)
    return plan

@router.post("/adapt")
async def adapt_plan(
    request: AdaptPlanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(LearningPlan).where(LearningPlan.user_id == current_user.id))
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    context = f"Question: {request.failed_question}\nUser's incorrect answer: {request.user_answer}"
    remedial_task_schema = await planner_service.generate_remedial_task(context)
    
    task_dict = remedial_task_schema.model_dump()
    task_dict["id"] = str(uuid.uuid4())
    task_dict["is_completed"] = False
    if not task_dict["title"].startswith("[Remedial]"):
        task_dict["title"] = "[Remedial] " + task_dict["title"]
        
    data = plan.plan_data or {"milestones": []}
    
    # Inject logic (simplified: append to first incomplete milestone)
    injected = False
    if request.failed_task_id:
        for m in data.get("milestones", []):
            tasks = m.get("tasks", [])
            for i, t in enumerate(tasks):
                if t.get("id") == request.failed_task_id:
                    tasks.insert(i + 1, task_dict)
                    injected = True
                    break
            if injected: break
            
    if not injected and data.get("milestones"):
        data["milestones"][-1].get("tasks", []).append(task_dict)
        
    plan.plan_data = data
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan

@router.post("/reschedule")
async def reschedule_plan(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(LearningPlan).where(LearningPlan.user_id == current_user.id))
    plan = result.scalars().first()
    if not plan or not plan.plan_data:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    data = plan.plan_data
    for milestone in data.get("milestones", []):
        for task in milestone.get("tasks", []):
            if not task.get("is_completed") and task.get("deadline_date"):
                # shift 2 days
                dt = datetime.datetime.strptime(task["deadline_date"], "%Y-%m-%d").date()
                task["deadline_date"] = (dt + datetime.timedelta(days=2)).isoformat()
                
    plan.plan_data = data
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan
