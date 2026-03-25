"use client";

import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Shield,
  User,
  ChevronRight,
} from "lucide-react";

/** Task data matching API response */
interface Task {
  id: string;
  description: string;
  status: string;
  priority: number;
  assignedToId: string | null;
  result: string | null;
  tokenUsage: number;
  createdAt: string;
  completedAt: string | null;
  assignedTo?: { id: string; name: string; role: string } | null;
}

/** Priority badge styling */
const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: "High", color: "text-red-400", bg: "bg-red-500/10" },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/10" },
  low: { label: "Low", color: "text-green-400", bg: "bg-green-500/10" },
};

/** Status icon mapping */
const STATUS_ICONS: Record<string, typeof Clock> = {
  PENDING: Clock,
  IN_PROGRESS: Loader2,
  WAITING_APPROVAL: Shield,
  APPROVED: CheckCircle2,
  COMPLETED: CheckCircle2,
  FAILED: AlertTriangle,
  REJECTED: AlertTriangle,
};

/**
 * Get priority level from numeric value.
 */
function getPriorityLevel(p: number): string {
  if (p <= 3) return "high";
  if (p <= 6) return "medium";
  return "low";
}

/**
 * Format time ago from ISO string.
 */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
}

/**
 * Individual task card for the kanban board.
 *
 * Shows description, priority badge, assigned agent, and time.
 */
export function TaskCard({ task, onClick }: TaskCardProps) {
  const level = getPriorityLevel(task.priority);
  const priorityCfg = PRIORITY_CONFIG[level] ?? PRIORITY_CONFIG.low!;
  const StatusIcon = STATUS_ICONS[task.status] ?? Clock;

  return (
    <button
      onClick={() => onClick?.(task)}
      className="w-full text-left p-4 rounded-xl bg-[#111827] border border-[#1E2535] hover:border-indigo-500/30 transition-all hover:shadow-lg hover:shadow-indigo-500/5 group"
    >
      {/* Header: Priority + Status icon */}
      <div className="flex items-center justify-between mb-2.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${priorityCfg.color} ${priorityCfg.bg}`}>
          {priorityCfg.label}
        </span>
        <StatusIcon className={`w-4 h-4 ${
          task.status === "COMPLETED" ? "text-green-400" :
          task.status === "FAILED" ? "text-red-400" :
          task.status === "IN_PROGRESS" ? "text-blue-400 animate-spin" :
          "text-gray-500"
        }`} />
      </div>

      {/* Description */}
      <p className="text-sm text-gray-200 line-clamp-2 mb-3 group-hover:text-white transition-colors">
        {task.description}
      </p>

      {/* Footer: Agent + Time */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          {task.assignedTo ? (
            <>
              <User className="w-3 h-3" />
              <span>{task.assignedTo.name}</span>
            </>
          ) : (
            <span className="italic">Unassigned</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span>{timeAgo(task.createdAt)}</span>
          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </button>
  );
}
