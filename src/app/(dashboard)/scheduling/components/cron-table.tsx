"use client";

import { Clock, Play, Pause, Zap, AlertCircle } from "lucide-react";

/** Scheduled job */
interface JobItem {
  id: string;
  name: string;
  cronExpression: string;
  agentId: string;
  taskTemplate: string;
  enabled: boolean;
  lastRun: string | null;
  createdAt: string;
}

interface CronTableProps {
  jobs: JobItem[];
  onToggle: (id: string, enabled: boolean) => void;
}

/**
 * Format time ago.
 */
function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Describe cron schedule in human-readable form.
 */
function describeCron(expr: string): string {
  if (expr === "*/5 * * * *") return "Every 5 minutes";
  if (expr === "0 * * * *") return "Every hour";
  if (expr === "0 0 * * *") return "Daily at midnight";
  if (expr === "0 9 * * *") return "Daily at 9 AM";
  if (expr === "0 9 * * 1-5") return "Weekdays at 9 AM";
  return expr;
}

/**
 * Cron job table with enable/disable toggle.
 */
export function CronTable({ jobs, onToggle }: CronTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Clock className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No scheduled jobs</p>
        <p className="text-xs mt-1">Create a cron job to automate agent tasks</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1E2535]">
            <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Job Name</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b border-[#1E2535]/50 hover:bg-[#0B0F19]/50 transition-colors">
              <td className="py-3 px-3">
                <div className={`w-2.5 h-2.5 rounded-full ${job.enabled ? "bg-emerald-400" : "bg-gray-600"}`} />
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-gray-200 font-medium">{job.name}</span>
                </div>
              </td>
              <td className="py-3 px-3">
                <div>
                  <span className="text-gray-300 text-xs">{describeCron(job.cronExpression)}</span>
                  <span className="text-[10px] text-gray-600 block font-mono">{job.cronExpression}</span>
                </div>
              </td>
              <td className="py-3 px-3">
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                  {job.agentId.slice(0, 8)}
                </span>
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-600" />
                  <span className="text-xs text-gray-500">{timeAgo(job.lastRun)}</span>
                </div>
              </td>
              <td className="py-3 px-3 text-right">
                <button
                  onClick={() => onToggle(job.id, !job.enabled)}
                  className={`px-3 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 ml-auto ${
                    job.enabled
                      ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                      : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                  }`}
                >
                  {job.enabled ? (
                    <><Pause className="w-3 h-3" /> Pause</>
                  ) : (
                    <><Play className="w-3 h-3" /> Resume</>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
