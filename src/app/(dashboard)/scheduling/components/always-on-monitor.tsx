"use client";

import { Wifi, WifiOff, AlertTriangle } from "lucide-react";

/** Agent with always-on status */
interface AgentStatus {
  id: string;
  name: string;
  status: string;
  isAlwaysOn: boolean;
}

type HealthStatus = "healthy" | "stale" | "crashed" | "unknown";

interface AlwaysOnMonitorProps {
  agents: AgentStatus[];
}

/**
 * Get health indicator based on agent status.
 */
function getHealth(status: string): { health: HealthStatus; color: string } {
  if (status === "RUNNING") return { health: "healthy", color: "emerald" };
  if (status === "IDLE") return { health: "stale", color: "amber" };
  if (status === "ERROR") return { health: "crashed", color: "red" };
  return { health: "unknown", color: "gray" };
}

/**
 * Always-on agent monitoring panel.
 * Shows health status for always-on agents with color-coded indicators.
 */
export function AlwaysOnMonitor({ agents }: AlwaysOnMonitorProps) {
  if (agents.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
        <h3 className="text-sm font-semibold text-white mb-4">Always-On Agents</h3>
        <p className="text-sm text-gray-500 italic text-center py-8">
          No always-on agents configured
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
      <h3 className="text-sm font-semibold text-white mb-4">Always-On Agents</h3>
      <div className="grid grid-cols-2 gap-3">
        {agents.map((agent) => {
          const { health, color } = getHealth(agent.status);
          return (
            <div
              key={agent.id}
              className={`p-4 rounded-lg border transition-all ${
                health === "healthy"
                  ? "bg-emerald-500/5 border-emerald-500/10"
                  : health === "crashed"
                  ? "bg-red-500/5 border-red-500/10"
                  : health === "stale"
                  ? "bg-amber-500/5 border-amber-500/10"
                  : "bg-gray-500/5 border-gray-500/10"
              }`}
            >
              <div className="flex items-center gap-3">
                {health === "healthy" ? (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                ) : health === "crashed" ? (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                ) : (
                  <WifiOff className={`w-4 h-4 ${
                    health === "stale" ? "text-amber-400" : "text-gray-400"
                  }`} />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{agent.name}</p>
                  <p className={`text-xs ${
                    health === "healthy" ? "text-emerald-400"
                    : health === "crashed" ? "text-red-400"
                    : health === "stale" ? "text-amber-400"
                    : "text-gray-400"
                  }`}>
                    {health}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
