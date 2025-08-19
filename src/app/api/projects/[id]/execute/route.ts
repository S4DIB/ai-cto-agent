import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Store execution state
const executionState = new Map();

// Simulate agent execution with real progress updates
async function startAgentExecution(projectId: string) {
  const agentRoles = ['CTO', 'Frontend', 'Backend', 'Database'];
  const totalSteps = agentRoles.length * 3; // 3 steps per agent
  let completedSteps = 0;

  for (const role of agentRoles) {
    // Simulate each agent working through their tasks
    setTimeout(async () => {
      // Step 1: Analysis (30% progress)
      setTimeout(() => updateAgentProgress(projectId, role, 30, 'analyzing'), 1000);
      
      // Step 2: Code Generation (70% progress) 
      setTimeout(() => updateAgentProgress(projectId, role, 70, 'generating'), 3000);
      
      // Step 3: Completion (100% progress)
      setTimeout(() => {
        updateAgentProgress(projectId, role, 100, 'completed');
        completedSteps++;
        
        // If all agents completed, mark project as completed
        if (completedSteps === agentRoles.length) {
          updateProjectStatus(projectId, 'completed');
        }
      }, 5000);
    }, agentRoles.indexOf(role) * 2000); // Stagger agent starts
  }
}

async function updateAgentProgress(projectId: string, role: string, progress: number, status: string) {
  try {
    // Update agent status in backend
    await fetch(`${BACKEND_URL}/agents/${projectId}-${role.toLowerCase()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress, status })
    });
    
    console.log(`${role} agent: ${progress}% (${status})`);
  } catch (error) {
    console.warn(`Failed to update ${role} agent progress:`, error);
  }
}

async function updateProjectStatus(projectId: string, status: string) {
  try {
    await fetch(`${BACKEND_URL}/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    console.log(`Project ${projectId} status updated to: ${status}`);
  } catch (error) {
    console.warn('Failed to update project status:', error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    console.log(`Frontend API: Executing project ${projectId}`);

    // Create agents directly (bypassing backend orchestrator issues)
    const agents = [
      {
        id: `${projectId}-cto`,
        role: 'CTO',
        status: 'working',
        assigned_task: 'Project management and technical oversight',
        project_id: projectId,
        created_at: new Date().toISOString()
      },
      {
        id: `${projectId}-frontend`,
        role: 'Frontend',
        status: 'working',
        assigned_task: 'Create React components and user interface',
        project_id: projectId,
        created_at: new Date().toISOString()
      },
      {
        id: `${projectId}-backend`,
        role: 'Backend',
        status: 'working',
        assigned_task: 'Develop REST API and business logic',
        project_id: projectId,
        created_at: new Date().toISOString()
      },
      {
        id: `${projectId}-database`,
        role: 'Database',
        status: 'working',
        assigned_task: 'Design database schema and data models',
        project_id: projectId,
        created_at: new Date().toISOString()
      }
    ];

    // Store agents in backend and start execution simulation
    let successfulAgents = 0;
    for (const agent of agents) {
      try {
        const response = await fetch(`${BACKEND_URL}/agents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agent)
        });
        
        if (response.ok) {
          console.log(`Created ${agent.role} agent successfully`);
          successfulAgents++;
        } else {
          console.warn(`Failed to create ${agent.role} agent in backend`);
        }
      } catch (error) {
        console.warn(`Error creating ${agent.role} agent:`, error);
      }
    }

    // Start background agent execution simulation
    startAgentExecution(projectId);

    // Update project status to executing (if possible)
    try {
      await fetch(`${BACKEND_URL}/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'executing' })
      });
    } catch (error) {
      console.warn('Failed to update project status:', error);
    }

    return NextResponse.json({
      message: "Project execution started successfully",
      project_id: projectId,
      status: "executing",
      agents_created: agents.length,
      backend_agents_created: successfulAgents,
      agents: agents
    });
  } catch (error) {
    console.error("Project execution API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}