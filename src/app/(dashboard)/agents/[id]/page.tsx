"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AgentChat } from "../components/agent-chat";
import {
  ArrowLeft,
  Play,
  Square,
  Clock,
  Cpu,
  Shield,
  Zap,
  Activity,
  Loader2,
} from "lucide-react";

/** Agent detail type matching API response */
interface AgentDetail {
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
  department: { id: string; name: string };
  tasks: { id: string; description: string; status: string; createdAt: string }[];
}

/** Status badge map */
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  IDLE: { color: "text-gray-400", bg: "bg-gray-500/10" },
  RUNNING: { color: "text-green-400", bg: "bg-green-500/10" },
  ERROR: { color: "text-red-400", bg: "bg-red-500/10" },
  DEPLOYING: { color: "text-blue-400", bg: "bg-blue-500/10" },
  PAUSED_BUDGET: { color: "text-amber-400", bg: "bg-amber-500/10" },
};

/**
 * Agent detail page — shows agent profile, tasks, and chat.
 *
 * Route: /agents/[id]
 */
export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "tasks" | "profile">("profile");

  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        if (res.ok) {
          const json = await res.json();
          setAgent(json.data || json);
        }
      } catch (err) {
        console.error("[AgentDetail] Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAgent();
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg">Agent not found</p>
        <Link href="/agents" className="text-blue-400 hover:underline mt-2 inline-block">← Back to agents</Link>
      </div>
    );
  }

  const statusStyle = STATUS_COLORS[agent.status] ?? { color: "text-gray-400", bg: "bg-gray-500/10" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/agents" className="p-2 rounded-xl hover:bg-[#2A303C]/50 text-gray-400 hover:text-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
              {agent.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
              <p className="text-sm text-gray-400">{agent.role} · {agent.department?.name ?? "Unassigned"}</p>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusStyle.color} ${statusStyle.bg}`}>
          {agent.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1A1F2B] rounded-xl p-1 border border-[#2A303C] w-fit">
        {(["profile", "tasks", "chat"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              activeTab === tab ? "bg-blue-500/10 text-blue-400" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Info */}
          <div className="p-6 bg-[#1A1F2B] border border-[#2A303C] rounded-xl space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" /> Agent Profile
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Model</label>
                <p className="text-sm text-gray-300 font-mono mt-0.5">{agent.model}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">SOP</label>
                <p className="text-sm text-gray-300 mt-0.5 whitespace-pre-wrap">{agent.sop || "Not defined"}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Always On</label>
                  <p className="text-sm text-gray-300 mt-0.5">{agent.isAlwaysOn ? "Yes" : "No"}</p>
                </div>
                {agent.cronSchedule && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Cron</label>
                    <p className="text-sm text-gray-300 font-mono mt-0.5">{agent.cronSchedule}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tools & Skills */}
          <div className="space-y-6">
            <div className="p-6 bg-[#1A1F2B] border border-[#2A303C] rounded-xl">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-green-400" /> Tools
              </h2>
              <div className="flex flex-wrap gap-2">
                {agent.tools.length > 0 ? agent.tools.map((tool) => (
                  <span key={tool} className="px-3 py-1.5 bg-green-500/10 text-green-400 text-xs rounded-lg font-medium">{tool}</span>
                )) : <span className="text-sm text-gray-500">No tools assigned</span>}
              </div>
            </div>
            <div className="p-6 bg-[#1A1F2B] border border-[#2A303C] rounded-xl">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-amber-400" /> Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {agent.skills.length > 0 ? agent.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs rounded-lg font-medium">{skill}</span>
                )) : <span className="text-sm text-gray-500">No skills assigned</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="p-6 bg-[#1A1F2B] border border-[#2A303C] rounded-xl">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-400" /> Recent Tasks
          </h2>
          {agent.tasks && agent.tasks.length > 0 ? (
            <div className="space-y-3">
              {agent.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-[#0E1117] rounded-xl border border-[#2A303C]">
                  <div>
                    <p className="text-sm text-gray-300">{task.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(task.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                    task.status === "COMPLETED" ? "text-green-400 bg-green-500/10" :
                    task.status === "FAILED" ? "text-red-400 bg-red-500/10" :
                    "text-blue-400 bg-blue-500/10"
                  }`}>{task.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No tasks yet</p>
          )}
        </div>
      )}

      {activeTab === "chat" && (
        <AgentChat agentId={agent.id} agentName={agent.name} />
      )}
    </div>
  );
}