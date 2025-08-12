from typing import List, Optional, Dict
import uuid
from datetime import datetime
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain

from ..models.agent import Agent, AgentCreate, AgentRole, AgentStatus, AgentConfig
from ..models.project import Project, TechStack
from ..core.config import settings

class OrchestratorService:
    def __init__(self):
        self.llm = ChatOpenAI(temperature=0.7)
        self.agents: Dict[str, Agent] = {}
        
        # Prompt for analyzing project requirements
        self.analysis_prompt = ChatPromptTemplate.from_template("""
            As a CTO, analyze the following project requirements and determine which specialist agents are needed:
            
            Project Description: {description}
            Requirements: {requirements}
            
            For each required role, provide:
            1. Role type (frontend, backend, devops, etc.)
            2. Justification for why this role is needed
            3. Primary responsibilities
            4. Required technical skills
            
            Format your response in a clear, structured way.
        """)
        
        self.analysis_chain = LLMChain(llm=self.llm, prompt=self.analysis_prompt)

    async def create_cto_agent(self, project_id: str) -> Agent:
        """Create the main CTO agent that will orchestrate other agents"""
        config = AgentConfig(
            system_prompt="""You are an experienced CTO responsible for:
            1. Analyzing project requirements
            2. Breaking down the project into technical components
            3. Assigning and managing specialist agents
            4. Reviewing deliverables and ensuring quality
            5. Making high-level architectural decisions""",
        )
        
        return await self.create_agent(AgentCreate(
            role=AgentRole.CTO,
            project_id=project_id,
            config=config
        ))

    async def analyze_project_requirements(self, project: Project) -> List[AgentRole]:
        """Analyze project requirements and determine needed specialist agents"""
        analysis = await self.analysis_chain.arun(
            description=project.description,
            requirements="\n".join(project.requirements)
        )
        
        # Parse the LLM response to determine required roles
        # This is a placeholder - implement proper parsing based on LLM output format
        required_roles = self._parse_required_roles(analysis)
        return required_roles

    async def create_specialist_agents(self, project_id: str, cto_agent_id: str, roles: List[AgentRole]) -> List[Agent]:
        """Create specialist agents based on the analysis"""
        agents = []
        role_prompts = {
            AgentRole.FRONTEND: """You are an expert frontend engineer responsible for:
                1. Designing and implementing user interfaces
                2. Ensuring responsive and accessible design
                3. Implementing client-side functionality
                4. Writing clean, maintainable frontend code""",
            AgentRole.BACKEND: """You are an expert backend engineer responsible for:
                1. Designing and implementing APIs
                2. Managing database schemas and operations
                3. Implementing business logic
                4. Ensuring security and performance""",
            # Add more role-specific prompts as needed
        }
        
        for role in roles:
            config = AgentConfig(
                system_prompt=role_prompts.get(role, "You are a specialist engineer."),
            )
            
            agent = await self.create_agent(AgentCreate(
                role=role,
                project_id=project_id,
                config=config,
                parent_agent_id=cto_agent_id
            ))
            agents.append(agent)
        
        return agents

    async def create_agent(self, agent_create: AgentCreate) -> Agent:
        """Create a new agent"""
        agent_id = str(uuid.uuid4())
        
        # If config is not provided, use default
        if not agent_create.config:
            agent_create.config = AgentConfig(
                system_prompt=f"You are a {agent_create.role.value} specialist."
            )
        
        agent = Agent(
            id=agent_id,
            status=AgentStatus.IDLE,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            **agent_create.dict()
        )
        
        self.agents[agent_id] = agent
        return agent

    async def assign_task(self, agent_id: str, task: str) -> bool:
        """Assign a task to an agent"""
        if agent_id not in self.agents:
            return False
            
        agent = self.agents[agent_id]
        agent.status = AgentStatus.WORKING
        agent.assigned_task = task
        agent.updated_at = datetime.now()
        return True

    async def update_progress(self, agent_id: str, progress: float) -> bool:
        """Update the progress of an agent's task"""
        if agent_id not in self.agents:
            return False
            
        agent = self.agents[agent_id]
        agent.progress = progress
        agent.updated_at = datetime.now()
        
        if progress >= 100:
            agent.status = AgentStatus.COMPLETED
        
        return True

    def _parse_required_roles(self, analysis: str) -> List[AgentRole]:
        """Parse the LLM analysis to determine required roles"""
        # Implement proper parsing logic based on the LLM output format
        # This is a placeholder implementation
        roles = []
        if "frontend" in analysis.lower():
            roles.append(AgentRole.FRONTEND)
        if "backend" in analysis.lower():
            roles.append(AgentRole.BACKEND)
        if "devops" in analysis.lower():
            roles.append(AgentRole.DEVOPS)
        if "database" in analysis.lower():
            roles.append(AgentRole.DATABASE)
        return roles
