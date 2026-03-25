"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Users,
  Play,
  Pause,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  Plus,
} from "lucide-react";

/** Agent type matching Prisma model + department relation */
interface Agent {
  id: string;
  name: string;
  role: string;
  sop: string;
  model: string;
  tools: string[];
  skills: string[];
  status: "IDLE" | "RUNNING" | "ERROR" | "DEPLOYING" | "PAUSED_BUDGET";
  isAlwaysOn: boolean;
  cronSchedule: string | null;
  departmentId: string;
  department: { id: string; name: string };
}

/** Status badge styling config */
const STATUS_CONFIG: Record<Agent["status"], { label: string; color: string; bg: string; icon: typeof Play }> = {
  IDLE: { label: "Idle", color: "text-gray-400", bg: "bg-gray-500/10", icon: Pause },
  RUNNING: { label: "Running", color: "text-green-400", bg: "bg-green-500/10", icon: Play },
  ERROR: { label: "Error", color: "text-red-400", bg: "bg-red-500/10", icon: AlertTriangle },
  DEPLOYING: { label: "Deploying", color: "text-blue-400", bg: "bg-blue-500/10", icon: Loader2 },
  PAUSED_BUDGET: { label: "Paused", color: "text-amber-400", bg: "bg-amber-500/10", icon: Pause },
};

interface AgentListProps {
  agents: Agent[];
  onAddAgent: () => void;
}

/**
 * Agent list grid component with status badges, filter controls, and action links.
 *
 * @param props - AgentListProps containing agents array and add callback
 */
export function AgentList({ agents, onAddAgent }: AgentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  /** Filter agents by search query and status */
  const filteredAgents = agents.filter((agent) => {
    if (statusFilter && agent.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!agent.name.toLowerCase().includes(q) && !agent.role.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const statusCounts = agents.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Team</h1>
          <p className="text-gray-400 text-sm mt-1">
            {agents.length} agents · {statusCounts["RUNNING"] ?? 0} running
          </p>
        </div>
        <button
          onClick={onAddAgent}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name or role..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1A1F2B] border border-[#2A303C] rounded-xl text-gray-300 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-[#1A1F2B] border border-[#2A303C] rounded-xl text-gray-300 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="RUNNING">Running</option>
            <option value="IDLE">Idle</option>
            <option value="ERROR">Error</option>
            <option value="DEPLOYING">Deploying</option>
            <option value="PAUSED_BUDGET">Paused</option>
          </select>
        </div>
      </div>

      {/* Agent Grid */}
      {filteredAgents.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#1A1F2B] border border-[#2A303C] text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No agents match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => {
            const cfg = STATUS_CONFIG[agent.status];
            return (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="group p-5 rounded-xl bg-[#1A1F2B] border border-[#2A303C] hover:border-blue-500/30 transition-all hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{agent.name}</h3>
                      <p className="text-xs text-gray-500">{agent.role}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                    <cfg.icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                <p className="text-sm text-gray-400 line-clamp-2 mb-3">{agent.sop || "No SOP defined"}</p>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-[#2A303C]">
                  <span>{agent.department.name}</span>
                  <span className="font-mono">{agent.model}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
