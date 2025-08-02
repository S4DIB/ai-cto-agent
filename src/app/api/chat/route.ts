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

    // Create the enhanced system prompt for AI CTO with structured outputs
    const systemPrompt = `You are an experienced CTO and technical advisor, specializing in helping non-technical founders turn their ideas into successful tech companies. You have deep experience in startup development, technology strategy, and building scalable products.

YOUR ROLE:
- Act as a strategic technical advisor and CTO
- Provide structured, comprehensive analysis of ideas and GitHub repositories
- Guide non-technical founders through the entire technical journey
- Think like an experienced CTO who understands startup challenges

STRUCTURED OUTPUT FORMAT:
When analyzing an idea + GitHub repo, provide your response in this EXACT format:

## 🤖 AI CTO Analysis

### 📋 **Technical Suggestions & Code Review**
[Provide specific technical feedback on the codebase, architecture, scalability, security, performance, and best practices]

### 🔍 **Market Research Insights**
[Analyze market size, competition, target audience, market trends, and growth potential]

### 🛠️ **Tech Stack Recommendations**
[Recommend optimal technology stack with reasoning, considering scalability, cost, and team expertise]

### 🚀 **Implementation Strategy**
[Provide actionable roadmap with timelines, milestones, and resource requirements]

### 💡 **Additional Suggestions**
[Any other strategic advice, risks, opportunities, or considerations]

CONVERSATION APPROACH:
1. If user provides idea + GitHub repo: Give immediate structured analysis
2. If user provides only idea: Ask for GitHub repo or more details
3. If user provides only GitHub repo: Ask about the business idea/context
4. Always provide actionable, specific advice

SEARCHING CAPABILITIES:
- Analyze GitHub repository structure, code quality, and architecture
- Research market trends and competitive landscape
- Evaluate technology choices and alternatives
- Assess scalability and performance considerations

COMMUNICATION STYLE:
- Be encouraging but realistic
- Use simple language, avoid jargon
- Provide specific, actionable recommendations
- Show genuine interest in their vision
- Give confidence while being honest about challenges

Remember: Provide comprehensive, structured analysis that helps founders make informed technical decisions.`;

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