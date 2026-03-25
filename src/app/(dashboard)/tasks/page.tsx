"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TaskCard } from "./components/task-card";
import { TaskForm } from "./components/task-form";
import {
  Plus,
  Loader2,
  ListChecks,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Search,
  Filter,
} from "lucide-react";

/** Task type matching API response */
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

/** Kanban column definition */
const KANBAN_COLUMNS = [
  { id: "PENDING", label: "Pending", icon: Clock, color: "text-gray-400", borderColor: "border-gray-500/30" },
  { id: "IN_PROGRESS", label: "In Progress", icon: PlayCircle, color: "text-blue-400", borderColor: "border-blue-500/30" },
  { id: "WAITING_APPROVAL", label: "Waiting Approval", icon: Shield, color: "text-amber-400", borderColor: "border-amber-500/30" },
  { id: "COMPLETED", label: "Completed", icon: CheckCircle2, color: "text-green-400", borderColor: "border-green-500/30" },
  { id: "FAILED", label: "Failed", icon: AlertTriangle, color: "text-red-400", borderColor: "border-red-500/30" },
] as const;

/**
 * Tasks Kanban Board page.
 *
 * Fetches tasks from /api/tasks, groups into columns, supports
 * creating tasks and navigating to detail pages.
 */
export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /** Fetch all tasks */
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?limit=100");
      const json = await res.json();
      setTasks(json.data || []);
    } catch (err) {
      console.error("[TasksPage] Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /** Create a new task */
  async function handleCreateTask(data: { description: string; assignedToId?: string; priority: number }) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create task");
    setShowForm(false);
    await fetchTasks();
  }

  /** Navigate to task detail */
  function handleTaskClick(task: Task) {
    router.push(`/tasks/${task.id}`);
  }

  /** Filter tasks */
  const filtered = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  /** Group tasks by status for kanban columns */
  const grouped: Record<string, Task[]> = {};
  for (const col of KANBAN_COLUMNS) {
    grouped[col.id] = [];
  }
  for (const task of filtered) {
    if (grouped[task.status]) {
      grouped[task.status]!.push(task);
    } else {
      grouped.PENDING!.push(task);
    }
  }

  /** Count stats */
  const totalActive = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const totalPending = tasks.filter((t) => t.status === "PENDING").length;
  const totalCompleted = tasks.filter((t) => t.status === "COMPLETED").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <ListChecks className="w-7 h-7 text-indigo-400" />
              Task Board
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {tasks.length} tasks · {totalActive} active · {totalPending} pending · {totalCompleted} done
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            New Task
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
              placeholder="Search tasks by description..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-[#1E2535] rounded-xl text-gray-300 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-[#111827] border border-[#1E2535] rounded-xl text-gray-300 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              <option value="">All Status</option>
              {KANBAN_COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {KANBAN_COLUMNS.map((col) => {
            const ColIcon = col.icon;
            const colTasks = grouped[col.id] ?? [];
            return (
              <div key={col.id} className={`rounded-xl border ${col.borderColor} bg-[#0B0F19]/50 p-3 min-h-[300px]`}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <ColIcon className={`w-4 h-4 ${col.color}`} />
                  <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                  <span className="ml-auto text-xs text-gray-500 bg-[#111827] px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="space-y-2.5">
                  {colTasks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-600 border border-dashed border-[#1E2535] rounded-lg">
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Task Modal */}
      {showForm && (
        <TaskForm onSubmit={handleCreateTask} onClose={() => setShowForm(false)} />
      )}
    </>
  );
}