"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="space-y-2">
      {/* Input hint */}
      <div className="text-xs text-[#6c47ff]/70 font-kode-mono px-1">
        💡 <strong>Pro tip:</strong> Include your GitHub repo URL for detailed technical analysis, market research, and tech stack recommendations
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2">
        {/* Attachment button */}
        <motion.button
          type="button"
          className="flex-shrink-0 p-1.5 sm:p-2 rounded-full bg-black border border-[#6c47ff]/30 hover:bg-[#6c47ff]/10 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={disabled}
        >
          <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 text-[#6c47ff]" />
        </motion.button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your idea + GitHub repo URL for comprehensive analysis..."
            className={cn(
              "w-full resize-none rounded-xl sm:rounded-2xl border border-[#6c47ff]/30 bg-black/50 text-white placeholder:text-[#6c47ff]/60 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-kode-mono focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur",
              "min-h-[40px] sm:min-h-[44px] max-h-24 sm:max-h-32"
            )}
            disabled={disabled}
            rows={1}
            style={{ 
              fontSize: '16px', // Prevents zoom on iOS
              lineHeight: '1.2'
            }}
          />
        </div>

        {/* Send button */}
        <motion.button
          type="submit"
          disabled={!message.trim() || disabled}
          className={cn(
            "flex-shrink-0 p-2 sm:p-3 rounded-full bg-gradient-to-r from-[#6c47ff] to-[#a78bfa] text-white hover:from-[#7d5fff] hover:to-[#b794ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg",
            !message.trim() && "bg-black border border-[#6c47ff]/30 text-[#6c47ff]"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Send className="w-3 h-3 sm:w-4 sm:h-4" />
        </motion.button>
              </div>
      </form>
    </div>
  );
} 