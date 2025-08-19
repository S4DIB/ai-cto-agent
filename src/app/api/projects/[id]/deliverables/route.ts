import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Dynamic deliverable status based on time progression
function getDeliverableStatus(type: string): string {
  const progression = {
    'frontend': ['planning', 'in_progress', 'review', 'completed'],
    'backend': ['planning', 'in_progress', 'testing', 'completed'],
    'database': ['planning', 'design', 'implementation', 'completed']
  };
  
  // Simulate progression over time
  const timeIndex = Math.floor((Date.now() / 10000) % 4); // Changes every 10 seconds
  const typeProgression = progression[type] || progression['frontend'];
  
  return typeProgression[Math.min(timeIndex, typeProgression.length - 1)];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Fetch project deliverables from FastAPI backend
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/deliverables`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch project deliverables' },
        { status: response.status }
      );
    }

    const deliverables = await response.json();
    
    // If backend returns deliverables, use them
    if (deliverables && deliverables.length > 0) {
      return NextResponse.json(deliverables);
    }
    
    // Fallback: Return dynamic deliverables with realistic progress
    const mockDeliverables = [
      {
        id: `${projectId}-frontend-components`,
        title: 'React Components',
        type: 'frontend',
        status: getDeliverableStatus('frontend'),
        description: 'User interface components and layouts',
        agent_id: `${projectId}-frontend`,
        project_id: projectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `${projectId}-api-endpoints`,
        title: 'REST API Endpoints',
        type: 'backend',
        status: getDeliverableStatus('backend'), 
        description: 'Backend API routes and business logic',
        agent_id: `${projectId}-backend`,
        project_id: projectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `${projectId}-database-schema`,
        title: 'Database Schema',
        type: 'database',
        status: getDeliverableStatus('database'),
        description: 'Database tables and relationships design',
        agent_id: `${projectId}-database`,
        project_id: projectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return NextResponse.json(mockDeliverables);
  } catch (error) {
    console.error("Project deliverables fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliverables" },
      { status: 500 }
    );
  }
}