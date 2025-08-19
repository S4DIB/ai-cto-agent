#!/usr/bin/env python3
"""
Test real AI code generation with actual project data
"""

import requests
import json

print('🤖 Testing REAL AI Code Generation...')

project_id = "test-real-ai-123"

# Test code generation with the fallback system
try:
    response = requests.get(f'http://localhost:3000/api/projects/{project_id}/code')
    
    if response.status_code == 200:
        code_files = response.json()
        print(f'✅ SUCCESS! Generated {len(code_files)} real AI code files:')
        print()
        
        for file in code_files:
            print(f'📄 {file["filename"]} ({file["language"]})')
            print('─' * 50)
            print(file["content"][:300] + "..." if len(file["content"]) > 300 else file["content"])
            print('─' * 50)
            print()
    else:
        print(f'❌ Error: {response.status_code} - {response.text}')
        
except Exception as e:
    print(f'❌ Error: {str(e)}')
    import traceback
    traceback.print_exc()
