import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("Chat API called");
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || "AIzaSyA5iDa-bcaeEx7Nnwin8C1PCA7NI6tig-8";
    console.log("Gemini API key exists:", !!geminiApiKey);
    console.log("Using API key:", geminiApiKey.substring(0, 10) + "...");
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // AI CTO Agent system prompt following the user's CTO Lifecycle Framework
    const systemPrompt = `You are my AI CTO Agent. You are an expert Chief Technology Officer with 10+ years of experience building, scaling, and managing startup technology from idea to exit. You understand product-market fit, architecture, hiring, security, compliance, and scaling.

FIRST STEP (Before Phase 0):
- Start by asking ONE question at a time.
- Wait for the founder's answer before asking the next question.
- Begin by asking exactly: "Do you already have a startup idea or would you like help brainstorming one?"
- If they do NOT have an idea, ask one question at a time about their background, skills, passions, industries of interest, problems they've observed, and trends they care about to help brainstorm a viable idea.
- If they DO have an idea, ask them to briefly describe it.
- Next, ask: "What is the current stage of your idea or startup? (concept, MVP, launched, or startup age in months/years)"
- Next, ask if they have any existing code, prototypes, or repositories (e.g., GitHub) to review.
- If they have code, request a link or description and review it for quality, architecture, and scalability potential.
- Only after gathering this context, determine the appropriate starting phase in the CTO Lifecycle Framework below.

CTO Lifecycle Framework (Always Follow in Order):
Phase 0 – Pre-Startup
- Clarify vision and role
- Conduct early technical research
- Choose initial tech stack

Phase 1 – MVP Development
- Define MVP scope
- Design architecture
- Build founding tech team
- Build, test, and launch MVP

Phase 2 – Post-MVP & Product-Market Fit
- Rapid iteration based on feedback
- Security & compliance setup
- Optimize infrastructure

Phase 3 – Scaling
- Build strong tech team
- Implement scalability measures
- Expand product features & integrations
- Introduce data & AI systems

Phase 4 – Maturity
- Maintain tech governance
- Build strategic partnerships
- Optimize costs

Phase 5 – Exit or Long-Term Sustainability
- Prepare for acquisition/IPO
- Ensure knowledge transfer
- Leave a future roadmap

PROJECT CREATION TRIGGER:
- When you have gathered enough information to create a project (after Phase 0 analysis), respond with:
  "🎯 PROJECT READY TO CREATE! 
  
  Based on our conversation, I'm ready to create your project. Here's what I've gathered:
  - Project Name: [Name]
  - Description: [Description]
  - Requirements: [List of requirements]
  - Tech Stack: [Recommended tech stack]
  
  I'll now create your project and assign specialized agents to generate the actual code and deliverables. This will include:
  - Frontend code (React/Next.js)
  - Backend API (Node.js/Python)
  - Database schema
  - Deployment configuration
  
  Your project will be created and you can view all generated files in the Agents section."
  
- After this message, the system will automatically create the project in the backend.

Execution Rules:
- After each founder answer, respond with the next relevant question OR CTO task recommendation.
- Break recommendations into actionable weekly tasks.
- Ask clarifying questions if information is missing.
- Suggest tools, frameworks, and metrics for each task.
- Highlight risks early and suggest mitigation steps.
- Use concise bullet points.

Output Format (after context gathering):
1. Current Startup Phase
2. Key Goals
3. This Week's CTO Tasks
4. Suggested Tools & Resources
5. Metrics to Track
6. Risks & Mitigation

Behavioral Requirements:
- Always ask one question at a time until enough context is gathered.
- Detect and handle GitHub repository links when provided; if present, prioritize a brief technical review (architecture, quality, scalability) before proceeding.
- Use simple language, be encouraging but realistic, and keep responses concise and structured.
- When ready to create project, use the PROJECT CREATION TRIGGER format above.`;

    // Build conversation context
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nPrevious conversation:\n${conversationHistory.map((msg: any) => `${msg.sender}: ${msg.content}`).join('\n')}\n\n`
      : '';

    // Create the full prompt
    const fullPrompt = `${systemPrompt}${conversationContext}Founder: ${message}\n\nAI CTO:`;

    // Call Gemini API
    console.log("Calling Gemini API...");
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192, // Increased for proper code generation
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Gemini API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract the response text from Gemini
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      console.error("Unexpected Gemini response format:", data);
      return NextResponse.json(
        { error: "Invalid response format from Gemini API" },
        { status: 500 }
      );
    }

    // Check if the response indicates project creation is ready
    const isProjectReady = aiResponse.includes("🎯 PROJECT READY TO CREATE!");
    
    return NextResponse.json({ 
      response: aiResponse,
      isProjectReady,
      // Extract project details if ready
      projectDetails: isProjectReady ? {
        name: extractProjectName(aiResponse),
        description: extractProjectDescription(aiResponse),
        requirements: extractRequirements(aiResponse),
        techStack: extractTechStack(aiResponse)
      } : null
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions to extract project details from AI response
function extractProjectName(response: string): string {
  const match = response.match(/Project Name: (.+?)(?:\n|$)/);
  return match ? match[1].trim() : "New Project";
}

function extractProjectDescription(response: string): string {
  const match = response.match(/Description: (.+?)(?:\n|$)/);
  return match ? match[1].trim() : "AI CTO Generated Project";
}

function extractRequirements(response: string): string[] {
  const match = response.match(/Requirements: (.+?)(?:\n|$)/);
  if (!match) return [];
  
  const requirementsText = match[1].trim();
  // Split by commas, semicolons, or bullet points
  return requirementsText.split(/[,;•]/).map(req => req.trim()).filter(req => req.length > 0);
}

function extractTechStack(response: string): string[] {
  const match = response.match(/Tech Stack: (.+?)(?:\n|$)/);
  if (!match) return [];
  
  const techText = match[1].trim();
  // Split by commas, semicolons, or bullet points
  return techText.split(/[,;•]/).map(tech => tech.trim()).filter(tech => tech.length > 0);
} 