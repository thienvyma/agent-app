"use client";

import { useState, useEffect, useCallback } from "react";
import { CostChart } from "./components/cost-chart";
import { BudgetForm } from "./components/budget-form";
import { CostTable } from "./components/cost-table";
import {
  DollarSign,
  Loader2,
  Coins,
  TrendingUp,
  Users,
  ShieldAlert,
} from "lucide-react";

/** Agent summary from /api/cost/entries?summary=true */
interface AgentSummary {
  agentId: string;
  agentName: string;
  model: string;
  totalTokens: number;
  totalCostUsd: number;
  requestCount: number;
}

/** Cost entry from /api/cost/entries */
interface CostEntry {
  id: string;
  agentId: string;
  tokens: number;
  costUsd: number;
  model: string;
  taskDesc: string | null;
  createdAt: string;
  agent?: { id: string; name: string; role: string } | null;
}

/** Budget from /api/cost/budget */
interface BudgetData {
  budget: { dailyLimit: number; warningPct: number; currentSpent: number; date: string };
  todaySpent: { costUsd: number; tokens: number };
}

/**
 * Budget & Cost Dashboard page.
 *
 * Shows cost overview stats, per-agent chart, budget gauge,
 * budget settings form, and cost history table.
 */
export default function BudgetPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [totals, setTotals] = useState({ totalTokens: 0, totalCostUsd: 0, agentCount: 0 });
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [entryTotal, setEntryTotal] = useState(0);
  const [entryPage, setEntryPage] = useState(1);
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);

  /** Fetch per-agent cost summary */
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/cost/entries?summary=true&days=30");
      const json = await res.json();
      setAgents(json.data?.agents ?? []);
      setTotals(json.data?.totals ?? { totalTokens: 0, totalCostUsd: 0, agentCount: 0 });
    } catch (err) {
      console.error("[BudgetPage] Summary fetch failed:", err);
    }
  }, []);

  /** Fetch cost entries (paginated) */
  const fetchEntries = useCallback(async (page: number) => {
    try {
      const res = await fetch(`/api/cost/entries?days=30&page=${page}&limit=20`);
      const json = await res.json();
      setEntries(json.data ?? []);
      setEntryTotal(json.pagination?.total ?? 0);
      setEntryPage(page);
    } catch (err) {
      console.error("[BudgetPage] Entries fetch failed:", err);
    }
  }, []);

  /** Fetch budget info */
  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/cost/budget");
      const json = await res.json();
      setBudget(json.data);
    } catch (err) {
      console.error("[BudgetPage] Budget fetch failed:", err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchSummary(), fetchEntries(1), fetchBudget()])
      .finally(() => setLoading(false));
  }, [fetchSummary, fetchEntries, fetchBudget]);

  /** Update budget */
  async function handleBudgetUpdate(data: { dailyLimit: number; warningPct: number }) {
    const res = await fetch("/api/cost/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed");
    await fetchBudget();
  }

  /** Calculate budget used percent */
  const budgetUsedPercent = budget?.budget.dailyLimit
    ? Math.round((budget.todaySpent.costUsd / budget.budget.dailyLimit) * 100)
    : 0;

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
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <DollarSign className="w-7 h-7 text-emerald-400" />
          Budget & Cost
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Track token usage, costs, and budget limits across all agents
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Coins}
          label="Total Tokens"
          value={totals.totalTokens.toLocaleString()}
          color="text-indigo-400"
          bg="bg-indigo-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Cost"
          value={`$${totals.totalCostUsd.toFixed(4)}`}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Users}
          label="Active Agents"
          value={`${totals.agentCount}`}
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={ShieldAlert}
          label="Budget Status"
          value={budgetUsedPercent >= 100 ? "Exceeded" : budgetUsedPercent >= 80 ? "Warning" : "OK"}
          color={budgetUsedPercent >= 100 ? "text-red-400" : budgetUsedPercent >= 80 ? "text-amber-400" : "text-emerald-400"}
          bg={budgetUsedPercent >= 100 ? "bg-red-500/10" : budgetUsedPercent >= 80 ? "bg-amber-500/10" : "bg-emerald-500/10"}
        />
      </div>

      {/* Charts + Budget Form */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <CostChart
            agents={agents}
            budgetUsedPercent={budgetUsedPercent}
          />
        </div>
        <div>
          <BudgetForm
            currentLimit={budget?.budget.dailyLimit}
            currentWarningPct={budget?.budget.warningPct}
            onSubmit={handleBudgetUpdate}
          />
        </div>
      </div>

      {/* Cost History Table */}
      <CostTable
        entries={entries}
        total={entryTotal}
        page={entryPage}
        limit={20}
        onPageChange={fetchEntries}
      />
    </div>
  );
}

/** Stat card component */
function StatCard({
  icon: Icon, label, value, color, bg,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535]">
      <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className={`w-4.5 h-4.5 ${color}`} />
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}