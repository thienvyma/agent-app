"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Shield,
  PlayCircle,
  User,
  GitBranch,
  FileText,
  AlertCircle,
} from "lucide-react";

/** Full task detail from API */
interface TaskDetail {
  id: string;
  description: string;
  status: string;
  priority: number;
  result: string | null;
  errorLog: string | null;
  tokenUsage: number;
  retryCount: number;
  createdAt: string;
  completedAt: string | null;
  assignedTo: { id: string; name: string; role: string; status: string } | null;
  parentTask: { id: string; description: string; status: string } | null;
  subTasks: { id: string; description: string; status: string; priority: number }[];
  approvalRequest: {
    id: string;
    status: string;
    policy: string;
    reason: string;
    ownerResponse: string | null;
    createdAt: string;
    resolvedAt: string | null;
  } | null;
}

/** Status badge config */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  PENDING: { label: "Pending", color: "text-gray-400", bg: "bg-gray-500/10", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-400", bg: "bg-blue-500/10", icon: PlayCircle },
  WAITING_APPROVAL: { label: "Waiting Approval", color: "text-amber-400", bg: "bg-amber-500/10", icon: Shield },
  APPROVED: { label: "Approved", color: "text-green-400", bg: "bg-green-500/10", icon: CheckCircle2 },
  COMPLETED: { label: "Completed", color: "text-green-400", bg: "bg-green-500/10", icon: CheckCircle2 },
  FAILED: { label: "Failed", color: "text-red-400", bg: "bg-red-500/10", icon: AlertTriangle },
  REJECTED: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/10", icon: AlertTriangle },
};

/**
 * Task detail page — shows full task info, sub-tasks, approval status.
 */
export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tasks/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Task not found");
        return r.json();
      })
      .then((json) => setTask(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-8 rounded-xl bg-[#111827] border border-[#1E2535] text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400">{error || "Task not found"}</p>
        <button onClick={() => router.push("/tasks")} className="mt-4 text-sm text-indigo-400 hover:underline">
          ← Back to Task Board
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.PENDING!;
  const StatusIcon = statusCfg.icon;
  const priorityColor = task.priority <= 3 ? "text-red-400" : task.priority <= 6 ? "text-amber-400" : "text-green-400";
  const priorityLabel = task.priority <= 3 ? "High" : task.priority <= 6 ? "Medium" : "Low";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={() => router.push("/tasks")} className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Task Board
      </button>

      {/* Task Header */}
      <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white mb-2">{task.description}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusCfg.color} ${statusCfg.bg}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusCfg.label}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${priorityColor} bg-white/5`}>
                Priority: {priorityLabel} ({task.priority})
              </span>
              <span className="text-gray-500 text-xs">
                Created {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#1E2535]">
          <div>
            <p className="text-xs text-gray-500 mb-1">Assigned To</p>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm text-gray-300">{task.assignedTo?.name ?? "Unassigned"}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Token Usage</p>
            <span className="text-sm text-gray-300 font-mono">{task.tokenUsage.toLocaleString()}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Retries</p>
            <span className="text-sm text-gray-300">{task.retryCount}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <span className="text-sm text-gray-300">
              {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sub-tasks */}
        <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <GitBranch className="w-4 h-4 text-indigo-400" />
            Sub-Tasks
            <span className="text-xs text-gray-500 ml-auto">{task.subTasks.length}</span>
          </h2>
          {task.subTasks.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No sub-tasks</p>
          ) : (
            <div className="space-y-2">
              {task.subTasks.map((sub) => {
                const subCfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.PENDING!;
                return (
                  <div key={sub.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0B0F19] border border-[#1E2535]">
                    <subCfg.icon className={`w-4 h-4 ${subCfg.color} shrink-0`} />
                    <p className="text-sm text-gray-300 flex-1 line-clamp-1">{sub.description}</p>
                    <span className={`text-xs ${subCfg.color}`}>{subCfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Approval + Result */}
        <div className="space-y-6">
          {/* Approval */}
          {task.approvalRequest && (
            <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-amber-400" />
                Approval Request
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={STATUS_CONFIG[task.approvalRequest.status]?.color ?? "text-gray-400"}>
                    {task.approvalRequest.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Policy</span>
                  <span className="text-gray-300">{task.approvalRequest.policy}</span>
                </div>
                <div>
                  <span className="text-gray-500">Reason</span>
                  <p className="text-gray-300 mt-1">{task.approvalRequest.reason}</p>
                </div>
                {task.approvalRequest.ownerResponse && (
                  <div>
                    <span className="text-gray-500">Response</span>
                    <p className="text-gray-300 mt-1">{task.approvalRequest.ownerResponse}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Result / Error */}
          {(task.result || task.errorLog) && (
            <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-indigo-400" />
                {task.result ? "Result" : "Error Log"}
              </h2>
              <pre className="text-sm text-gray-300 bg-[#0B0F19] p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-[#1E2535]">
                {task.result || task.errorLog}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Parent task link */}
      {task.parentTask && (
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535] flex items-center gap-3">
          <GitBranch className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">Parent task:</span>
          <button
            onClick={() => router.push(`/tasks/${task.parentTask!.id}`)}
            className="text-sm text-indigo-400 hover:underline"
          >
            {task.parentTask.description}
          </button>
        </div>
      )}
    </div>
  );
}