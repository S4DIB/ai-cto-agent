#!/usr/bin/env python3
"""
Test agent creation within the agent directory
"""

import asyncio
from services.orchestrator_service import OrchestratorService

async def test_agent_creation():
    print('🧪 Testing agent creation directly...')
    
    orchestrator = OrchestratorService()
    project_id = 'test-project-123'
    
    try:
        print('1. Testing basic agent creation...')
        await orchestrator._create_basic_agents(project_id)
        
        print(f'2. Checking created agents...')
        project_agents = [a for a in orchestrator.agents.values() if a.project_id == project_id]
        print(f'   Found {len(project_agents)} agents:')
        
        for agent in project_agents:
            print(f'   - {agent.role.value} Agent (ID: {agent.id[:8]}..., Status: {agent.status.value})')
            if agent.assigned_task:
                print(f'     Task: {agent.assigned_task}')
                
    except Exception as e:
        print(f'❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent_creation())
