#!/usr/bin/env python3
"""
Startup script for AI CTO Agent Backend
"""

import uvicorn
from main import app

if __name__ == "__main__":
    print("🚀 Starting AI CTO Agent Backend...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔧 Press Ctrl+C to stop the server")
    print()
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
