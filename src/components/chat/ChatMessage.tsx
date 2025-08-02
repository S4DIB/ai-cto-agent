import { Message } from "./ChatContainer";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <motion.div
      className={cn(
        "flex items-start gap-2 sm:gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[#6c47ff] to-[#a78bfa] flex items-center justify-center">
          <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          "flex flex-col max-w-[85%] sm:max-w-[80%] md:max-w-[70%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg backdrop-blur",
            isUser
              ? "bg-gradient-to-r from-[#6c47ff] to-[#a78bfa] text-white"
              : "bg-black/50 border border-[#6c47ff]/20 text-white"
          )}
        >
          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-kode-mono">
            {message.content}
          </p>
        </div>
        
        {/* Timestamp */}
        <span className="text-xs text-[#6c47ff] mt-1 px-1 font-kode-mono">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Avatar for user messages */}
      {isUser && (
        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black border border-[#6c47ff]/30 flex items-center justify-center">
          <User className="w-3 h-3 sm:w-4 sm:h-4 text-[#6c47ff]" />
        </div>
      )}
    </motion.div>
  );
} 