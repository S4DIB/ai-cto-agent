#!/usr/bin/env python3
"""
Test script to debug project planning and agent creation
"""

import asyncio
from services.orchestrator_service import OrchestratorService
from models.project import Project
from datetime import datetime

async def test_planning():
    print('🧪 Testing project planning...')
    orchestrator = OrchestratorService()
    
    test_project = Project(
        id='test-123',
        name='Test Project',
        description='A test project for debugging',
        requirements=['Test requirement 1', 'Test requirement 2'],
        tech_stack=['React', 'Node.js'],
        status='planning',
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    try:
        print('1. Starting project planning...')
        planned_project = await orchestrator.plan_project(test_project)
        print(f'✅ Planning completed')
        print(f'   Agents in orchestrator: {len(orchestrator.agents)}')
        
        # List agents
        if orchestrator.agents:
            print('   Created agents:')
            for agent_id, agent in orchestrator.agents.items():
                print(f'   - {agent.role.value} Agent (ID: {agent_id[:8]}..., Status: {agent.status.value})')
        else:
            print('   ❌ No agents were created!')
            
        print('\n2. Testing agent requirements analysis...')
        required_roles = await orchestrator.analyze_project_requirements(test_project)
        print(f'   Required roles: {[role.value for role in required_roles]}')
        
    except Exception as e:
        print(f'❌ Planning failed: {str(e)}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_planning())
