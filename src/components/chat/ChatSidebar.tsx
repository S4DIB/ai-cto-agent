"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Download, 
  Upload,
  X,
  Menu,
  Clock
} from "lucide-react";
import { ChatSession, chatStorage } from "@/lib/chatStorage";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSessionSelect: (session: ChatSession) => void;
  onNewSession: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSidebar({ 
  currentSessionId, 
  onSessionSelect, 
  onNewSession, 
  isOpen, 
  onToggle 
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  // Refresh sessions when component mounts or when sessions change
  useEffect(() => {
    const handleStorageChange = () => {
      loadSessions();
    };

    const handleCustomStorageChange = () => {
      loadSessions();
    };

    // Listen for storage events (between tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom events (same tab)
    window.addEventListener('chat-storage-update', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chat-storage-update', handleCustomStorageChange);
    };
  }, []);

  const loadSessions = () => {
    const allSessions = chatStorage.getAllSessions();
    setSessions(allSessions);
  };

  const handleNewSession = () => {
    const newSession = chatStorage.createSession();
    setSessions(prev => [newSession, ...prev]);
    onNewSession();
  };

  const handleDeleteSession = (sessionId: string) => {
    chatStorage.deleteSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleExportSession = (sessionId: string) => {
    const sessionData = chatStorage.exportSession(sessionId);
    if (sessionData) {
      const blob = new Blob([sessionData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-session-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportSession = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const session = chatStorage.importSession(content);
          if (session) {
            setSessions(prev => [session, ...prev]);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
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
         initial={{ x: -300 }}
         animate={{ x: isOpen ? 0 : -300 }}
         transition={{ type: "spring", damping: 25, stiffness: 200 }}
         className={cn(
           "fixed left-0 top-0 h-full w-80 bg-black border-r border-[#6c47ff]/20 z-50 flex flex-col",
           "lg:relative lg:translate-x-0 lg:block"
         )}
         style={{ display: isOpen ? 'flex' : 'none' }}
       >
         {/* Header */}
         <div className="flex items-center justify-between p-4 border-b border-[#6c47ff]/20">
           <h2 className="text-lg font-semibold text-white font-kode-mono tracking-wider">CHAT HISTORY</h2>
           <div className="flex items-center gap-2">
             <button
               onClick={handleNewSession}
               className="p-2 rounded-lg hover:bg-[#6c47ff]/10 transition-colors text-[#6c47ff]"
               title="New Chat"
             >
               <Plus className="w-4 h-4" />
             </button>
             <button
               onClick={onToggle}
               className="p-2 rounded-lg hover:bg-[#6c47ff]/10 transition-colors lg:hidden text-[#6c47ff]"
               title="Close"
             >
               <X className="w-4 h-4" />
             </button>
           </div>
         </div>

         {/* Actions */}
         <div className="p-4 border-b border-[#6c47ff]/20">
           <div className="flex gap-2">
             <button
               onClick={handleImportSession}
               className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[#6c47ff]/10 transition-colors text-[#6c47ff] font-kode-mono"
               title="Import Chat"
             >
               <Upload className="w-4 h-4" />
               Import
             </button>
           </div>
         </div>

                 {/* Sessions List */}
         <div className="flex-1 overflow-y-auto p-2">
           <AnimatePresence>
             {sessions.map((session) => (
               <motion.div
                 key={session.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className={cn(
                   "group relative p-3 rounded-lg cursor-pointer transition-colors",
                   currentSessionId === session.id
                     ? "bg-[#6c47ff]/10 border border-[#6c47ff]/30"
                     : "hover:bg-[#6c47ff]/5"
                 )}
                 onClick={() => onSessionSelect(session)}
               >
                 <div className="flex items-start gap-3">
                   <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#6c47ff]" />
                   <div className="flex-1 min-w-0">
                     <h3 className="font-medium text-sm truncate text-white font-kode-mono">
                       {session.title}
                     </h3>
                     <div className="flex items-center gap-2 mt-1 text-xs text-[#6c47ff] font-kode-mono">
                       <Clock className="w-3 h-3" />
                       {formatDate(session.updatedAt)}
                     </div>
                   </div>
                 </div>

                 {/* Actions */}
                 <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex gap-1">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         handleExportSession(session.id);
                       }}
                       className="p-1 rounded hover:bg-[#6c47ff]/10 transition-colors text-[#6c47ff]"
                       title="Export Chat"
                     >
                       <Download className="w-3 h-3" />
                     </button>
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         handleDeleteSession(session.id);
                       }}
                       className="p-1 rounded hover:bg-red-500/10 transition-colors text-red-400"
                       title="Delete Chat"
                     >
                       <Trash2 className="w-3 h-3" />
                     </button>
                   </div>
                 </div>
               </motion.div>
             ))}
           </AnimatePresence>

           {sessions.length === 0 && (
             <div className="text-center py-8 text-[#6c47ff]">
               <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
               <p className="text-sm font-kode-mono">NO CHAT HISTORY YET</p>
               <p className="text-xs font-kode-mono">START A NEW CONVERSATION TO SEE IT HERE</p>
             </div>
           )}
         </div>
      </motion.div>

             {/* Mobile toggle button */}
       <button
         onClick={onToggle}
         className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-black border border-[#6c47ff]/30 shadow-lg lg:hidden text-[#6c47ff] hover:bg-[#6c47ff]/10 transition-colors"
       >
         <Menu className="w-4 h-4" />
       </button>
    </>
  );
} 