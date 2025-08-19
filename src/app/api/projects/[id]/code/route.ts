import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Simple in-memory cache for generated code to avoid regenerating
const generatedCodeCache = new Map<string, any>();

// Generate real code files using AI based on project requirements
async function generateProjectCode(projectId: string): Promise<any[]> {
  try {
    // Try to get project details from backend, fallback to reasonable defaults
    let project = null;
    try {
      const projectResponse = await fetch(`${BACKEND_URL}/projects/${projectId}`);
      if (projectResponse.ok) {
        project = await projectResponse.json();
      }
    } catch (error) {
      console.warn('Backend unavailable, using fallback project data');
    }
    
    // Use project data or fallback to generic AI CTO project
    const { name, description, requirements, tech_stack } = project || {
      name: "AI CTO Generated Project",
      description: "A task management application built with modern web technologies",
      requirements: ["User authentication", "Dashboard interface", "Data visualization", "Real-time updates"],
      tech_stack: ["React", "Node.js", "PostgreSQL", "TypeScript"]
    };
    
    console.log(`🤖 Generating REAL code for project: ${name}`);
    console.log(`Project details:`, { name, description, requirements, tech_stack });
    
    // Get Gemini API key with fallback
    const geminiApiKey = process.env.GEMINI_API_KEY || "AIzaSyA5iDa-bcaeEx7Nnwin8C1PCA7NI6tig-8";
    console.log(`Gemini API key available: ${!!geminiApiKey}`);
    console.log(`Using API key: ${geminiApiKey.substring(0, 20)}...`);
    
    if (!geminiApiKey) {
      console.error('❌ Gemini API key not found - cannot generate real code');
      return [];
    }
    
    // Generate code files using Gemini AI
    const codeFiles = [];
    
    // 1. Generate React Frontend Component
    console.log('🎨 Generating Frontend React App...');
    const frontendCode = await generateCodeWithAI(geminiApiKey, {
      type: 'React Frontend Component',
      filename: 'App.tsx',
      projectName: name,
      description,
      requirements,
      techStack: tech_stack,
      specificPrompt: `Create a COMPLETE, WORKING React application for "${description}". Generate a full App.tsx that includes:
      
      MUST INCLUDE ALL THESE FEATURES:
      ${requirements.map(req => `- ${req} (complete implementation)`).join('\n      ')}
      
      TECHNICAL REQUIREMENTS:
      - Modern React 18 with TypeScript
      - Tailwind CSS for styling (include full Tailwind classes)
      - Functional components with hooks (useState, useEffect)
      - Complete component hierarchy (Header, Sidebar, Main content)
      - Real event handlers and state management
      - Responsive design for mobile and desktop
      - Professional UI/UX with proper spacing and colors
      - Working forms, buttons, and interactive elements
      - Navigation between different views/pages
      
      GENERATE PRODUCTION-READY CODE - NOT A TEMPLATE!
      Include all imports, component definitions, and styling.
      This should be a complete application that can run immediately.`
    });
    
    console.log(`Frontend code result: ${frontendCode ? 'SUCCESS' : 'FAILED'} (${frontendCode?.length || 0} chars)`);
    
    if (frontendCode) {
      codeFiles.push({
        id: `${projectId}-app-tsx`,
        filename: 'App.tsx',
        file_path: 'src/App.tsx',
        content: frontendCode,
        language: 'typescript',
        agent_id: `${projectId}-frontend`,
        project_id: projectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // 2. Generate Backend API
    const backendCode = await generateCodeWithAI(geminiApiKey, {
      type: 'FastAPI Backend',
      filename: 'main.py',
      projectName: name,
      description,
      requirements,
      techStack: tech_stack,
      specificPrompt: `Create a COMPLETE, WORKING FastAPI backend for "${description}". Generate a full main.py that includes:
      
      MUST IMPLEMENT ALL THESE FEATURES:
      ${requirements.map(req => `- ${req} (complete API endpoints)`).join('\n      ')}
      
      TECHNICAL REQUIREMENTS:
      - Complete FastAPI application with all endpoints
      - Pydantic models for all data structures
      - CRUD operations for each feature
      - Authentication endpoints (register, login, logout)
      - Data validation and error handling
      - CORS middleware configuration
      - Database integration (SQLAlchemy/async)
      - Response models and status codes
      - Request/response examples in docstrings
      - Security best practices
      
      GENERATE PRODUCTION-READY CODE - NOT A TEMPLATE!
      Include all imports, models, routes, and database setup.
      This should be a complete API that works immediately.`
    });
    
    if (backendCode) {
      codeFiles.push({
        id: `${projectId}-main-py`,
        filename: 'main.py',
        file_path: 'backend/main.py',
        content: backendCode,
        language: 'python',
        agent_id: `${projectId}-backend`,
        project_id: projectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // 3. Generate Database Schema
    const dbCode = await generateCodeWithAI(geminiApiKey, {
      type: 'Database Schema',
      filename: 'schema.sql',
      projectName: name,
      description,
      requirements,
      techStack: tech_stack,
      specificPrompt: `Create a COMPLETE, PRODUCTION-READY PostgreSQL database schema for "${description}". Generate a full schema.sql that includes:
      
      MUST SUPPORT ALL THESE FEATURES:
      ${requirements.map(req => `- ${req} (complete database design)`).join('\n      ')}
      
      TECHNICAL REQUIREMENTS:
      - Complete table definitions for all entities
      - Primary keys, foreign keys, and constraints
      - Indexes for query optimization
      - User authentication tables (users, sessions, roles)
      - Data relationships that support all features
      - Proper data types (UUID, timestamps, JSON when needed)
      - Database triggers and functions if needed
      - Sample data inserts for testing
      - Comments explaining table purposes
      - Migration-ready SQL structure
      
      GENERATE PRODUCTION-READY DATABASE SCHEMA!
      Include all tables, relationships, indexes, and sample data.
      This should be a complete database that supports the full application.`
    });
    
    if (dbCode) {
      codeFiles.push({
        id: `${projectId}-schema-sql`,
        filename: 'schema.sql',
        file_path: 'database/schema.sql',
        content: dbCode,
        language: 'sql',
        agent_id: `${projectId}-database`,
        project_id: projectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ Generated ${codeFiles.length} real code files for ${name}`);
    return codeFiles;
    
  } catch (error) {
    console.error('Error generating real code:', error);
    return [];
  }
}

// Generate individual code file using Gemini AI
async function generateCodeWithAI(apiKey: string, params: any): Promise<string | null> {
  try {
    console.log(`🔥 Calling Gemini API for ${params.type}...`);
    
    const prompt = `Generate ${params.type} code for the project "${params.projectName}".

Project Description: ${params.description}
Requirements: ${params.requirements.join(', ')}
Tech Stack: ${params.techStack.join(', ')}

${params.specificPrompt}

Return ONLY the code without any explanations or markdown formatting:`;

    console.log(`📝 Prompt length: ${prompt.length} characters`);

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192, // Use the increased token limit
        }
      })
    });

    console.log(`📡 Gemini API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const generatedCode = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log(`📦 Received code: ${generatedCode ? 'SUCCESS' : 'EMPTY'} (${generatedCode?.length || 0} chars)`);
    
    if (generatedCode) {
      // Clean up the code - remove markdown formatting if present
      const cleanedCode = generatedCode
        .replace(/```[a-zA-Z]*\n/g, '')
        .replace(/```/g, '')
        .trim();
      
      console.log(`✨ Cleaned code: ${cleanedCode.length} characters`);
      return cleanedCode;
    }
    
    console.log(`⚠️ No code generated from Gemini`);
    return null;
  } catch (error) {
    console.error(`Error generating ${params.type}:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    console.log(`🚀 REAL AI CODE GENERATION for project: ${projectId}`);
    
    // Check for force refresh parameter
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('force') === 'true';
    
    // Check if we already generated code for this project (simple in-memory cache)
    const cacheKey = `code_${projectId}`;
    if (!forceRefresh && generatedCodeCache.has(cacheKey)) {
      console.log(`📋 Using cached code for project: ${projectId}`);
      return NextResponse.json(generatedCodeCache.get(cacheKey));
    }
    
    if (forceRefresh) {
      console.log(`🔄 Force refresh requested - clearing cache for project: ${projectId}`);
      generatedCodeCache.delete(cacheKey);
    }
    
    // TRY BACKEND AGENTS FIRST - this is the preferred method
    console.log('🔄 Trying to get code from backend agents...');
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/projects/${projectId}/code`);
      if (backendResponse.ok) {
        const backendCodeFiles = await backendResponse.json();
        if (backendCodeFiles && backendCodeFiles.length > 0) {
          console.log(`✅ Got ${backendCodeFiles.length} code files from backend agents!`);
          
          // Cache the backend-generated code
          generatedCodeCache.set(cacheKey, backendCodeFiles);
          
          return NextResponse.json(backendCodeFiles);
        } else {
          console.log('⚠️ Backend agents have not generated code yet');
        }
      } else {
        console.log(`⚠️ Backend code endpoint returned: ${backendResponse.status}`);
      }
    } catch (error) {
      console.log(`⚠️ Backend unavailable for code retrieval: ${error}`);
    }
    
    // FALLBACK: Generate code in frontend if backend agents haven't done it yet
    console.log('🔄 Falling back to frontend code generation...');
    const realCodeFiles = await generateProjectCode(projectId);
    
    if (realCodeFiles.length > 0) {
      console.log(`✅ Generated ${realCodeFiles.length} REAL AI code files`);
      
      // Cache the generated code to avoid regenerating
      generatedCodeCache.set(cacheKey, realCodeFiles);
      
      return NextResponse.json(realCodeFiles);
    }
    
    console.error(`❌ AI generation completely failed - no mock fallback!`);
    
    // NO MOCK DATA - Force real AI generation or show error
    return NextResponse.json({
      error: "AI code generation failed. Please check API key and try again.",
      debug: "Real AI generation failed, no fallback templates provided",
      suggestion: "Ensure GEMINI_API_KEY is properly configured"
    }, { status: 500 });
  } catch (error) {
    console.error("Project code fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch code files" },
      { status: 500 }
    );
  }
}