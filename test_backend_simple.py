#!/usr/bin/env python3
"""
Simple backend connectivity test
"""

import requests

print('🔍 Testing backend connectivity...')

try:
    # Test root endpoint
    response = requests.get('http://localhost:8000/')
    print(f'Root endpoint status: {response.status_code}')
    print(f'Response: {response.text[:200]}...')
    
    # Test docs endpoint
    response = requests.get('http://localhost:8000/docs')
    print(f'Docs endpoint status: {response.status_code}')
    
    # Test projects endpoint
    response = requests.get('http://localhost:8000/projects')
    print(f'Projects endpoint status: {response.status_code}')
    print(f'Projects response: {response.text}')
    
except Exception as e:
    print(f'❌ Error: {str(e)}')
    print('Backend may not be running on localhost:8000')
