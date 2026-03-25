"use client";

import { Search, Filter, X } from "lucide-react";

interface KnowledgeSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  agentFilter: string;
  onAgentFilterChange: (id: string) => void;
  agents: { id: string; name: string }[];
}

/**
 * Search bar with agent filter for knowledge base.
 */
export function KnowledgeSearch({
  query,
  onQueryChange,
  agentFilter,
  onAgentFilterChange,
  agents,
}: KnowledgeSearchProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search conversations, corrections, rules..."
          className="w-full pl-10 pr-10 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-600"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Agent filter */}
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
        <select
          value={agentFilter}
          onChange={(e) => onAgentFilterChange(e.target.value)}
          className="pl-8 pr-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none min-w-[140px]"
        >
          <option value="">All Agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
