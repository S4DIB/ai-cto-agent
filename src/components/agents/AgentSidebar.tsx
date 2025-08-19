"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Menu } from "lucide-react";
import { AgentSession, agentStorage } from "@/lib/agentStorage";

interface AgentSidebarProps {
  currentSessionId: string | null;
  onSessionSelect: (session: AgentSession) => void;
  onNewSession: () => void;
  isOpen: boolean;
  onToggle: () => void;
  sessions: AgentSession[];
}

export function AgentSidebar({
  currentSessionId,
  onSessionSelect,
  onNewSession,
  isOpen,
  onToggle,
  sessions,
}: AgentSidebarProps) {
  // Sessions are now passed as props - no local state or useEffect needed

  const handleDeleteSession = (sessionId: string) => {
    agentStorage.deleteSession(sessionId);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%',
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60 border-r border-[#6c47ff]/20 flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#6c47ff]/20">
          <h2 className="text-lg font-bold text-white font-kode-mono">Agent Projects</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onNewSession}
              className="p-2 text-[#6c47ff] hover:bg-[#6c47ff]/10 rounded-lg transition-colors"
              title="New Project"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={onToggle}
              className="p-2 text-[#6c47ff] hover:bg-[#6c47ff]/10 rounded-lg transition-colors lg:hidden"
              title="Close Sidebar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`relative group cursor-pointer rounded-lg p-4 transition-all duration-200 ${
                  currentSessionId === session.id
                    ? 'bg-[#6c47ff]/20 border-[#6c47ff]/40'
                    : 'bg-black/30 border border-[#6c47ff]/10 hover:bg-[#6c47ff]/10 hover:border-[#6c47ff]/30'
                } border`}
                onClick={() => onSessionSelect(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate mb-1">
                      {session.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                      {session.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{session.agents.length} agents</span>
                      <span>{formatDate(session.updatedAt)}</span>
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all duration-200"
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Agent Status Indicators */}
                {session.agents.length > 0 && (
                  <div className="flex items-center space-x-1 mt-3">
                    {session.agents.slice(0, 3).map((agent) => (
                      <div
                        key={agent.id}
                        className={`w-2 h-2 rounded-full ${
                          agent.status === 'completed'
                            ? 'bg-green-500'
                            : agent.status === 'working'
                            ? 'bg-yellow-500'
                            : agent.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                        }`}
                        title={`${agent.name}: ${agent.status}`}
                      />
                    ))}
                    {session.agents.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{session.agents.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {sessions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-[#6c47ff] text-4xl mb-4">🤖</div>
              <h3 className="text-white font-semibold mb-2">No Projects Yet</h3>
              <p className="text-gray-400 text-sm mb-4">
                Create your first agent project to get started
              </p>
              <button
                onClick={onNewSession}
                className="bg-[#6c47ff] text-white px-4 py-2 rounded-lg hover:bg-[#6c47ff]/80 transition-colors"
              >
                Create Project
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 p-2 bg-[#6c47ff] text-white rounded-lg lg:hidden"
        title="Toggle Sidebar"
      >
        <Menu size={20} />
      </button>
    </>
  );
} 