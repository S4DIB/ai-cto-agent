from fastapi import APIRouter, HTTPException
from typing import List, Optional

from ..models.agent import Agent, AgentStatus, AgentConfig
from ..services.orchestrator_service import OrchestratorService

router = APIRouter()
orchestrator = OrchestratorService()

@router.get("/{agent_id}", response_model=Agent)
async def get_agent(agent_id: str):
    agent = orchestrator.agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.get("/{agent_id}/logs", response_model=List[str])
async def get_agent_logs(agent_id: str):
    agent = orchestrator.agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    # Implement log retrieval logic
    return []

@router.put("/{agent_id}/config", response_model=Agent)
async def update_agent_config(agent_id: str, config: AgentConfig):
    agent = orchestrator.agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent.config = config
    agent.updated_at = datetime.now()
    return agent

@router.post("/{agent_id}/tasks", response_model=Agent)
async def assign_task(agent_id: str, task: str):
    success = await orchestrator.assign_task(agent_id, task)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return orchestrator.agents[agent_id]

@router.put("/{agent_id}/progress", response_model=Agent)
async def update_progress(agent_id: str, progress: float):
    if progress < 0 or progress > 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
    
    success = await orchestrator.update_progress(agent_id, progress)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return orchestrator.agents[agent_id]
