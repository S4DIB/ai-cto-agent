from enum import Enum
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from collections import deque

class AgentRole(str, Enum):
    CTO = "cto"
    FRONTEND = "frontend"
    BACKEND = "backend"
    DEVOPS = "devops"
    DATABASE = "database"
    MOBILE = "mobile"
    AI = "ai"
    SECURITY = "security"

class AgentStatus(str, Enum):
    IDLE = "idle"
    WORKING = "working"
    COMPLETED = "completed"
    FAILED = "failed"

class AgentConfig(BaseModel):
    model: str = "gpt-4"
    temperature: float = 0.7
    max_tokens: int = 2000
    system_prompt: str

class Agent(BaseModel):
    id: str
    project_id: str
    role: AgentRole
    status: AgentStatus
    config: AgentConfig
    assigned_task: Optional[str] = None
    progress: float = 0.0
    created_at: datetime
    updated_at: datetime
    parent_agent_id: Optional[str] = None
    deliverables: List[str] = []
    message_queue: deque = deque()

    def receive_message(self, message: Dict):
        self.message_queue.append(message)

class AgentCreate(BaseModel):
    role: AgentRole
    project_id: str
    config: Optional[AgentConfig] = None
    parent_agent_id: Optional[str] = None
