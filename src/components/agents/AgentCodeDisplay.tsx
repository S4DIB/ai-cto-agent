"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AgentSession } from "@/lib/agentStorage";

interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: string;
  agents: any[];
  deliverables: any[];
  code_files: any[];
}

export function AgentCodeDisplay({ session }: { session: AgentSession }) {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (session?.id) {
      fetchProjectData(session.id);
    }
  }, [session?.id]);

  const executeProject = async () => {
    if (!session?.id) {
      console.error('No session ID available');
      return;
    }
    
    try {
      setExecuting(true);
      console.log(`Executing project ${session.id}...`);
      
      const response = await fetch(`/api/projects/${session.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`Execute response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Project execution started successfully:', result);
        
        // Refresh project data once to show updated status
        await fetchProjectData(session.id);
      } else {
        const errorText = await response.text();
        console.error('Failed to start project execution:', response.status, errorText);
        alert(`Failed to execute project: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error executing project:', error);
      alert(`Error executing project: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const fetchProjectData = async (projectId: string) => {
    if (!projectId) {
      console.warn('No project ID provided to fetchProjectData');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`🔍 DEBUG: Fetching data for project: ${projectId}`);
      console.log(`🔍 DEBUG: Project ID type: ${typeof projectId}`);
      console.log(`🔍 DEBUG: Project ID length: ${projectId.length}`);
      console.log(`🔍 DEBUG: Is UUID format: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)}`);
      
      // Fetch project details
      const projectUrl = `/api/projects/${projectId}?t=${Date.now()}`;
      console.log(`🔍 DEBUG: Fetching project from URL: ${projectUrl}`);
      
      const projectResponse = await fetch(projectUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      console.log(`🔍 DEBUG: Project response status: ${projectResponse.status}`);
      
      if (projectResponse.ok) {
        const project = await projectResponse.json();
        
        // Fetch agents
        const agentsResponse = await fetch(`/api/projects/${projectId}/agents`);
        const agents = agentsResponse.ok ? await agentsResponse.json() : [];
        
        // Fetch deliverables
        const deliverablesResponse = await fetch(`/api/projects/${projectId}/deliverables`);
        const deliverables = deliverablesResponse.ok ? await deliverablesResponse.json() : [];
        
        // Fetch code files
        console.log(`🎨 Fetching code files for project: ${projectId}`);
        const codeResponse = await fetch(`/api/projects/${projectId}/code`);
        console.log(`📝 Code response status: ${codeResponse.status}`);
        const codeFiles = codeResponse.ok ? await codeResponse.json() : [];
        console.log(`📦 Code files received: ${codeFiles.length} files`);
        
        setProjectData({
          ...project,
          agents,
          deliverables,
          code_files: codeFiles
        });
        
        console.log(`✅ Successfully loaded project data for: ${projectId}`);
      } else {
        console.error(`Failed to fetch project: ${projectResponse.status}`);
        const errorText = await projectResponse.text();
        console.error(`Error details: ${errorText}`);
        
        // Set a fallback project with error info
        setProjectData({
          id: projectId,
          name: "Project Load Error",
          description: `Failed to load project (${projectResponse.status})`,
          status: "error",
          agents: [],
          deliverables: [],
          code_files: []
        });
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-[#6c47ff] text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading project data...</p>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <p className="text-gray-400">Failed to load project data</p>
          <p className="text-sm text-gray-500 mt-2">Project ID: {session?.id}</p>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => session?.id && fetchProjectData(session.id)}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Retry Loading
            </button>
            <button 
              onClick={() => {
                if (session?.id) {
                  // Clear cache and force fresh fetch
                  fetch(`/api/projects/${session.id}/code?force=true&t=${Date.now()}`, {
                    cache: 'no-store'
                  }).then(() => {
                    fetchProjectData(session.id);
                  });
                }
              }}
              className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Force Refresh Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white">
      {/* Project Header */}
      <div className="p-6 border-b border-[#6c47ff]/20">
        <h1 className="text-3xl font-bold text-white mb-2">{projectData.name}</h1>
        <p className="text-gray-400 text-lg mb-4">{projectData.description}</p>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            projectData.status === 'completed' ? 'bg-green-500/20 text-green-400' :
            projectData.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {projectData.status.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-gray-500 text-sm">
            {projectData.agents.length} agents assigned
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#6c47ff]/20">
        <div className="flex space-x-8 px-6">
          {[
            { id: "overview", label: "Overview" },
            { id: "agents", label: "Agents" },
            { id: "code", label: "Code" },
            { id: "deliverables", label: "Deliverables" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-[#6c47ff] text-[#6c47ff]"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-900 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Project Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white">{projectData.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Agents:</span>
                    <span className="text-white">{projectData.agents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deliverables:</span>
                    <span className="text-white">{projectData.deliverables.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Code Files:</span>
                    <span className="text-white">{projectData.code_files.length}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-900 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={executeProject}
                    disabled={executing}
                    className="w-full bg-[#6c47ff] text-white py-2 px-4 rounded hover:bg-[#7d5fff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {executing ? 'Executing...' : 'Execute Project'}
                  </button>
                  <button 
                    onClick={() => fetchProjectData(session.id)}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Refreshing...' : 'Refresh Status'}
                  </button>
                  <button className="w-full bg-neutral-700 text-white py-2 px-4 rounded hover:bg-neutral-600 transition-colors">
                    Download Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "agents" && (
          <div className="space-y-4">
            {projectData.agents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No agents assigned yet</p>
              </div>
            ) : (
              projectData.agents.map((agent) => (
                <div key={agent.id} className="bg-neutral-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{agent.role}</h4>
                      <p className="text-gray-400 text-sm">{agent.status}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Progress</div>
                      <div className="text-lg font-bold text-[#6c47ff]">{agent.progress}%</div>
                    </div>
                  </div>
                  {agent.progress < 100 && (
                    <div className="mt-3">
                      <div className="w-full bg-neutral-700 rounded-full h-2">
                        <div 
                          className="bg-[#6c47ff] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${agent.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "code" && (
          <div className="space-y-4">
            {projectData.code_files.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-[#6c47ff] text-4xl mb-4">🤖</div>
                <p className="text-gray-400">AI is generating your custom code...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments. Real AI code generation in progress!</p>
                <div className="mt-4">
                  <div className="animate-pulse flex space-x-1 justify-center">
                    <div className="h-2 w-2 bg-[#6c47ff] rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-[#6c47ff] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="h-2 w-2 bg-[#6c47ff] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 text-xl">✅</span>
                    <span className="text-green-400 font-medium">AI Code Generation Complete!</span>
                    <span className="text-sm text-green-300">({projectData.code_files.length} files generated)</span>
                  </div>
                  <p className="text-sm text-green-300 mt-1">Your custom application is ready. This is real, production-ready code generated specifically for your project.</p>
                </div>
                
                {projectData.code_files.map((file, index) => (
                  <div key={file.id || file.filename || `file-${index}`} className="bg-neutral-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-white">{file.filename || file.file_path || file.path || 'Unknown File'}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 bg-[#6c47ff]/20 text-[#6c47ff] rounded">AI Generated</span>
                        <span className="text-sm text-gray-400">{file.language || 'text'}</span>
                      </div>
                    </div>
                    {file.description && (
                      <p className="text-gray-400 text-sm mb-3">{file.description}</p>
                    )}
                    <pre className="bg-black rounded p-3 overflow-x-auto">
                      <code className="text-sm text-gray-300">{file.content}</code>
                    </pre>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === "deliverables" && (
          <div className="space-y-4">
            {projectData.deliverables.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No deliverables generated yet</p>
                <p className="text-sm text-gray-500 mt-2">Execute the project to generate deliverables</p>
              </div>
            ) : (
              projectData.deliverables.map((deliverable) => (
                <div key={deliverable.id} className="bg-neutral-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">{deliverable.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      deliverable.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      deliverable.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {deliverable.status}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-3">{deliverable.description}</p>
                  {deliverable.content && (
                    <div className="bg-black rounded p-3">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">{deliverable.content}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 