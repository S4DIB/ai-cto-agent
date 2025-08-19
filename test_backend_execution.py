#!/usr/bin/env python3
"""
Test script to debug backend execution directly
"""

import requests
import json

print('🧪 Testing backend execution directly...')

# First, get all projects to find a real project ID
try:
    response = requests.get('http://localhost:8000/projects')
    if response.status_code == 200:
        projects = response.json()
        if projects:
            project_id = projects[0]['id']
            print(f'✅ Found project: {project_id}')
            
            # Now test execution
            print('\n🚀 Testing project execution...')
            response = requests.post(f'http://localhost:8000/projects/{project_id}/execute')
            print(f'Execute response status: {response.status_code}')
            
            if response.status_code == 200:
                result = response.json()
                print(f'✅ Success: {result}')
            else:
                error = response.text
                print(f'❌ Error: {error}')
                
                # Let's see what the full error response looks like
                try:
                    error_json = response.json()
                    print(f'Error details: {json.dumps(error_json, indent=2)}')
                except:
                    print(f'Raw error text: {error}')
                    
        else:
            print('❌ No projects found')
    else:
        print(f'❌ Failed to get projects: {response.status_code}')
        
except Exception as e:
    print(f'❌ Error: {str(e)}')
    import traceback
    traceback.print_exc()
