import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Fetch project details from FastAPI backend
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch project' },
        { status: response.status }
      );
    }

    const project = await response.json();
    return NextResponse.json(project);
  } catch (error) {
    console.error("Project fetch error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Send chat message to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to process chat message' },
        { status: response.status }
      );
    }

    const chatResponse = await response.json();
    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error("Project chat error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}