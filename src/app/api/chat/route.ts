import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    
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
3. This Week’s CTO Tasks
4. Suggested Tools & Resources
5. Metrics to Track
6. Risks & Mitigation

Behavioral Requirements:
- Always ask one question at a time until enough context is gathered.
- Detect and handle GitHub repository links when provided; if present, prioritize a brief technical review (architecture, quality, scalability) before proceeding.
- Use simple language, be encouraging but realistic, and keep responses concise and structured.`;

    // Build conversation context
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nPrevious conversation:\n${conversationHistory.map((msg: any) => `${msg.sender}: ${msg.content}`).join('\n')}\n\n`
      : '';

    // Create the full prompt
    const fullPrompt = `${systemPrompt}${conversationContext}Founder: ${message}\n\nAI CTO:`;

    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
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
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from Gemini API" },
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

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 