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
            content: "Hello! I'm your AI CTO. I want to understand your vision completely so I can give you the best technical strategy. Let's start with the most important question:\nWhat's your business idea? Describe it in simple terms - what are you building and why?",
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

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !currentSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
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

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "agent",
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, agentMessage];
      setMessages(finalMessages);
      
      // Save to storage
      chatStorage.updateSession(currentSession.id, finalMessages);
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
      setIsLoading(false);
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
        content: "Hello! I'm your AI CTO. I want to understand your vision completely so I can give you the best technical strategy. Let's start with the most important question:\nWhat's your business idea? Describe it in simple terms - what are you building and why?",
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
    <div className="flex h-full bg-black">
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
      <div className="flex-1 flex flex-col bg-black">
        {/* Header */}
        <div className="border-b border-[#6c47ff]/20 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
          <div className="px-4 sm:container flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-[#6c47ff] to-[#a78bfa] rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🤖</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-kode-mono tracking-wider">AI CTO AGENT</h1>
                <span className="text-xs text-[#6c47ff] font-kode-mono">YOUR STRATEGIC TECHNICAL ADVISOR</span>
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
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-black">
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
              <div className="flex items-center space-x-2 bg-black/50 border border-[#6c47ff]/30 rounded-2xl px-4 py-3 max-w-xs backdrop-blur">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#6c47ff] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#6c47ff] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-[#6c47ff] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
                <span className="text-xs sm:text-sm text-[#6c47ff] font-kode-mono">CTO IS STRATEGIZING...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-[#6c47ff]/20 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
          <div className="px-2 sm:px-4 py-2 sm:py-4">
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
} 