import asyncio
from unittest.mock import MagicMock, AsyncMock
import pytest
from agent.services.project_service import ProjectService
from agent.models.project import ProjectCreate
from agent.models.agent import AgentRole

# Mock the OrchestratorService to avoid actual LLM calls and control agent creation
@pytest.fixture
def mock_orchestrator_service():
    mock = MagicMock()
    mock.create_cto_agent = AsyncMock()
    mock.analyze_project_requirements = AsyncMock(return_value=[AgentRole.FRONTEND, AgentRole.BACKEND])
    mock.create_specialist_agents = AsyncMock()
    return mock

# Fixture to initialize ProjectService with the mocked orchestrator
@pytest.fixture
def project_service(mock_orchestrator_service):
    service = ProjectService()
    service.orchestrator = mock_orchestrator_service
    return service

@pytest.mark.asyncio
async def test_create_project_and_assign_agents(project_service, mock_orchestrator_service):
    # 1. Define Project Details
    project_data = ProjectCreate(
        name="Test Project",
        description="A web application for testing purposes.",
        requirements=["User authentication", "Dashboard for data visualization"],
        tech_stack=["React", "Node.js", "PostgreSQL"]
    )

    # 2. Create the Project
    created_project = await project_service.create_project(project_data)

    # 3. Verify Orchestrator Interactions
    # Check that the CTO agent was created
    mock_orchestrator_service.create_cto_agent.assert_called_once_with(created_project.id)
    
    # Check that project requirements were analyzed
    mock_orchestrator_service.analyze_project_requirements.assert_called_once_with(created_project)
    
    # Check that specialist agents were created based on the analysis
    mock_orchestrator_service.create_specialist_agents.assert_called_once()

    print("Test passed: Project created and agents assigned successfully.")

# To run this test:
# 1. Make sure you have pytest and pytest-asyncio installed:
#    pip install pytest pytest-asyncio
# 2. Run pytest from your terminal in the project root directory:
#    pytest