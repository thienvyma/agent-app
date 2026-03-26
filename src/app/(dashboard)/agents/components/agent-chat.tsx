"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AgentChatProps {
  /** Agent ID for API calls */
  agentId: string;
  /** Agent display name */
  agentName: string;
}

/**
 * Chat interface for communicating with an agent via OpenClaw pipeline.
 *
 * @param props - AgentChatProps
 */
export function AgentChat({ agentId, agentName }: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  /** Auto-scroll to bottom on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Sends a message to the agent via API.
   */
  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      // Extract error message safely (data.error can be object {code, message} or string)
      const errorText = data.error
        ? typeof data.error === "string"
          ? data.error
          : data.error.message ?? JSON.stringify(data.error)
        : null;

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.data?.response ?? data.data?.message ?? errorText ?? "No response received.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Failed to reach the agent. Please check if OpenClaw is running.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles Enter key to send message.
   */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[500px] bg-[#1A1F2B] border border-[#2A303C] rounded-xl overflow-hidden">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-[#2A303C] flex items-center gap-3">
        <Bot className="w-5 h-5 text-blue-400" />
        <span className="text-sm font-medium text-white">Chat with {agentName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bot className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Send a message to start chatting with {agentName}</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-[#0E1117] text-gray-300 border border-[#2A303C] rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1.5 ${msg.role === "user" ? "text-blue-200" : "text-gray-500"}`}>
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="px-4 py-3 bg-[#0E1117] border border-[#2A303C] rounded-2xl rounded-bl-md">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#2A303C]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-[#0E1117] border border-[#2A303C] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
