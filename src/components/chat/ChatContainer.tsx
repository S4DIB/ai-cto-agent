"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatSidebar } from "./ChatSidebar";
import { ChatSession, Message, chatStorage } from "@/lib/chatStorage";

export function ChatContainer() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Show sidebar by default
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with existing sessions or create a new one
  useEffect(() => {
    if (!currentSession) {
      const existingSessions = chatStorage.getAllSessions();
      
      if (existingSessions.length > 0) {
        // Load the most recent session
        const mostRecentSession = existingSessions[0];
        setCurrentSession(mostRecentSession);
        setMessages(mostRecentSession.messages);
      } else {
        // Create a new session only if no sessions exist
        const newSession = chatStorage.createSession();
        setCurrentSession(newSession);
        setMessages([
          {
            id: "1",
            content:
              "Hey! I’m your AI CTO—here to help you turn ideas into real, scalable products. We’ll keep things simple, practical, and focused on what actually moves you forward. Quick first step: do you already have a startup idea, or would you like help brainstorming one?",
            sender: "agent",
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [currentSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !currentSession) return;

    const userMessage: Message = {
      id: generateUniqueId(),
      content: content.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Save to storage immediately
    chatStorage.updateSession(currentSession.id, updatedMessages);
    
    // Force sidebar refresh to show the new session immediately
    window.dispatchEvent(new Event('chat-storage-update'));
    
    setIsLoading(true);

    try {
      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        sender: msg.sender,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: content.trim(),
          conversationHistory: conversationHistory
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from AI');
      }

      // Check if project creation is ready
      if (data.isProjectReady && data.projectDetails) {
        // Create project in backend
        await createProject(data.projectDetails);
      }

      // Typewriter effect for agent response
      const fullText: string = data.response || "";
      const typingMessageId = generateUniqueId();
      const base = [...updatedMessages];
      // Seed empty agent message
      setMessages([...base, { id: typingMessageId, content: "", sender: "agent" as const, timestamp: new Date() }]);

      let index = 0;
      const total = fullText.length;
      const step = Math.max(1, Math.floor(total / 400)); // adaptive speed
      const typeNext = () => {
        index = Math.min(total, index + step);
        const typed = fullText.slice(0, index);
        setMessages([...base, { id: typingMessageId, content: typed, sender: "agent" as const, timestamp: new Date() }]);
        if (index < total) {
          setTimeout(typeNext, 10);
        } else {
          // Persist final typed message
          const finalMessages: Message[] = [...base, { id: typingMessageId, content: fullText, sender: "agent" as const, timestamp: new Date() } as Message];
          chatStorage.updateSession(currentSession.id, finalMessages);
        }
      };
      // Stop loader and start typing
      setIsLoading(false);
      typeNext();
      return;
    } catch (error) {
      console.error('Chat API error:', error);
      
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again later.",
        sender: "agent",
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      chatStorage.updateSession(currentSession.id, finalMessages);
    } finally {
      // setIsLoading handled above when starting typewriter
    }
  };

  const createProject = async (projectDetails: any) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectDetails)
      });

      if (!response.ok) {
        console.error('Failed to create project:', response.statusText);
        return;
      }

      const project = await response.json();
      console.log('Project created with ID:', project.id);
      
      // Trigger a refresh of the agents container to pick up the new project
      window.dispatchEvent(new Event('project-created'));
      
      // Execute the project to assign agents and start code generation
      try {
        const executeResponse = await fetch(`/api/projects/${project.id}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (executeResponse.ok) {
          console.log('Project execution started successfully');
        } else {
          console.error('Failed to start project execution');
        }
      } catch (error) {
        console.error('Error executing project:', error);
      }
      
      // Show success message to user
      const successMessage: Message = {
        id: generateUniqueId(),
        content: `🎉 Project "${project.name}" created successfully! 

Your AI CTO has analyzed your startup idea and created a project with the following details:

**Project Name:** ${project.name}
**Description:** ${project.description}
**Requirements:** ${project.requirements.join(', ')}
**Tech Stack:** ${project.tech_stack.join(', ')}

🚀 **Agent Execution Started!** Specialized agents are now working on:
- Frontend Development (React/Next.js)
- Backend API (Node.js/Python) 
- Database Schema Design
- DevOps Configuration

You can view the progress and generated code in the Agents section.`,
        sender: "agent",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, successMessage]);
      chatStorage.updateSession(currentSession.id, [...messages, successMessage]);
      
    } catch (error) {
      console.error('Project creation error:', error);
    }
  };

  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSession(session);
    setMessages(session.messages);
    setSidebarOpen(false);
  };

  const handleNewSession = () => {
    const newSession = chatStorage.createSession();
    setCurrentSession(newSession);
    setMessages([
      {
        id: "1",
        content:
          "Hey! I’m your AI CTO—here to help you turn ideas into real, scalable products. We’ll keep things simple, practical, and focused on what actually moves you forward.\n\nQuick first step: do you already have a startup idea, or would you like help brainstorming one?",
        sender: "agent",
        timestamp: new Date(),
      },
    ]);
    setSidebarOpen(false);
    
    // Force a re-render of the sidebar
    setTimeout(() => {
      window.dispatchEvent(new Event('chat-storage-update'));
    }, 100);
  };

    return (
    <div className="flex h-full bg-neutral-950">
      {/* Sidebar - Always visible on desktop */}
      <div className="hidden lg:block">
        <ChatSidebar
          currentSessionId={currentSession?.id || null}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          isOpen={true}
          onToggle={() => {}}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <ChatSidebar
          currentSessionId={currentSession?.id || null}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-neutral-950">
        {/* Header */}
        <div className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/70">
          <div className="px-4 sm:container flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Removed icon per request */}
              <div className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold text-white font-kode-mono tracking-wider">AI CTO AGENT</h1>
                <span className="text-xs text-slate-400 font-kode-mono">YOUR STRATEGIC TECHNICAL ADVISOR</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/agents"
                className="text-[#6c47ff] hover:text-[#6c47ff]/80 font-kode-mono text-sm transition-colors"
              >
                View Agents →
              </a>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-neutral-950">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ChatMessage message={message} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 max-w-xs backdrop-blur">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#6c47ff] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#6c47ff] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-[#6c47ff] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
                <span className="text-xs sm:text-sm text-slate-300 font-kode-mono">CTO is thinking…</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-neutral-800 bg-neutral-900/90 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/70">
          <div className="px-2 sm:px-4 py-2 sm:py-4">
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
} 