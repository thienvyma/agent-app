"use client";

import { useState, useEffect, useCallback } from "react";
import { AgentList } from "./components/agent-list";
import { AgentForm } from "./components/agent-form";
import { Loader2 } from "lucide-react";

/** Agent type matching API response */
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

/** API response shape */
interface ApiResponse {
  data: Agent[];
  meta?: { total: number; page: number; limit: number };
}

/**
 * Agents dashboard page — lists all agents with CRUD operations.
 *
 * Fetches agents from `/api/agents` and renders AgentList + AgentForm.
 */
export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  /**
   * Fetches agent list from API.
   */
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents?limit=100");
      const json: ApiResponse = await res.json();
      setAgents(json.data || []);

      // Extract unique departments
      const deptMap = new Map<string, string>();
      (json.data || []).forEach((a: Agent) => {
        if (a.department) deptMap.set(a.department.id, a.department.name);
      });
      setDepartments(Array.from(deptMap.entries()).map(([id, name]) => ({ id, name })));
    } catch (err) {
      console.error("[AgentsPage] Failed to fetch agents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  /**
   * Creates a new agent via API.
   */
  async function handleCreateAgent(data: Record<string, unknown>) {
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create agent");
    setShowForm(false);
    await fetchAgents();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AgentList agents={agents} onAddAgent={() => setShowForm(true)} />
      {showForm && (
        <AgentForm
          departments={departments}
          onSubmit={handleCreateAgent}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}