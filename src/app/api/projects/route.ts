import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const { name, description, requirements, tech_stack } = await request.json();

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    // Create project data in the format expected by the backend
    const projectData = {
      name,
      description,
      requirements: requirements || [],
      tech_stack: tech_stack || []
    };

    // Send request to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to create project' },
        { status: response.status }
      );
    }

    const project = await response.json();
    return NextResponse.json(project);
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Fetch projects from FastAPI backend
    const response = await fetch(`${BACKEND_URL}/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch projects' },
        { status: response.status }
      );
    }

    const projects = await response.json();
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Project fetch error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}