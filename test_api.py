#!/usr/bin/env python3
"""
Test script to create a project through the API
"""

import requests
import json
import sys

# Test data for the project
project_data = {
    'name': 'TeamFlow',
    'description': 'A real-time collaborative task management application designed for small to medium-sized creative agencies and marketing teams (5-20 people)',
    'requirements': [
        'Visual Kanban-style task boards with drag-and-drop functionality',
        'Real-time collaboration with live updates',
        'Client communication portal with limited access',
        'Integrated time tracking for billable hours',
        'File attachment and preview functionality'
    ],
    'tech_stack': [
        'Frontend: React/Next.js',
        'Backend: Node.js with Express.js and Socket.io',
        'Database: PostgreSQL and Redis',
        'Hosting: Vercel (frontend), Railway/Render (backend)'
    ]
}

print("🚀 Testing AI CTO Agent API...")
print()

try:
    # Test if backend is running
    print("1. Testing backend connection...")
    response = requests.get('http://localhost:8000', timeout=5)
    print('✅ Backend is running!')
    print(f"   Status: {response.status_code}")
    print()
    
    # Create project
    print("2. Creating project...")
    response = requests.post('http://localhost:8000/projects', 
                           json=project_data, 
                           headers={'Content-Type': 'application/json'},
                           timeout=10)
    
    if response.status_code == 200:
        project = response.json()
        print('✅ Project created successfully!')
        print(f'   Project ID: {project.get("id")}')
        print(f'   Project Name: {project.get("name")}')
        print(f'   Status: {project.get("status")}')
        print(f'   Agents: {len(project.get("agents", []))}')
        print()
        
        # Test getting all projects
        print("3. Fetching all projects...")
        response = requests.get('http://localhost:8000/projects', timeout=5)
        if response.status_code == 200:
            projects = response.json()
            print(f'✅ Found {len(projects)} projects')
            for p in projects:
                print(f'   - {p.get("name")} (Status: {p.get("status")})')
        else:
            print(f'❌ Failed to fetch projects: {response.status_code}')
        print()
        
        # Test frontend API
        print("4. Testing frontend API...")
        response = requests.get('http://localhost:3002/api/projects', timeout=5)
        if response.status_code == 200:
            frontend_projects = response.json()
            print(f'✅ Frontend API working - {len(frontend_projects)} projects')
        else:
            print(f'❌ Frontend API failed: {response.status_code}')
            print("   (Make sure frontend is running on port 3002)")
        
    else:
        print(f'❌ Failed to create project: {response.status_code}')
        print(f'   Error: {response.text}')
        
except requests.exceptions.ConnectionError:
    print('❌ Error: Could not connect to backend server')
    print('   Make sure the backend is running on http://localhost:8000')
except Exception as e:
    print(f'❌ Error: {str(e)}')

print()
print("🎯 Next steps:")
print("1. If backend is working: Go to http://localhost:3002/agents to see projects")
print("2. If frontend API is working: Projects should appear in the UI")
print("3. Test the chat workflow at http://localhost:3002/chat")
