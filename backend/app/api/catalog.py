from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/api/catalog", tags=["Catalog"])

# Hardcoded list from legacy Java backend
courses: List[Dict[str, Any]] = [
    {
        "id": "c1", 
        "title": "Spring Boot Microservices", 
        "category": "Backend", 
        "difficulty": "Advanced", 
        "tags": ["Java", "Spring", "Microservices"], 
        "estimatedHours": 24, 
        "thumbnailUrl": ""
    },
    {
        "id": "c2", 
        "title": "React Native for Mobile", 
        "category": "Frontend", 
        "difficulty": "Intermediate", 
        "tags": ["React", "Mobile"], 
        "estimatedHours": 18, 
        "thumbnailUrl": ""
    },
    {
        "id": "c3", 
        "title": "Python Data Science", 
        "category": "Data", 
        "difficulty": "Beginner", 
        "tags": ["Python", "Pandas", "ML"], 
        "estimatedHours": 40, 
        "thumbnailUrl": ""
    },
    {
        "id": "c4", 
        "title": "PostgreSQL Optimization", 
        "category": "Database", 
        "difficulty": "Advanced", 
        "tags": ["SQL", "Performance"], 
        "estimatedHours": 12, 
        "thumbnailUrl": ""
    }
]

@router.get("/all")
async def get_all_courses():
    return courses

@router.get("/recommendations")
async def get_recommendations(domain: str = None):
    # Ported logic: return first two
    return courses[:2]

@router.get("/search")
async def search_courses(query: str):
    if not query or not query.strip():
        return courses
    q = query.lower()
    return [c for c in courses if q in c["title"].lower() or q in c["category"].lower()]
