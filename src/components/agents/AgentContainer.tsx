"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentSidebar } from "./AgentSidebar";
import { AgentCodeDisplay } from "./AgentCodeDisplay";
import { AgentSession, agentStorage } from "@/lib/agentStorage";
import { clearAllOldSessions } from "@/lib/clearOldSessions";

export function AgentContainer() {
  const [currentSession, setCurrentSession] = useState<AgentSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects from backend
  useEffect(() => {
    // FORCE CLEAR ALL OLD SESSIONS ON COMPONENT MOUNT TO FIX ID MISMATCH
    console.log('🧨 FORCE CLEARING ALL localStorage on component mount');
    clearAllOldSessions();
    
    fetchProjects();
    
    // Listen for project creation events
    const handleProjectCreated = () => {
      console.log('Project created event received - refreshing projects');
      fetchProjects();
    };
    
    window.addEventListener('project-created', handleProjectCreated);
    
    return () => {
      window.removeEventListener('project-created', handleProjectCreated);
    };
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        console.error('Failed to fetch projects');
        return;
      }
      
      const projectsData = await response.json();
      setProjects(projectsData);
      
      // Create agent sessions for each project
      const sessions = projectsData.map((project: any) => {
        console.log('Creating session for project:', project.id, project.name);
        return {
          id: project.id,
          title: project.name,
          description: project.description,
          agents: project.agents || [],
          timestamp: new Date(project.created_at),
        };
      });
      
      // Clear any old sessions and update with real projects
      console.log('🧹 Clearing all old sessions from localStorage');
      agentStorage.clearAll();
      
      // Prioritize projects with requirements, but show all projects
      const sortedProjects = sessions.sort((a, b) => {
        const projectA = projects.find(p => p.id === a.id);
        const projectB = projects.find(p => p.id === b.id);
        const reqA = projectA?.requirements?.length || 0;
        const reqB = projectB?.requirements?.length || 0;
        console.log(`📋 Project ${a.title}: ${reqA} requirements`);
        console.log(`📋 Project ${b.title}: ${reqB} requirements`);
        // Sort by requirements count (descending) - projects with more requirements first
        return reqB - reqA;
      });
      
      console.log(`📝 Creating ${sortedProjects.length} sessions (sorted by requirements):`);
      sortedProjects.forEach(session => {
        console.log(`  ✅ Session: ${session.id} (${session.title})`);
        agentStorage.createSession(session);
      });
      
      setSessions(sortedProjects);
      
      // Set current session to first project (should be the one with most requirements)
      if (sortedProjects.length > 0 && !currentSession) {
        console.log(`🎯 Setting current session to: ${sortedProjects[0].title}`);
        setCurrentSession(sortedProjects[0]);
      }
      
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize with existing sessions or create a new one
  useEffect(() => {
    if (!currentSession && projects.length > 0) {
      const existingSessions = agentStorage.getAllSessions();
      
      if (existingSessions.length > 0) {
        // Load the most recent session
        const mostRecentSession = existingSessions[0];
        setCurrentSession(mostRecentSession);
      }
    }
  }, [currentSession, projects]);

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

  if (loading) {
    return (
      <div className="flex h-full bg-black items-center justify-center">
        <div className="text-center">
          <div className="text-[#6c47ff] text-6xl mb-4">🤖</div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Projects...</h2>
          <p className="text-gray-400">Fetching your AI-generated projects</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-full bg-black items-center justify-center">
        <div className="text-center">
          <div className="text-[#6c47ff] text-6xl mb-4">🤖</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Projects Yet</h2>
          <p className="text-gray-400">Start a conversation with your AI CTO to create your first project</p>
          <a
            href="/chat"
            className="inline-block mt-4 px-6 py-3 bg-[#6c47ff] text-white rounded-lg font-kode-mono hover:bg-[#7d5fff] transition-colors"
          >
            Go to Chat
          </a>
        </div>
      </div>
    );
  }

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
          sessions={sessions}
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
          sessions={sessions}
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