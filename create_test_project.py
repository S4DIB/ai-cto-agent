#!/usr/bin/env python3
"""
Create a test project directly via backend to test execution
"""

import requests
import json

print('🚀 Creating test project via backend...')

# Project data
project_data = {
    'name': 'Test Project',
    'description': 'A test project for debugging execution',
    'requirements': [
        'User authentication',
        'Dashboard interface',
        'Data visualization'
    ],
    'tech_stack': [
        'React',
        'Node.js',
        'PostgreSQL'
    ]
}

try:
    # Create project
    response = requests.post('http://localhost:8000/projects', 
                           json=project_data,
                           headers={'Content-Type': 'application/json'})
    
    if response.status_code == 200:
        project = response.json()
        project_id = project['id']
        print(f'✅ Project created: {project_id}')
        print(f'   Name: {project["name"]}')
        print(f'   Status: {project["status"]}')
        
        # Now test execution
        print(f'\n🔥 Executing project {project_id}...')
        response = requests.post(f'http://localhost:8000/projects/{project_id}/execute')
        
        if response.status_code == 200:
            result = response.json()
            print(f'✅ Execution result: {result}')
            
            # Check agents after execution
            print('\n👥 Checking agents...')
            response = requests.get(f'http://localhost:8000/projects/{project_id}/agents')
            if response.status_code == 200:
                agents = response.json()
                print(f'   Found {len(agents)} agents:')
                for agent in agents:
                    print(f'   - {agent.get("role")} (Status: {agent.get("status")})')
            else:
                print(f'   ❌ Failed to get agents: {response.status_code}')
                
        else:
            error = response.text
            print(f'❌ Execution failed: {response.status_code}')
            print(f'   Error: {error}')
            
    else:
        error = response.text
        print(f'❌ Project creation failed: {response.status_code}')
        print(f'   Error: {error}')
        
except Exception as e:
    print(f'❌ Error: {str(e)}')
    import traceback
    traceback.print_exc()
