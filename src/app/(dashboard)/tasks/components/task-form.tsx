"use client";

import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";

/** Agent option for assignment dropdown */
interface AgentOption {
  id: string;
  name: string;
  role: string;
}

interface TaskFormProps {
  onSubmit: (data: { description: string; assignedToId?: string; priority: number }) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal form for creating a new task.
 *
 * Fetches agents for assignment dropdown.
 * Validates description + priority before submission.
 */
export function TaskForm({ onSubmit, onClose }: TaskFormProps) {
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(5);
  const [assignedToId, setAssignedToId] = useState("");
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  /** Fetch available agents for assignment */
  useEffect(() => {
    fetch("/api/agents?limit=100")
      .then((r) => r.json())
      .then((json) => setAgents(json.data || []))
      .catch(() => setAgents([]));
  }, []);

  /** Validate and submit form */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (!description.trim()) errs.push("Description is required");
    if (priority < 1 || priority > 10) errs.push("Priority must be 1-10");
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      await onSubmit({
        description: description.trim(),
        assignedToId: assignedToId || undefined,
        priority,
      });
    } catch {
      setErrors(["Failed to create task. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[#111827] border border-[#1E2535] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E2535]">
          <h2 className="text-lg font-semibold text-white">Create New Task</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="text-sm text-red-400">
                {errors.map((err, i) => <p key={i}>{err}</p>)}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the task in detail..."
              className="w-full px-4 py-3 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Priority <span className="text-gray-500">(1 = highest, 10 = lowest)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span className={`w-8 text-center text-sm font-bold ${
                priority <= 3 ? "text-red-400" : priority <= 6 ? "text-amber-400" : "text-green-400"
              }`}>
                {priority}
              </span>
            </div>
          </div>

          {/* Assign to Agent */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Assign to Agent</label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none transition-all"
            >
              <option value="">Unassigned (auto-delegate later)</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
