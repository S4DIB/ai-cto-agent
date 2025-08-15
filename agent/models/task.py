from enum import Enum
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class Task(BaseModel):
    id: str
    project_id: str
    agent_id: Optional[str] = None
    title: str
    description: str
    status: TaskStatus
    dependencies: List[str] = []
    created_at: datetime
    updated_at: datetime