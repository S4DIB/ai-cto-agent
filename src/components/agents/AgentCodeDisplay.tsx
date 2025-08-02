"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Copy, Check, Download, Code, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentSession, Agent } from "@/lib/agentStorage";

interface AgentCodeDisplayProps {
  session: AgentSession;
}

export function AgentCodeDisplay({ session }: AgentCodeDisplayProps) {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [copiedAgent, setCopiedAgent] = useState<string | null>(null);

  const toggleAgent = (agentId: string) => {
    const newExpanded = new Set(expandedAgents);
    if (newExpanded.has(agentId)) {
      newExpanded.delete(agentId);
    } else {
      newExpanded.add(agentId);
    }
    setExpandedAgents(newExpanded);
  };

  const copyToClipboard = async (text: string, agentId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAgent(agentId);
      setTimeout(() => setCopiedAgent(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadCode = (agent: Agent) => {
    const blob = new Blob([agent.code], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.name.toLowerCase().replace(/\s+/g, '-')}-code.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'working':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Agent['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'working':
        return 'Working';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Project Header */}
      <div className="bg-black/30 border border-[#6c47ff]/20 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{session.title}</h1>
            <p className="text-gray-400 mb-4">{session.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{session.agents.length} agents assigned</span>
              <span>•</span>
              <span>Updated {new Date(session.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-sm text-gray-400">Project Status</div>
              <div className="text-lg font-semibold text-white">
                {session.agents.every(agent => agent.status === 'completed') 
                  ? 'Completed' 
                  : session.agents.some(agent => agent.status === 'working')
                  ? 'In Progress'
                  : 'Pending'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Agent Output</h2>
        
        {session.agents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[#6c47ff] text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Agents Assigned</h3>
            <p className="text-gray-400">Agents will appear here once they start generating code</p>
          </div>
        ) : (
          <AnimatePresence>
            {session.agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-black/30 border border-[#6c47ff]/20 rounded-lg overflow-hidden"
              >
                {/* Agent Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#6c47ff]/10">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className="text-[#6c47ff] hover:text-[#6c47ff]/80 transition-colors"
                    >
                      {expandedAgents.has(agent.id) ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#6c47ff] to-[#a78bfa] rounded-lg flex items-center justify-center">
                        <Code size={16} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{agent.name}</h3>
                        <p className="text-gray-400 text-sm">{agent.role}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Status */}
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                      <span className="text-sm text-gray-400">{getStatusText(agent.status)}</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => copyToClipboard(agent.code, agent.id)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#6c47ff]/10 rounded transition-colors"
                        title="Copy Code"
                      >
                        {copiedAgent === agent.id ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => downloadCode(agent)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#6c47ff]/10 rounded transition-colors"
                        title="Download Code"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Agent Code Content */}
                <AnimatePresence>
                  {expandedAgents.has(agent.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 bg-black/20">
                        <div className="text-gray-300 space-y-4">
                          {/* Debug: Show raw code length */}
                          <div className="text-xs text-gray-500 mb-2">
                            Code length: {agent.code.length} characters
                          </div>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Custom code block styling
                              code: ({ node, inline, className, children, ...props }: any) => {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <div className="relative mb-4">
                                    <div className="absolute top-2 right-2 flex space-x-1">
                                      <span className="text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
                                        {match[1]}
                                      </span>
                                    </div>
                                    <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  </div>
                                ) : (
                                  <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              // Custom heading styling
                              h1: ({ children }) => (
                                <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-xl font-bold text-white mb-3 mt-5">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-lg font-semibold text-white mb-2 mt-4">
                                  {children}
                                </h3>
                              ),
                              // Custom paragraph styling
                              p: ({ children }) => (
                                <p className="text-gray-300 mb-3 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              // Custom list styling
                              ul: ({ children }) => (
                                <ul className="text-gray-300 mb-3 space-y-1 list-disc list-inside">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="text-gray-300 mb-3 space-y-1 list-decimal list-inside">
                                  {children}
                                </ol>
                              ),
                              // Custom blockquote styling
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-[#6c47ff] pl-4 italic text-gray-300 mb-3">
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {agent.code}
                          </ReactMarkdown>
                          
                          {/* Fallback: Show raw code if needed */}
                          <details className="mt-4">
                            <summary className="text-xs text-gray-500 cursor-pointer">Show raw code</summary>
                            <pre className="mt-2 p-2 bg-gray-900 rounded text-xs overflow-x-auto">
                              {agent.code}
                            </pre>
                          </details>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
} 