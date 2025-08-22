from typing import Optional, List
import uuid
from datetime import datetime

# Fix relative imports to absolute imports
from models.project import Project, ProjectCreate, ProjectStatus
from models.agent import Agent, AgentRole, AgentStatus
from models.deliverable import Deliverable
from services.orchestrator_service import OrchestratorService

class ProjectService:
    def __init__(self):
        self.projects = {}
        self.orchestrator = OrchestratorService()

    async def create_project(self, project: Project) -> Project:
        """Create a new project"""
        self.projects[project.id] = project
        return project

    async def get_project(self, project_id: str) -> Optional[Project]:
        return self.projects.get(project_id)

    async def get_all_projects(self) -> List[Project]:
        """Get all projects"""
        return list(self.projects.values())

    async def update_project(self, project: Project) -> Project:
        """Update an existing project"""
        if project.id not in self.projects:
            raise ValueError(f"Project {project.id} not found")
        
        self.projects[project.id] = project
        return project

    async def get_project_status(self, project_id: str) -> Optional[ProjectStatus]:
        project = await self.get_project(project_id)
        return project.status if project else None

    async def get_project_agents(self, project_id: str) -> List[Agent]:
        agents = [
            agent for agent in self.orchestrator.agents.values()
            if agent.project_id == project_id
        ]
        return agents

    async def get_project_deliverables(self, project_id: str) -> List[Deliverable]:
        """Get all deliverables for a project"""
        # This would typically come from a database
        # For now, return empty list - will be populated by agents
        return []

    async def create_project_download(self, project_id: str) -> str:
        """Create a downloadable package of all project deliverables"""
        # This would create a zip file with all project files
        # For now, return a placeholder URL
        return f"/downloads/{project_id}.zip"

    async def cancel_project(self, project_id: str) -> bool:
        if project_id not in self.projects:
            return False
            
        self.projects[project_id].status = ProjectStatus.CANCELLED
        
        for agent in await self.get_project_agents(project_id):
            agent.status = AgentStatus.FAILED
            agent.updated_at = datetime.now()
        
        return True
