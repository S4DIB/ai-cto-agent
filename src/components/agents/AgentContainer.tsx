"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentSidebar } from "./AgentSidebar";
import { AgentCodeDisplay } from "./AgentCodeDisplay";
import { AgentSession, agentStorage } from "@/lib/agentStorage";
import { demoAgents } from "@/lib/demoData";

export function AgentContainer() {
  const [currentSession, setCurrentSession] = useState<AgentSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize with existing sessions or create a new one
  useEffect(() => {
    if (!currentSession) {
      const existingSessions = agentStorage.getAllSessions();
      
      if (existingSessions.length > 0) {
        // Load the most recent session
        const mostRecentSession = existingSessions[0];
        setCurrentSession(mostRecentSession);
      } else {
        // Create a new session with demo data
        const newSession = agentStorage.createSession({
          title: "Demo Project - E-commerce Platform",
          description: "A modern e-commerce platform with React, Next.js, and Stripe integration",
          agents: demoAgents,
        });
        setCurrentSession(newSession);
      }
    }
  }, [currentSession]);

  const handleSessionSelect = (session: AgentSession) => {
    setCurrentSession(session);
    setSidebarOpen(false);
  };

  const handleNewSession = () => {
    const newSession = agentStorage.createSession({
      title: "New Project",
      description: "A new agent development project",
      agents: [],
    });
    setCurrentSession(newSession);
    setSidebarOpen(false);
    
    // Force a re-render of the sidebar
    setTimeout(() => {
      window.dispatchEvent(new Event('agent-storage-update'));
    }, 100);
  };

  return (
    <div className="flex h-full bg-black">
      {/* Sidebar - Always visible on desktop */}
      <div className="hidden lg:block">
        <AgentSidebar
          currentSessionId={currentSession?.id || null}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          isOpen={true}
          onToggle={() => {}}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <AgentSidebar
          currentSessionId={currentSession?.id || null}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Main Agent Area */}
      <div className="flex-1 flex flex-col bg-black">
        {/* Header */}
        <div className="border-b border-[#6c47ff]/20 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
          <div className="px-4 sm:container flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-[#6c47ff] to-[#a78bfa] rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🤖</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-kode-mono tracking-wider">AI AGENTS</h1>
                <span className="text-xs text-[#6c47ff] font-kode-mono">CODE GENERATION & DEVELOPMENT</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/chat"
                className="text-[#6c47ff] hover:text-[#6c47ff]/80 font-kode-mono text-sm transition-colors"
              >
                ← Back to Chat
              </a>
            </div>
          </div>
        </div>

        {/* Agent Content Area */}
        <div className="flex-1 overflow-y-auto bg-black">
          {currentSession ? (
            <AgentCodeDisplay session={currentSession} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-[#6c47ff] text-6xl mb-4">🤖</div>
                <h2 className="text-2xl font-bold text-white mb-2">No Project Selected</h2>
                <p className="text-gray-400">Select a project from the sidebar to view agent-generated code</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 