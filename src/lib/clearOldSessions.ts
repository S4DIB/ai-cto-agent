// Utility to completely clear old timestamp-based sessions
export function clearAllOldSessions() {
  try {
    // Clear all localStorage
    localStorage.clear();
    
    // Clear sessionStorage too
    sessionStorage.clear();
    
    // Clear specific keys that might persist
    const keysToRemove = [
      'agent-sessions',
      'chat-sessions', 
      'current-session',
      'projects',
      'agents'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('🧨 Completely cleared all old sessions and storage');
    return true;
  } catch (error) {
    console.error('Error clearing old sessions:', error);
    return false;
  }
}
