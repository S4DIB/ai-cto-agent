from enum import Enum
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class DeliverableType(str, Enum):
    CODE = "code"
    DOCUMENTATION = "documentation"
    ARCHITECTURE = "architecture"
    API_SPEC = "api_spec"
    DATABASE_SCHEMA = "database_schema"
    DEPLOYMENT_CONFIG = "deployment_config"

class DeliverableStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class CodeFile(BaseModel):
    path: str
    content: str
    language: str
    description: str

class Deliverable(BaseModel):
    id: str
    project_id: str
    agent_id: str
    type: DeliverableType
    status: DeliverableStatus
    title: str
    description: str
    content: Optional[str] = None
    files: List[CodeFile] = []
    metadata: Dict[str, str] = {}
    created_at: datetime
    updated_at: datetime

class DeliverableCreate(BaseModel):
    project_id: str
    agent_id: str
    type: DeliverableType
    title: str
    description: str
    content: Optional[str] = None
    files: List[CodeFile] = []
    metadata: Dict[str, str] = {}
