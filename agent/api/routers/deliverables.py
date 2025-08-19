from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
import uuid

from models.deliverable import (
    Deliverable,
    DeliverableCreate,
    DeliverableType,
    DeliverableStatus,
    CodeFile
)

router = APIRouter()

# In-memory storage (replace with proper database in production)
deliverables = {}

@router.post("/", response_model=Deliverable)
async def create_deliverable(deliverable: DeliverableCreate):
    """Create a new deliverable"""
    deliverable_id = str(uuid.uuid4())
    
    new_deliverable = Deliverable(
        id=deliverable_id,
        status=DeliverableStatus.PENDING,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        **deliverable.dict()
    )
    
    deliverables[deliverable_id] = new_deliverable
    return new_deliverable

@router.get("/{deliverable_id}", response_model=Deliverable)
async def get_deliverable(deliverable_id: str):
    """Get a specific deliverable"""
    if deliverable_id not in deliverables:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    return deliverables[deliverable_id]

@router.get("/project/{project_id}", response_model=List[Deliverable])
async def get_project_deliverables(
    project_id: str,
    deliverable_type: Optional[DeliverableType] = None
):
    """Get all deliverables for a project, optionally filtered by type"""
    project_deliverables = [
        d for d in deliverables.values()
        if d.project_id == project_id
        and (deliverable_type is None or d.type == deliverable_type)
    ]
    return project_deliverables

@router.post("/{deliverable_id}/files", response_model=Deliverable)
async def add_code_files(deliverable_id: str, files: List[CodeFile]):
    """Add code files to a deliverable"""
    if deliverable_id not in deliverables:
        raise HTTPException(status_code=404, detail="Deliverable not found")
        
    deliverable = deliverables[deliverable_id]
    if deliverable.type != DeliverableType.CODE:
        raise HTTPException(status_code=400, detail="Deliverable is not a code deliverable")
    
    # Add new files
    deliverable.files.extend(files)
    deliverable.updated_at = datetime.now()
    
    return deliverable

@router.put("/{deliverable_id}/status", response_model=Deliverable)
async def update_deliverable_status(
    deliverable_id: str,
    status: DeliverableStatus
):
    """Update the status of a deliverable"""
    if deliverable_id not in deliverables:
        raise HTTPException(status_code=404, detail="Deliverable not found")
        
    deliverable = deliverables[deliverable_id]
    deliverable.status = status
    deliverable.updated_at = datetime.now()
    
    return deliverable
