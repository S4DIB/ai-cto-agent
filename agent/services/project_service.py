from typing import Optional, List
import uuid
from datetime import datetime

from ..models.project import Project, ProjectCreate, ProjectStatus
from ..models.agent import Agent, AgentRole
from .orchestrator_service import OrchestratorService

class ProjectService:
    def __init__(self):
        self.projects = {}
        self.orchestrator = OrchestratorService()

    async def create_project(self, project_create: ProjectCreate) -> Project:
        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
            **project_create.dict(),
            status=ProjectStatus.PLANNING,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        self.projects[project_id] = project
        
        cto_agent = await self.orchestrator.create_cto_agent(project_id)
        
        required_roles = await self.orchestrator.analyze_project_requirements(project)
        specialist_agents = await self.orchestrator.create_specialist_agents(
            project_id=project_id,
            cto_agent_id=cto_agent.id,
            roles=required_roles
        )
        
        project.status = ProjectStatus.IN_PROGRESS
        project.updated_at = datetime.now()
        
        return project

    async def get_project(self, project_id: str) -> Optional[Project]:
        return self.projects.get(project_id)

    async def get_project_status(self, project_id: str) -> Optional[ProjectStatus]:
        project = await self.get_project(project_id)
        return project.status if project else None

    async def get_project_agents(self, project_id: str) -> List[Agent]:
        agents = [
            agent for agent in self.orchestrator.agents.values()
            if agent.project_id == project_id
        ]
        return agents

    async def cancel_project(self, project_id: str) -> bool:
        if project_id not in self.projects:
            return False
            
        self.projects[project_id].status = ProjectStatus.CANCELLED
        
        for agent in await self.get_project_agents(project_id):
            agent.status = AgentStatus.FAILED
            agent.updated_at = datetime.now()
        
        return True
