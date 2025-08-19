#!/usr/bin/env python3
"""
Test script to execute a project and check agent assignment
"""

import requests

# Use the project ID from the previous test
project_id = '079171f1-14cd-4137-8865-0dee9a27182e'

print('🚀 Testing project execution...')

try:
    # Execute the project
    response = requests.post(f'http://localhost:8000/projects/{project_id}/execute', timeout=10)
    
    if response.status_code == 200:
        result = response.json()
        print('✅ Project execution started!')
        print(f'   Message: {result.get("message")}')
        print(f'   Status: {result.get("status")}')
        
        # Check project status after execution
        print('\n📊 Checking updated project status...')
        response = requests.get(f'http://localhost:8000/projects/{project_id}')
        if response.status_code == 200:
            project = response.json()
            print(f'   Project Status: {project.get("status")}')
            print(f'   Number of Agents: {len(project.get("agents", []))}')
            
            # List agents if any
            agents = project.get("agents", [])
            if agents:
                print('   Assigned Agents:')
                for agent in agents:
                    print(f'   - {agent.get("role", "Unknown")} (Status: {agent.get("status", "Unknown")})')
            else:
                print('   No agents assigned yet')
        else:
            print(f'❌ Failed to get project status: {response.status_code}')
        
        # Check agents endpoint
        print('\n👥 Checking agents endpoint...')
        response = requests.get(f'http://localhost:8000/projects/{project_id}/agents')
        if response.status_code == 200:
            agents = response.json()
            print(f'   Found {len(agents)} agents via agents endpoint')
            for agent in agents:
                print(f'   - {agent.get("role", "Unknown")} Agent (ID: {agent.get("id", "Unknown")})')
        else:
            print(f'❌ Failed to get agents: {response.status_code}')
            
    else:
        print(f'❌ Execution failed: {response.status_code}')
        print(f'   Error: {response.text}')
        
except Exception as e:
    print(f'❌ Error: {str(e)}')

print('\n🎯 Next steps:')
print('1. If agents are assigned: Check the UI to see them working')
print('2. If no agents: There may be an issue with the orchestrator service')
print('3. Refresh the agents page to see real-time updates')
