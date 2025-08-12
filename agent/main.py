from fastapi import FastAPI, HTTPException, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
from datetime import datetime

from .api.routers import projects, agents, deliverables
from .services.orchestrator_service import OrchestratorService
from .services.project_service import ProjectService
from .models.project import Project, ProjectCreate
from .models.agent import Agent, AgentRole, AgentStatus
from .models.deliverable import Deliverable, DeliverableType, CodeFile

app = FastAPI(
    title="AI CTO Agent",
    description="An AI-powered CTO agent that helps plan and manage tech projects",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(agents.router, prefix="/agents", tags=["agents"])
app.include_router(deliverables.router, prefix="/deliverables", tags=["deliverables"])

project_service = ProjectService()
orchestrator_service = OrchestratorService()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatResponse(BaseModel):
    message: str
    agent_id: Optional[str] = None
    project_id: Optional[str] = None

@app.websocket("/ws/chat/{project_id}")
async def chat_websocket(websocket: WebSocket, project_id: str):
    await websocket.accept()
    
    try:
        project = await project_service.get_project(project_id)
        if not project:
            await websocket.send_json({"error": "Project not found"})
            return

        agents = await project_service.get_project_agents(project_id)
        cto_agent = next((a for a in agents if a.role == AgentRole.CTO), None)

        if not cto_agent:
            await websocket.send_json({"error": "CTO agent not found"})
            return

        while True:
            data = await websocket.receive_text()
            
            response = await orchestrator_service.process_message(cto_agent.id, data)
            
            await websocket.send_json(ChatResponse(
                message=response,
                agent_id=cto_agent.id,
                project_id=project_id
            ).dict())

    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()

@app.get("/projects/{project_id}/code", response_model=List[CodeFile])
async def get_project_code(project_id: str):
    """Get all code files generated for a project"""
    project = await project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    code_deliverables = [d for d in project_service.get_project_deliverables(project_id)
                        if d.type == DeliverableType.CODE]
    
    all_files = []
    for deliverable in code_deliverables:
        all_files.extend(deliverable.files)
    
    return all_files

@app.get("/projects/{project_id}/documentation")
async def get_project_documentation(project_id: str):
    """Get project documentation"""
    project = await project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    docs = [d for d in project_service.get_project_deliverables(project_id)
            if d.type == DeliverableType.DOCUMENTATION]
    
    return {"documentation": [doc.content for doc in docs]}

@app.get("/projects/{project_id}/architecture")
async def get_project_architecture(project_id: str):
    """Get project architecture documentation"""
    project = await project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    architecture_docs = [d for d in project_service.get_project_deliverables(project_id)
                        if d.type == DeliverableType.ARCHITECTURE]
    
    return {"architecture": [doc.content for doc in architecture_docs]}

@app.post("/projects/{project_id}/download")
async def create_project_download(project_id: str):
    """Create a downloadable package of all project deliverables"""
    project = await project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    download_url = await project_service.create_project_download(project_id)
    
    return {"download_url": download_url}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
