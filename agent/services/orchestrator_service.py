from typing import List, Optional, Dict
import uuid
import json
from datetime import datetime
import google.generativeai as genai

# Fix relative imports to absolute imports
from models.agent import Agent, AgentCreate, AgentRole, AgentStatus, AgentConfig
from models.project import Project
from models.task import Task, TaskStatus
from core.config import settings

class OrchestratorService:
    def __init__(self):
        # Configure Google Generative AI
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.agents: Dict[str, Agent] = {}
        self.tasks: Dict[str, Task] = {}
        self._load_agent_config()
        
        # Prompt for analyzing project requirements
        self.analysis_prompt = """
            As a CTO, analyze the following project requirements and determine which specialist agents are needed from the available roles: {available_roles}
            
            Project Description: {description}
            Requirements: {requirements}
            
            Format your response as a JSON object with a single key "roles" containing a list of role strings.
        """
        
        self.task_decomposition_prompt = """
            As a CTO, break down the following project into a series of tasks.
            
            Project Description: {description}
            Requirements: {requirements}
            
            For each task, provide:
            1. A unique ID (e.g., "task_1", "task_2")
            2. A title
            3. A description
            4. A list of dependencies (other task IDs that must be completed first)
            
            Format your response as a JSON object with a single key "tasks" containing a list of task objects.
        """

    def _load_agent_config(self):
        with open("agent_config.json", "r") as f:
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
        prompt = self.analysis_prompt.format(
            available_roles=available_roles,
            description=project.description,
            requirements="\n".join(project.requirements)
        )
        
        try:
            # Configure generation for longer code output
            generation_config = {
                'max_output_tokens': 8192,
                'temperature': 0.7,
            }
            response = self.model.generate_content(prompt, generation_config=generation_config)
            analysis = response.text
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            analysis = ""
        
        required_roles = self._parse_required_roles(analysis)
        return required_roles

    async def decompose_project_into_tasks(self, project: Project) -> List[Task]:
        """Break down the project into a series of tasks with dependencies."""
        prompt = self.task_decomposition_prompt.format(
            description=project.description,
            requirements="\n".join(project.requirements)
        )
        
        try:
            # Configure generation for longer code output
            generation_config = {
                'max_output_tokens': 8192,
                'temperature': 0.7,
            }
            response = self.model.generate_content(prompt, generation_config=generation_config)
            task_analysis = response.text
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            task_analysis = ""
        
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

    async def process_message(self, agent_id: str, message: str) -> str:
        """Process a message through an agent and return response"""
        if agent_id not in self.agents:
            return "Agent not found"
        
        agent = self.agents[agent_id]
        
        # Create a prompt for the agent based on their role
        if agent.role == AgentRole.CTO:
            prompt = f"""As a CTO, respond to the following message from a founder:

Message: {message}

Your role is to:
1. Analyze the request
2. Provide strategic technical guidance
3. Break down the project into actionable steps
4. Assign tasks to appropriate specialist agents

Respond in a clear, actionable manner:"""
        else:
            # For specialist agents, use their specific system prompt
            prompt = f"""{agent.config.system_prompt}

Task: {message}

Provide a detailed response with code examples if applicable:"""
        
        try:
            # Configure generation for longer code output
            generation_config = {
                'max_output_tokens': 8192,
                'temperature': 0.7,
            }
            # Use the Gemini model to generate a response
            response = self.model.generate_content(prompt, generation_config=generation_config)
            return response.text
        except Exception as e:
            return f"Error processing message: {str(e)}"

    async def execute_project(self, project_id: str) -> bool:
        """Execute a project by running all assigned agents"""
        try:
            print(f"DEBUG: Starting execution for project {project_id}")
            
            # Get all agents for this project
            project_agents = [a for a in self.agents.values() if a.project_id == project_id]
            print(f"DEBUG: Found {len(project_agents)} existing agents")
            
            # If no agents exist, create them first
            if not project_agents:
                print(f"DEBUG: No agents found for project {project_id}, creating agents...")
                
                # Create basic agents without complex AI analysis to avoid Gemini API issues
                await self._create_basic_agents(project_id)
                
                # Get agents again after creation
                project_agents = [a for a in self.agents.values() if a.project_id == project_id]
                print(f"DEBUG: After creation, found {len(project_agents)} agents")
                
                if not project_agents:
                    print("DEBUG: Failed to create agents")
                    return False
            
            # Execute each agent's assigned task
            for agent in project_agents:
                if agent.assigned_task and agent.status == AgentStatus.IDLE:
                    agent.status = AgentStatus.WORKING
                    agent.updated_at = datetime.now()
                    
                    # Simulate agent work
                    await self._execute_agent_task(agent)
            
            return True
        except Exception as e:
            print(f"Error executing project: {e}")
            return False

    async def _execute_agent_task(self, agent: Agent):
        """Execute a specific agent's task"""
        try:
            # This is where the agent would actually work on their task
            # For now, we'll simulate the work
            
            if agent.role == AgentRole.FRONTEND:
                # Generate frontend code
                await self._generate_frontend_code(agent)
            elif agent.role == AgentRole.BACKEND:
                # Generate backend code
                await self._generate_backend_code(agent)
            elif agent.role == AgentRole.DATABASE:
                # Generate database schema
                await self._generate_database_schema(agent)
            elif agent.role == AgentRole.DEVOPS:
                # Generate deployment config
                await self._generate_devops_config(agent)
            
            agent.status = AgentStatus.COMPLETED
            agent.progress = 100.0
            agent.updated_at = datetime.now()
            
        except Exception as e:
            agent.status = AgentStatus.FAILED
            agent.updated_at = datetime.now()
            print(f"Agent {agent.id} failed: {e}")

    async def _generate_frontend_code(self, agent: Agent):
        """Generate frontend code for the agent's project"""
        try:
            # Get project details to inject requirements
            project = await self._get_project_details(agent.project_id)
            if not project:
                print(f"❌ No project found for agent {agent.id}")
                return
            
            # Create specific prompt with actual project requirements
            prompt = f"""Generate a COMPLETE, WORKING React TypeScript application for: {project['name']}

PROJECT DESCRIPTION: {project['description']}

MUST IMPLEMENT ALL THESE REQUIREMENTS:
{chr(10).join([f"- {req}" for req in project.get('requirements', [])])}

TECH STACK: {', '.join(project.get('tech_stack', []))}

TECHNICAL SPECIFICATIONS:
- Complete React 18 application with TypeScript
- Use functional components with hooks (useState, useEffect)
- Implement ALL requirements as working features (not placeholders)
- Use Tailwind CSS for styling
- Include proper component structure and state management
- Add real event handlers and user interactions
- Make it responsive for mobile and desktop
- Include proper TypeScript interfaces

GENERATE PRODUCTION-READY CODE - NOT TEMPLATES!
Return ONLY the complete App.tsx code without markdown formatting:"""

            # Generate code using Gemini
            generation_config = {
                'max_output_tokens': 8192,
                'temperature': 0.3,
            }
            
            response = self.model.generate_content(prompt, generation_config=generation_config)
            
            if response and response.text:
                # Clean the generated code
                code = response.text.replace('```typescript', '').replace('```tsx', '').replace('```', '').strip()
                
                # Store the generated code (you might want to save this to a database)
                agent.generated_code = {
                    'filename': 'App.tsx',
                    'content': code,
                    'type': 'frontend'
                }
                
                print(f"✅ Frontend agent {agent.id} generated {len(code)} characters of React code")
            else:
                print(f"❌ Frontend agent {agent.id} failed to generate code")
                
        except Exception as e:
            print(f"❌ Error in frontend code generation: {e}")
            agent.status = AgentStatus.FAILED

    async def _generate_backend_code(self, agent: Agent):
        """Generate backend code for the agent's project"""
        try:
            # Get project details to inject requirements
            project = await self._get_project_details(agent.project_id)
            if not project:
                print(f"❌ No project found for agent {agent.id}")
                return
            
            # Create specific prompt with actual project requirements
            prompt = f"""Generate a COMPLETE, WORKING FastAPI Python backend for: {project['name']}

PROJECT DESCRIPTION: {project['description']}

MUST IMPLEMENT ALL THESE REQUIREMENTS:
{chr(10).join([f"- {req}" for req in project.get('requirements', [])])}

TECH STACK: {', '.join(project.get('tech_stack', []))}

TECHNICAL SPECIFICATIONS:
- Complete FastAPI application with all endpoints
- Pydantic models for data validation
- CRUD operations for each requirement
- Authentication endpoints if needed
- CORS middleware configuration
- Database integration (SQLAlchemy/async)
- Error handling and status codes
- Request/response models
- Security best practices

GENERATE PRODUCTION-READY CODE - NOT TEMPLATES!
Return ONLY the complete main.py code without markdown formatting:"""

            # Generate code using Gemini
            generation_config = {
                'max_output_tokens': 8192,
                'temperature': 0.3,
            }
            
            response = self.model.generate_content(prompt, generation_config=generation_config)
            
            if response and response.text:
                # Clean the generated code
                code = response.text.replace('```python', '').replace('```', '').strip()
                
                # Store the generated code
                agent.generated_code = {
                    'filename': 'main.py',
                    'content': code,
                    'type': 'backend'
                }
                
                print(f"✅ Backend agent {agent.id} generated {len(code)} characters of FastAPI code")
            else:
                print(f"❌ Backend agent {agent.id} failed to generate code")
                
        except Exception as e:
            print(f"❌ Error in backend code generation: {e}")
            agent.status = AgentStatus.FAILED

    async def _generate_database_schema(self, agent: Agent):
        """Generate database schema for the agent's project"""
        try:
            # Get project details to inject requirements
            project = await self._get_project_details(agent.project_id)
            if not project:
                print(f"❌ No project found for agent {agent.id}")
                return
            
            # Create specific prompt with actual project requirements
            prompt = f"""Generate a COMPLETE, PRODUCTION-READY PostgreSQL database schema for: {project['name']}

PROJECT DESCRIPTION: {project['description']}

MUST SUPPORT ALL THESE REQUIREMENTS:
{chr(10).join([f"- {req}" for req in project.get('requirements', [])])}

TECH STACK: {', '.join(project.get('tech_stack', []))}

TECHNICAL SPECIFICATIONS:
- Complete table definitions for all entities
- Primary keys, foreign keys, and constraints
- Indexes for query optimization
- User authentication tables if needed (users, sessions, roles)
- Data relationships that support all requirements
- Proper data types (UUID, timestamps, JSON when needed)
- Database triggers and functions if needed
- Sample data inserts for testing
- Comments explaining table purposes
- Migration-ready SQL structure

GENERATE PRODUCTION-READY DATABASE SCHEMA!
Return ONLY the complete SQL schema without markdown formatting:"""

            # Generate code using Gemini
            generation_config = {
                'max_output_tokens': 8192,
                'temperature': 0.3,
            }
            
            response = self.model.generate_content(prompt, generation_config=generation_config)
            
            if response and response.text:
                # Clean the generated code
                code = response.text.replace('```sql', '').replace('```', '').strip()
                
                # Store the generated code
                agent.generated_code = {
                    'filename': 'schema.sql',
                    'content': code,
                    'type': 'database'
                }
                
                print(f"✅ Database agent {agent.id} generated {len(code)} characters of SQL schema")
            else:
                print(f"❌ Database agent {agent.id} failed to generate code")
                
        except Exception as e:
            print(f"❌ Error in database schema generation: {e}")
            agent.status = AgentStatus.FAILED

    async def _generate_devops_config(self, agent: Agent):
        """Generate DevOps configuration for the agent's project"""
        try:
            # Get project details to inject requirements
            project = await self._get_project_details(agent.project_id)
            if not project:
                print(f"❌ No project found for agent {agent.id}")
                return
            
            # Create specific prompt with actual project requirements
            prompt = f"""Generate COMPLETE deployment configuration for: {project['name']}

PROJECT DESCRIPTION: {project['description']}

REQUIREMENTS: {', '.join(project.get('requirements', []))}
TECH STACK: {', '.join(project.get('tech_stack', []))}

Generate a docker-compose.yml file that includes:
- Frontend service (React/Next.js)
- Backend service (FastAPI/Node.js)
- Database service (PostgreSQL)
- Environment configuration
- Proper networking and volumes
- Production-ready settings

Return ONLY the complete docker-compose.yml without markdown formatting:"""

            # Generate code using Gemini
            generation_config = {
                'max_output_tokens': 4096,
                'temperature': 0.3,
            }
            
            response = self.model.generate_content(prompt, generation_config=generation_config)
            
            if response and response.text:
                # Clean the generated code
                code = response.text.replace('```yaml', '').replace('```yml', '').replace('```', '').strip()
                
                # Store the generated code
                agent.generated_code = {
                    'filename': 'docker-compose.yml',
                    'content': code,
                    'type': 'devops'
                }
                
                print(f"✅ DevOps agent {agent.id} generated {len(code)} characters of deployment config")
            else:
                print(f"❌ DevOps agent {agent.id} failed to generate code")
                
        except Exception as e:
            print(f"❌ Error in DevOps config generation: {e}")
            agent.status = AgentStatus.FAILED

    async def _get_project_details(self, project_id: str) -> Optional[Dict]:
        """Get project details from the project service"""
        try:
            # Import here to avoid circular imports
            from services.project_service import ProjectService
            
            # Create a project service instance
            project_service = ProjectService()
            project = await project_service.get_project(project_id)
            
            if project:
                return {
                    'id': project.id,
                    'name': project.name,
                    'description': project.description,
                    'requirements': project.requirements,
                    'tech_stack': project.tech_stack
                }
            return None
            
        except Exception as e:
            print(f"❌ Error getting project details: {e}")
            return None

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

    async def _create_basic_agents(self, project_id: str):
        """Create basic agents without complex AI analysis (fallback method)"""
        try:
            print(f"Creating basic agent set for project {project_id}...")
            
            # Create CTO agent
            print("Creating CTO agent...")
            cto_agent = await self.create_agent(AgentCreate(
                role=AgentRole.CTO,
                project_id=project_id,
                config=AgentConfig(
                    system_prompt="You are an experienced CTO responsible for project planning and management."
                )
            ))
            print(f"CTO agent created: {cto_agent.id}")
            
            # Create essential agents
            essential_roles = [AgentRole.FRONTEND, AgentRole.BACKEND, AgentRole.DATABASE]
            
            for role in essential_roles:
                print(f"Creating {role.value} agent...")
                agent = await self.create_agent(AgentCreate(
                    role=role,
                    project_id=project_id,
                    parent_agent_id=cto_agent.id,
                    config=AgentConfig(
                        system_prompt=f"You are a specialist {role.value} engineer responsible for implementing the {role.value} components of the project."
                    )
                ))
                print(f"{role.value} agent created: {agent.id}")
                
                # Assign basic tasks
                if role == AgentRole.FRONTEND:
                    agent.assigned_task = "Create React components and user interface"
                elif role == AgentRole.BACKEND:
                    agent.assigned_task = "Develop REST API and business logic"
                elif role == AgentRole.DATABASE:
                    agent.assigned_task = "Design database schema and data models"
                
                agent.status = AgentStatus.IDLE
                
            print(f"Created {len(essential_roles) + 1} basic agents")
            
        except Exception as e:
            print(f"Error creating basic agents: {e}")
            import traceback
            traceback.print_exc()
