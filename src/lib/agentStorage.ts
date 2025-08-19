export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'pending' | 'working' | 'completed' | 'error';
  code: string;
  timestamp: Date;
}

export interface AgentSession {
  id: string;
  title: string;
  description: string;
  agents: Agent[];
  createdAt: Date;
  updatedAt: Date;
}

class AgentStorage {
  private readonly STORAGE_KEY = 'agent-sessions';

  getAllSessions(): AgentSession[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const sessions = JSON.parse(stored);
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        agents: session.agents.map((agent: any) => ({
          ...agent,
          timestamp: new Date(agent.timestamp),
        })),
      }));
    } catch (error) {
      console.error('Error loading agent sessions:', error);
      return [];
    }
  }

  getSession(id: string): AgentSession | null {
    const sessions = this.getAllSessions();
    return sessions.find(session => session.id === id) || null;
  }

  createSession(data: { title: string; description: string; agents?: Agent[] }): AgentSession {
    const session: AgentSession = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      agents: data.agents || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sessions = this.getAllSessions();
    sessions.unshift(session);
    this.saveSessions(sessions);

    // Dispatch event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('agent-storage-update'));
    }

    return session;
  }

  updateSession(id: string, updates: Partial<AgentSession>): void {
    const sessions = this.getAllSessions();
    const index = sessions.findIndex(session => session.id === id);
    
    if (index !== -1) {
      sessions[index] = {
        ...sessions[index],
        ...updates,
        updatedAt: new Date(),
      };
      this.saveSessions(sessions);

      // Dispatch event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('agent-storage-update'));
      }
    }
  }

  addAgent(sessionId: string, agent: Omit<Agent, 'id' | 'timestamp'>): void {
    const sessions = this.getAllSessions();
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex !== -1) {
      const newAgent: Agent = {
        ...agent,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      
      sessions[sessionIndex].agents.push(newAgent);
      sessions[sessionIndex].updatedAt = new Date();
      this.saveSessions(sessions);

      // Dispatch event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('agent-storage-update'));
      }
    }
  }

  updateAgent(sessionId: string, agentId: string, updates: Partial<Agent>): void {
    const sessions = this.getAllSessions();
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex !== -1) {
      const agentIndex = sessions[sessionIndex].agents.findIndex(agent => agent.id === agentId);
      
      if (agentIndex !== -1) {
        sessions[sessionIndex].agents[agentIndex] = {
          ...sessions[sessionIndex].agents[agentIndex],
          ...updates,
        };
        sessions[sessionIndex].updatedAt = new Date();
        this.saveSessions(sessions);

        // Dispatch event for real-time updates
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('agent-storage-update'));
        }
      }
    }
  }

  deleteSession(id: string): void {
    const sessions = this.getAllSessions();
    const filteredSessions = sessions.filter(session => session.id !== id);
    this.saveSessions(filteredSessions);

    // Dispatch event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('agent-storage-update'));
    }
  }

  clearAll(): void {
    this.saveSessions([]);

    // Dispatch event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('agent-storage-update'));
    }
  }

  private saveSessions(sessions: AgentSession[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving agent sessions:', error);
    }
  }
}

export const agentStorage = new AgentStorage(); 