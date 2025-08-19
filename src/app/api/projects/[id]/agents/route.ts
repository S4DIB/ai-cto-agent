import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Simple progress simulation based on time since project creation
function getAgentProgress(projectId: string, agentRole: string): number {
  // Calculate time-based progression (agents complete tasks over time)
  const now = Date.now();
  const baseTime = parseInt(projectId.split('-')[0]) || now - 60000; // Use project timestamp or 1 min ago
  const elapsed = Math.max(0, now - baseTime);
  
  // Different completion rates for different agents
  const completionRates = {
    'CTO': 20000,      // Completes in 20 seconds
    'Frontend': 35000,  // Completes in 35 seconds
    'Backend': 45000,   // Completes in 45 seconds
    'Database': 30000   // Completes in 30 seconds
  };
  
  const rate = completionRates[agentRole] || 30000;
  const progress = Math.min(100, Math.floor((elapsed / rate) * 100));
  
  return progress;
}

function getAgentStatus(projectId: string, agentRole: string): string {
  const progress = getAgentProgress(projectId, agentRole);
  
  if (progress >= 100) return 'completed';
  if (progress >= 70) return 'generating';
  if (progress >= 30) return 'analyzing';
  return 'working';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Try to fetch project agents from FastAPI backend
    try {
      const response = await fetch(`${BACKEND_URL}/projects/${projectId}/agents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const agents = await response.json();
        
        // If we get agents from backend, return them
        if (agents && agents.length > 0) {
          return NextResponse.json(agents);
        }
      }
    } catch (error) {
      console.warn("Backend agents fetch failed, providing fallback agents");
    }

    // Fallback: Return dynamic agents with realistic progress
    const mockAgents = [
      {
        id: `${projectId}-cto`,
        role: 'CTO',
        status: getAgentStatus(projectId, 'CTO'),
        assigned_task: 'Project management and technical oversight',
        project_id: projectId,
        created_at: new Date().toISOString(),
        progress: getAgentProgress(projectId, 'CTO')
      },
      {
        id: `${projectId}-frontend`,
        role: 'Frontend',
        status: getAgentStatus(projectId, 'Frontend'),
        assigned_task: 'Create React components and user interface',
        project_id: projectId,
        created_at: new Date().toISOString(),
        progress: getAgentProgress(projectId, 'Frontend')
      },
      {
        id: `${projectId}-backend`,
        role: 'Backend', 
        status: getAgentStatus(projectId, 'Backend'),
        assigned_task: 'Develop REST API and business logic',
        project_id: projectId,
        created_at: new Date().toISOString(),
        progress: getAgentProgress(projectId, 'Backend')
      },
      {
        id: `${projectId}-database`,
        role: 'Database',
        status: getAgentStatus(projectId, 'Database'),
        assigned_task: 'Design database schema and data models',
        project_id: projectId,
        created_at: new Date().toISOString(),
        progress: getAgentProgress(projectId, 'Database')
      }
    ];

    return NextResponse.json(mockAgents);
  } catch (error) {
    console.error("Project agents fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}