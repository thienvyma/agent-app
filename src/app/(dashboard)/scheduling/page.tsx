"use client";

import { useState, useEffect, useCallback } from "react";
import { CronTable } from "./components/cron-table";
import { AlwaysOnMonitor } from "./components/always-on-monitor";
import {
  Calendar,
  Loader2,
  Plus,
  X,
  Activity,
  Wifi,
} from "lucide-react";

/** Job from API */
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

/** Agent for always-on status */
interface AgentStatus {
  id: string;
  name: string;
  status: string;
  isAlwaysOn: boolean;
}

/**
 * Scheduling page — Cron jobs + always-on monitoring.
 */
export default function SchedulingPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", cronExpression: "", agentId: "", taskTemplate: "" });
  const [creating, setCreating] = useState(false);

  /** Fetch jobs */
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/scheduling");
      const json = await res.json();
      setJobs(json.data ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Fetch agents for always-on monitor */
  useEffect(() => {
    fetch("/api/agents?limit=50")
      .then((r) => r.json())
      .then((json) => {
        const data = json.data ?? [];
        setAgents(
          Array.isArray(data)
            ? data.filter((a: AgentStatus) => a.isAlwaysOn).map((a: AgentStatus) => ({
                id: a.id, name: a.name, status: a.status, isAlwaysOn: a.isAlwaysOn,
              }))
            : []
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /** Toggle job */
  async function handleToggle(id: string, enabled: boolean) {
    await fetch("/api/scheduling", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    await fetchJobs();
  }

  /** Create job */
  async function handleCreate() {
    if (!form.name.trim() || !form.cronExpression.trim() || !form.agentId || !form.taskTemplate.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ name: "", cronExpression: "", agentId: "", taskTemplate: "" });
      await fetchJobs();
    } finally {
      setCreating(false);
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
            <Calendar className="w-7 h-7 text-purple-400" />
            Scheduling
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Cron jobs and always-on agent monitoring
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-xl text-white text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          New Job
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1E2535] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">New Scheduled Job</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Job Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
            <input placeholder="Cron Expression (e.g. 0 9 * * *)" value={form.cronExpression} onChange={(e) => setForm({ ...form, cronExpression: e.target.value })}
              className="px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>
          <input placeholder="Agent ID" value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
          <textarea placeholder="Task Template" value={form.taskTemplate} onChange={(e) => setForm({ ...form, taskTemplate: e.target.value })} rows={2}
            className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none" />
          <button onClick={handleCreate} disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl text-white text-sm font-medium disabled:opacity-50">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Job
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535]">
          <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3">
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xs text-gray-500">Total Jobs</p>
          <p className="text-lg font-bold text-purple-400">{jobs.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535]">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-lg font-bold text-emerald-400">{jobs.filter((j) => j.enabled).length}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535]">
          <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
            <Wifi className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xs text-gray-500">Always-On</p>
          <p className="text-lg font-bold text-blue-400">{agents.length}</p>
        </div>
      </div>

      {/* Cron Table */}
      <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
        <h3 className="text-sm font-semibold text-white mb-4">Cron Jobs</h3>
        <CronTable jobs={jobs} onToggle={handleToggle} />
      </div>

      {/* Always-On Monitor */}
      <AlwaysOnMonitor agents={agents} />
    </div>
  );
}