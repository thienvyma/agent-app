"use client";

import { useState, useEffect, useCallback } from "react";
import { KnowledgeSearch } from "./components/knowledge-search";
import { MemoryViewer } from "./components/memory-viewer";
import { CorrectionList } from "./components/correction-list";
import {
  BookOpen,
  Lightbulb,
  MessageCircle,
  Brain,
  Loader2,
} from "lucide-react";

/** Tabs */
type Tab = "knowledge" | "corrections";

/** Conversation */
interface ConversationItem {
  id: string;
  agentId: string;
  summary: string | null;
  createdAt: string;
  agent?: { id: string; name: string } | null;
  messages?: { id: string; role: string; content: string; tokens: number | null; createdAt: string }[];
  _count?: { messages: number };
}

/** Correction */
interface CorrectionEntry {
  id: string;
  taskId: string;
  agentId: string;
  context: string;
  wrongOutput: string;
  correction: string;
  ruleExtracted: string;
  vectorId: string | null;
  createdAt: string;
  task?: { id: string; description: string } | null;
}

/** Agent */
interface AgentItem {
  id: string;
  name: string;
}

/**
 * Knowledge & Feedback page — two-tab layout.
 */
export default function KnowledgePage() {
  const [tab, setTab] = useState<Tab>("knowledge");
  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [agents, setAgents] = useState<AgentItem[]>([]);

  // Knowledge state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [convLoading, setConvLoading] = useState(true);

  // Corrections state
  const [corrections, setCorrections] = useState<CorrectionEntry[]>([]);
  const [corrTotal, setCorrTotal] = useState(0);
  const [corrPage, setCorrPage] = useState(1);
  const [corrLoading, setCorrLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ conversations: 0, corrections: 0, rules: 0 });

  /** Fetch agents */
  useEffect(() => {
    fetch("/api/agents?limit=50")
      .then((r) => r.json())
      .then((json) => {
        const data = json.data ?? [];
        setAgents(Array.isArray(data) ? data.map((a: AgentItem) => ({ id: a.id, name: a.name })) : []);
      })
      .catch(() => {});
  }, []);

  /** Fetch conversations */
  const fetchConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (agentFilter) params.set("agent", agentFilter);
      const res = await fetch(`/api/conversations?${params}`);
      const json = await res.json();
      const data = json.data ?? [];
      setConversations(data);
      setStats((s) => ({ ...s, conversations: json.pagination?.total ?? data.length }));
    } catch {
      setConversations([]);
    } finally {
      setConvLoading(false);
    }
  }, [agentFilter]);

  /** Fetch corrections */
  const fetchCorrections = useCallback(async (pg: number) => {
    setCorrLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "20" });
      if (agentFilter) params.set("agent", agentFilter);
      const res = await fetch(`/api/corrections?${params}`);
      const json = await res.json();
      setCorrections(json.data ?? []);
      setCorrTotal(json.pagination?.total ?? 0);
      setCorrPage(pg);
    } catch {
      setCorrections([]);
    } finally {
      setCorrLoading(false);
    }
  }, [agentFilter]);

  /** Fetch stats */
  useEffect(() => {
    fetch("/api/corrections?stats=true")
      .then((r) => r.json())
      .then((json) => {
        const d = json.data ?? {};
        setStats((s) => ({
          ...s,
          corrections: d.total ?? 0,
          rules: d.total ?? 0,
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "knowledge") fetchConversations();
    else fetchCorrections(1);
  }, [tab, fetchConversations, fetchCorrections]);

  // Filter by query (client-side)
  const filteredConversations = query
    ? conversations.filter(
        (c) =>
          c.summary?.toLowerCase().includes(query.toLowerCase()) ||
          c.agent?.name?.toLowerCase().includes(query.toLowerCase())
      )
    : conversations;

  const filteredCorrections = query
    ? corrections.filter(
        (c) =>
          c.ruleExtracted.toLowerCase().includes(query.toLowerCase()) ||
          c.correction.toLowerCase().includes(query.toLowerCase()) ||
          c.wrongOutput.toLowerCase().includes(query.toLowerCase())
      )
    : corrections;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            Knowledge & Feedback
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Agent memory, learned rules, and correction history
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535]">
          <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-3">
            <MessageCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xs text-gray-500">Conversations</p>
          <p className="text-lg font-bold text-indigo-400">{stats.conversations}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535]">
          <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center mb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xs text-gray-500">Corrections</p>
          <p className="text-lg font-bold text-amber-400">{stats.corrections}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535]">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3">
            <Brain className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs text-gray-500">Rules Learned</p>
          <p className="text-lg font-bold text-emerald-400">{stats.rules}</p>
        </div>
      </div>

      {/* Search */}
      <KnowledgeSearch
        query={query}
        onQueryChange={setQuery}
        agentFilter={agentFilter}
        onAgentFilterChange={setAgentFilter}
        agents={agents}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0B0F19] rounded-xl p-1 border border-[#1E2535] w-fit">
        <button
          onClick={() => setTab("knowledge")}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            tab === "knowledge"
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-gray-500 hover:text-white"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Knowledge Base
        </button>
        <button
          onClick={() => setTab("corrections")}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            tab === "corrections"
              ? "bg-amber-500/20 text-amber-400"
              : "text-gray-500 hover:text-white"
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          Corrections & Feedback
        </button>
      </div>

      {/* Content */}
      <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535] min-h-[300px]">
        {tab === "knowledge" ? (
          <MemoryViewer conversations={filteredConversations} loading={convLoading} />
        ) : (
          <CorrectionList
            corrections={filteredCorrections}
            loading={corrLoading}
            total={corrTotal}
            page={corrPage}
            onPageChange={fetchCorrections}
          />
        )}
      </div>
    </div>
  );
}