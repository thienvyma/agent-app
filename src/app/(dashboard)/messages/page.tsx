"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageThread } from "./components/message-thread";
import {
  MessageSquare,
  Loader2,
  Send,
  Filter,
  Users,
  X,
} from "lucide-react";

/** Message from API */
interface MessageItem {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  type: string;
  metadata: unknown;
  createdAt: string;
  fromAgent?: { id: string; name: string; role: string } | null;
  toAgent?: { id: string; name: string; role: string } | null;
}

/** Thread = unique agent pair */
interface ThreadInfo {
  key: string;
  agents: string[];
  agentNames: string[];
  lastMessage: string;
  lastTime: string;
  count: number;
  types: string[];
}

const MESSAGE_TYPES = ["DELEGATE", "REPORT", "CHAIN", "GROUP", "ALERT", "ESCALATION"] as const;

/**
 * Messages page with thread grouping, filters, and compose.
 */
export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [composeType, setComposeType] = useState("DELEGATE");
  const [sending, setSending] = useState(false);

  /** Fetch messages */
  const fetchMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/messages?${params}`);
      const json = await res.json();
      setMessages(json.data ?? []);
    } catch (err) {
      console.error("[MessagesPage] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /** Group messages into threads */
  const threads: ThreadInfo[] = (() => {
    const map = new Map<string, MessageItem[]>();
    for (const msg of messages) {
      const key = [msg.fromAgentId, msg.toAgentId].sort().join("-");
      const arr = map.get(key) ?? [];
      arr.push(msg);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([key, msgs]) => {
      const first = msgs[0]!;
      const last = msgs[msgs.length - 1]!;
      const agentNames = [
        first.fromAgent?.name ?? "Unknown",
        first.toAgent?.name ?? "Unknown",
      ];
      const uniqueNames = [...new Set(agentNames)];
      return {
        key,
        agents: [first.fromAgentId, first.toAgentId],
        agentNames: uniqueNames,
        lastMessage: last.content.slice(0, 80),
        lastTime: last.createdAt,
        count: msgs.length,
        types: [...new Set(msgs.map((m) => m.type))],
      };
    }).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
  })();

  /** Send message */
  async function handleSend() {
    if (!composeTo.trim() || !composeContent.trim()) return;
    setSending(true);
    try {
      // Use first agent as sender (simplified)
      const agents = messages.length > 0 ? messages[0]!.fromAgentId : "";
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAgentId: agents,
          toAgentId: composeTo,
          content: composeContent,
          type: composeType,
        }),
      });
      setShowCompose(false);
      setComposeContent("");
      await fetchMessages();
    } catch {
      console.error("Send failed");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-blue-400" />
            Messages
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Inter-agent communication threads
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            {MESSAGE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-white text-sm font-medium transition-all"
          >
            <Send className="w-4 h-4" />
            Compose
          </button>
        </div>
      </div>

      {/* Compose */}
      {showCompose && (
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1E2535] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">New Message</h3>
            <button onClick={() => setShowCompose(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="To Agent ID"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              className="px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={composeType}
              onChange={(e) => setComposeType(e.target.value)}
              className="px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {MESSAGE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Message content..."
            value={composeContent}
            onChange={(e) => setComposeContent(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-white text-sm font-medium disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </div>
      )}

      {/* Main Layout: Thread List + Thread Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thread List */}
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535] space-y-2 max-h-[600px] overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="w-3 h-3" />
            Threads ({threads.length})
          </h3>
          {threads.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">No threads yet</p>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.key}
                onClick={() => setSelectedThread(selectedThread === thread.key ? null : thread.key)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedThread === thread.key
                    ? "bg-blue-500/10 border border-blue-500/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{thread.agentNames.join(" ↔ ")}</span>
                  <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{thread.count}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate">{thread.lastMessage}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {thread.types.map((t) => (
                    <span key={t} className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Thread Detail */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#111827] border border-[#1E2535]">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-white">
              {selectedThread ? "Thread" : "All Messages"}
            </h3>
            {selectedThread && (
              <button
                onClick={() => setSelectedThread(null)}
                className="ml-auto text-xs text-gray-500 hover:text-white"
              >
                Show All
              </button>
            )}
          </div>
          <MessageThread messages={messages} selectedThread={selectedThread} />
        </div>
      </div>
    </div>
  );
}