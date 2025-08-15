from enum import Enum
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

from .task import Task

class Project(BaseModel):
    id: str
    name: str
    description: str
    requirements: List[str]
    tech_stack: List[str]
    status: ProjectStatus
    tasks: List[Task] = []
    created_at: datetime
    updated_at: datetime

class ProjectCreate(BaseModel):
    name: str
    description: str
    requirements: List[str]
    tech_stack: List[str]