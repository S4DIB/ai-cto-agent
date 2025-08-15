from typing import List, Optional, Dict
import uuid
import json
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain

from ..models.agent import Agent, AgentCreate, AgentRole, AgentStatus, AgentConfig
from ..models.project import Project
from ..models.task import Task, TaskStatus
from ..core.config import settings

class OrchestratorService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.7, google_api_key=settings.gemini_api_key)
        self.agents: Dict[str, Agent] = {}
        self.tasks: Dict[str, Task] = {}
        self._load_agent_config()
        
        # Prompt for analyzing project requirements
        self.analysis_prompt = ChatPromptTemplate.from_template("""
            As a CTO, analyze the following project requirements and determine which specialist agents are needed from the available roles: {available_roles}
            
            Project Description: {description}
            Requirements: {requirements}
            
            Format your response as a JSON object with a single key "roles" containing a list of role strings.
        """)
        
        self.task_decomposition_prompt = ChatPromptTemplate.from_template("""
            As a CTO, break down the following project into a series of tasks.
            
            Project Description: {description}
            Requirements: {requirements}
            
            For each task, provide:
            1. A unique ID (e.g., "task_1", "task_2")
            2. A title
            3. A description
            4. A list of dependencies (other task IDs that must be completed first)
            
            Format your response as a JSON object with a single key "tasks" containing a list of task objects.
        """)
        
        self.analysis_chain = LLMChain(llm=self.llm, prompt=self.analysis_prompt)
        self.task_decomposition_chain = LLMChain(llm=self.llm, prompt=self.task_decomposition_prompt)

    def _load_agent_config(self):
        with open("agent/agent_config.json", "r") as f:
            self.agent_config = json.load(f)

    async def plan_project(self, project: Project) -> Project:
        """Analyzes requirements, decomposes into tasks, and assigns agents."""
        # 1. Analyze requirements to determine needed roles
        required_roles = await self.analyze_project_requirements(project)
        
        # 2. Decompose project into tasks
        tasks = await self.decompose_project_into_tasks(project)
        project.tasks = tasks
        
        # 3. Create specialist agents
        cto_agent = await self.create_cto_agent(project.id)
        await self.create_specialist_agents(project.id, cto_agent.id, required_roles)
        
        return project

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
        available_roles = ", ".join(self.agent_config["roles"].keys())
        analysis = await self.analysis_chain.arun(
            description=project.description,
            requirements="\n".join(project.requirements),
            available_roles=available_roles
        )
        
        required_roles = self._parse_required_roles(analysis)
        return required_roles

    async def decompose_project_into_tasks(self, project: Project) -> List[Task]:
        """Break down the project into a series of tasks with dependencies."""
        task_analysis = await self.task_decomposition_chain.arun(
            description=project.description,
            requirements="\n".join(project.requirements)
        )
        
        tasks = self._parse_tasks(project.id, task_analysis)
        for task in tasks:
            self.tasks[task.id] = task
        return tasks

    def _parse_tasks(self, project_id: str, task_analysis: str) -> List[Task]:
        """Parse the LLM output to create Task objects."""
        try:
            task_data = json.loads(task_analysis)
            tasks = []
            for task_item in task_data.get("tasks", []):
                task = Task(
                    id=task_item["id"],
                    project_id=project_id,
                    title=task_item["title"],
                    description=task_item["description"],
                    status=TaskStatus.PENDING,
                    dependencies=task_item.get("dependencies", []),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                tasks.append(task)
            return tasks
        except (json.JSONDecodeError, TypeError):
            return []

    async def send_message(self, sender_id: str, recipient_id: str, message_content: Dict) -> bool:
        """Send a message from one agent to another."""
        if recipient_id not in self.agents:
            return False
        
        recipient = self.agents[recipient_id]
        message = {
            "sender_id": sender_id,
            "content": message_content,
            "timestamp": datetime.now().isoformat()
        }
        recipient.receive_message(message)
        return True

    async def create_specialist_agents(self, project_id: str, cto_agent_id: str, roles: List[AgentRole]) -> List[Agent]:
        """Create specialist agents based on the analysis"""
        agents = []
        for role in roles:
            role_str = role.value
            if role_str in self.agent_config["roles"]:
                system_prompt = self.agent_config["roles"][role_str]["system_prompt"]
            else:
                system_prompt = "You are a specialist engineer."

            config = AgentConfig(
                system_prompt=system_prompt,
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
        try:
            # The prompt now asks for a JSON object, so we parse it directly
            analysis_json = json.loads(analysis)
            roles_str = analysis_json.get("roles", [])
            
            # Convert role strings to AgentRole enums
            roles = [AgentRole(role) for role in roles_str if role in AgentRole.__members__]
            return roles
        except (json.JSONDecodeError, TypeError):
            # Fallback for unstructured text
            roles = []
            for role_enum in AgentRole:
                if role_enum.value in analysis.lower():
                    roles.append(role_enum)
            return list(set(roles)) # Return unique roles
