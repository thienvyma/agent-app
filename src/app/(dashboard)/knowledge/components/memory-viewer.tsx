"use client";

import { useState } from "react";
import { MessageCircle, Bot, User, ChevronDown, ChevronRight, Hash, Clock } from "lucide-react";

/** Conversation from API */
interface ConversationItem {
  id: string;
  agentId: string;
  summary: string | null;
  createdAt: string;
  agent?: { id: string; name: string } | null;
  messages?: ChatMsg[];
  _count?: { messages: number };
}

interface ChatMsg {
  id: string;
  role: string;
  content: string;
  tokens: number | null;
  createdAt: string;
}

interface MemoryViewerProps {
  conversations: ConversationItem[];
  loading: boolean;
}

/**
 * Format time ago.
 */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Agent memory viewer — conversations with chat messages.
 */
export function MemoryViewer({ conversations, loading }: MemoryViewerProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No conversations found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const isOpen = expanded.has(conv.id);
        return (
          <div key={conv.id} className="rounded-xl bg-[#0B0F19] border border-[#1E2535] overflow-hidden">
            {/* Header */}
            <button
              onClick={() => toggleExpand(conv.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">
                  {conv.agent?.name ?? "Unknown Agent"}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-md">
                  {conv.summary ?? "No summary"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {conv._count?.messages ?? conv.messages?.length ?? 0} msgs
                </span>
                <span className="text-[10px] text-gray-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(conv.createdAt)}
                </span>
              </div>
            </button>

            {/* Messages */}
            {isOpen && conv.messages && (
              <div className="border-t border-[#1E2535] p-4 space-y-3 max-h-[300px] overflow-y-auto">
                {conv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "assistant"
                        ? "bg-indigo-500/10"
                        : "bg-emerald-500/10"
                    }`}>
                      {msg.role === "assistant" ? (
                        <Bot className="w-3 h-3 text-indigo-400" />
                      ) : (
                        <User className="w-3 h-3 text-emerald-400" />
                      )}
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-xl text-xs ${
                      msg.role === "assistant"
                        ? "bg-indigo-500/5 text-gray-300 border border-indigo-500/10"
                        : "bg-emerald-500/5 text-gray-300 border border-emerald-500/10"
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      {msg.tokens && (
                        <span className="text-[9px] text-gray-600 mt-1 block">{msg.tokens} tokens</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
