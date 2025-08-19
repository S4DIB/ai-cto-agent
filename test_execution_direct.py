#!/usr/bin/env python3
"""
Test execution endpoint directly
"""

import requests

print('🧪 Testing execution endpoint directly...')

try:
    # Get the latest project
    response = requests.get('http://localhost:8000/projects')
    if response.status_code == 200:
        projects = response.json()
        if projects:
            project_id = projects[-1]['id']  # Get the most recent project
            print(f'Testing with project: {project_id}')
            
            # Test execution directly
            print('Calling execution endpoint...')
            response = requests.post(f'http://localhost:8000/projects/{project_id}/execute')
            
            print(f'Execution response status: {response.status_code}')
            if response.status_code == 200:
                result = response.json()
                print(f'✅ Success: {result}')
            else:
                error = response.text
                print(f'❌ Error: {error}')
                
        else:
            print('❌ No projects found')
    else:
        print(f'❌ Failed to get projects: {response.status_code}')
        
except Exception as e:
    print(f'❌ Error: {str(e)}')
    import traceback
    traceback.print_exc()
