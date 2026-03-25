"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  CheckSquare,
  DollarSign,
  Activity,
  TrendingUp,
  Circle,
  ArrowUpRight,
  Clock,
  Zap,
} from "lucide-react";
import Link from "next/link";

/** Agent from API */
interface DashAgent {
  id: string;
  name: string;
  role: string;
  status: string;
  department?: { name: string };
  _count?: { tasks: number };
}

/** Task from API */
interface DashTask {
  id: string;
  description: string;
  status: string;
  assignedTo?: { name: string } | null;
  createdAt: string;
}

/** Health service */
interface HealthService {
  status: string;
  latencyMs?: number;
}

/**
 * Dashboard Overview — fetches REAL data from APIs.
 * No hardcoded mock data.
 */
export default function OverviewPage() {
  const [agents, setAgents] = useState<DashAgent[]>([]);
  const [tasks, setTasks] = useState<DashTask[]>([]);
  const [health, setHealth] = useState<Record<string, HealthService>>({});
  const [openclawStatus, setOpenclawStatus] = useState<{ connected: boolean; engineType: string } | null>(null);
  const [costData, setCostData] = useState<{ totalTokens: number; totalCostUSD: number }>({ totalTokens: 0, totalCostUSD: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const [agentsRes, tasksRes, healthRes, openclawRes, costRes] = await Promise.allSettled([
        fetch("/api/agents?limit=10").then((r) => r.json()),
        fetch("/api/tasks?limit=10").then((r) => r.json()),
        fetch("/api/health").then((r) => r.json()),
        fetch("/api/openclaw/status").then((r) => r.json()),
        fetch("/api/cost/entries?limit=1").then((r) => r.json()),
      ]);

      if (agentsRes.status === "fulfilled") setAgents(agentsRes.value.data || []);
      if (tasksRes.status === "fulfilled") setTasks(tasksRes.value.data || []);
      if (healthRes.status === "fulfilled") setHealth(healthRes.value.services || {});
      if (openclawRes.status === "fulfilled") setOpenclawStatus(openclawRes.value);
      if (costRes.status === "fulfilled") {
        const entries = costRes.value.data || [];
        const totalTokens = entries.reduce((sum: number, e: { tokenUsage?: number }) => sum + (e.tokenUsage ?? 0), 0);
        setCostData({ totalTokens, totalCostUSD: totalTokens * 0.000005 });
      }
    } catch (err) {
      console.error("[Dashboard] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  /* ─── Computed Stats ─── */
  const activeAgents = agents.filter((a) => a.status === "RUNNING").length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const tokenDisplay = costData.totalTokens > 1000
    ? `${(costData.totalTokens / 1000).toFixed(1)}K`
    : String(costData.totalTokens);

  const stats = [
    { label: "Active Agents", value: `${activeAgents} / ${agents.length}`, icon: Users, trend: `${agents.length} total`, color: "#818cf8", href: "/agents" },
    { label: "Tasks Completed", value: String(completedTasks), icon: CheckSquare, trend: `${tasks.length} total`, color: "#22c55e", href: "/tasks" },
    { label: "Tokens Used", value: tokenDisplay, icon: Zap, trend: "live data", color: "#3b82f6", href: "/budget" },
    { label: "Cost (USD)", value: `$${costData.totalCostUSD.toFixed(4)}`, icon: DollarSign, trend: "estimated", color: "#f59e0b", href: "/budget" },
  ];

  const statusColors: Record<string, { dot: string; text: string; bg: string }> = {
    RUNNING: { dot: "#22c55e", text: "#4ade80", bg: "rgba(34,197,94,0.08)" },
    IDLE: { dot: "#64748b", text: "#94a3b8", bg: "rgba(100,116,139,0.08)" },
    PAUSED_BUDGET: { dot: "#f59e0b", text: "#fbbf24", bg: "rgba(245,158,11,0.08)" },
    ERROR: { dot: "#ef4444", text: "#f87171", bg: "rgba(239,68,68,0.08)" },
    DEPLOYING: { dot: "#3b82f6", text: "#60a5fa", bg: "rgba(59,130,246,0.08)" },
  };

  const taskColors: Record<string, { text: string; bg: string; label: string }> = {
    COMPLETED: { text: "#4ade80", bg: "rgba(34,197,94,0.1)", label: "Done" },
    IN_PROGRESS: { text: "#60a5fa", bg: "rgba(59,130,246,0.1)", label: "Running" },
    PENDING: { text: "#fbbf24", bg: "rgba(245,158,11,0.1)", label: "Pending" },
    WAITING_APPROVAL: { text: "#c084fc", bg: "rgba(168,85,247,0.1)", label: "Approval" },
    FAILED: { text: "#f87171", bg: "rgba(239,68,68,0.1)", label: "Failed" },
  };

  /** Time ago helper */
  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  /* ─── Services list (from health + openclaw) ─── */
  const services = [
    { name: "Next.js", status: "healthy", latency: `${Math.round(process.uptime?.() ?? 0) || "—"}s uptime` },
    { name: "PostgreSQL", status: health.database?.status === "connected" ? "healthy" : "offline", latency: health.database?.latencyMs ? `${health.database.latencyMs}ms` : "—" },
    { name: "OpenClaw", status: openclawStatus?.connected ? "healthy" : "offline", latency: openclawStatus?.engineType ?? "—" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #818cf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            Dashboard Overview
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            Real-time monitoring — data from live APIs
          </p>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 20,
          background: openclawStatus?.connected ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${openclawStatus?.connected ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
          <Circle size={8} fill={openclawStatus?.connected ? "#22c55e" : "#ef4444"} stroke="none" />
          <span style={{ fontSize: 13, fontWeight: 500, color: openclawStatus?.connected ? "#4ade80" : "#f87171" }}>
            {openclawStatus?.connected ? "OpenClaw Connected" : openclawStatus?.engineType === "MockAdapter" ? "Mock Mode" : "OpenClaw Offline"}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="stats-grid">
        {stats.map((s, i) => (
          <Link key={i} href={s.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#111827", border: "1px solid #1E2535", borderRadius: 16,
              padding: "20px 22px", transition: "border-color 0.2s, box-shadow 0.2s",
              cursor: "pointer",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{s.label}</span>
                  <span style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: -1 }}>{s.value}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <TrendingUp size={12} style={{ color: "#64748b" }} />
                    <span style={{ fontSize: 12, color: "#64748b" }}>{s.trend}</span>
                  </div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <s.icon size={22} style={{ color: s.color }} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="two-col-grid">
        {/* Agent Team — REAL DATA */}
        <div style={{ background: "#111827", border: "1px solid #1E2535", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Users size={18} style={{ color: "#818cf8" }} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Agent Team</h2>
            </div>
            <Link href="/agents" style={{ fontSize: 13, color: "#818cf8", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {agents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                <Users size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p style={{ fontSize: 14 }}>No agents yet. Create one in /agents.</p>
              </div>
            ) : agents.slice(0, 5).map((agent) => {
              const sc = statusColors[agent.status] || statusColors.IDLE!;
              return (
                <div key={agent.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: 12,
                  background: "#0B0F19", border: "1px solid #1E2535",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: "linear-gradient(135deg, #6366f1, #818cf8)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: 15, flexShrink: 0,
                    }}>
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{agent.name}</p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{agent.department?.name ?? "—"} · {agent.role}</p>
                    </div>
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "3px 10px", borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                    color: sc.text, background: sc.bg,
                  }}>
                    <Circle size={6} fill={sc.dot} stroke="none" />
                    {agent.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Tasks — REAL DATA */}
        <div style={{ background: "#111827", border: "1px solid #1E2535", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckSquare size={18} style={{ color: "#22c55e" }} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Recent Tasks</h2>
            </div>
            <Link href="/tasks" style={{ fontSize: 13, color: "#818cf8", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                <CheckSquare size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p style={{ fontSize: 14 }}>No tasks yet. Create one in /tasks.</p>
              </div>
            ) : tasks.slice(0, 5).map((task) => {
              const tc = taskColors[task.status] || taskColors.PENDING!;
              return (
                <div key={task.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: 10,
                  background: "#0B0F19", border: "1px solid #1E2535",
                }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0", margin: 0 }}>{task.description}</p>
                    <p style={{ fontSize: 12, color: "#475569", margin: "3px 0 0" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock size={11} /> {task.assignedTo?.name ?? "Unassigned"} · {timeAgo(task.createdAt)}
                      </span>
                    </p>
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: 6,
                    fontSize: 12, fontWeight: 600,
                    color: tc.text, background: tc.bg,
                    whiteSpace: "nowrap",
                  }}>
                    {tc.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Service Health — LIVE */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${services.length}, 1fr)`, gap: 12 }} className="health-grid">
        {services.map((svc, i) => {
          const healthy = svc.status === "healthy";
          const sColor = healthy ? "#22c55e" : "#ef4444";
          return (
            <div key={i} style={{
              background: "#111827", border: "1px solid #1E2535", borderRadius: 12,
              padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
            }}>
              <Activity size={18} style={{ color: sColor, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{svc.name}</p>
                <p style={{ fontSize: 11, color: sColor, margin: "2px 0 0" }}>
                  {svc.status} · {svc.latency}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 1023px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .two-col-grid { grid-template-columns: 1fr !important; }
          .health-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 639px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .health-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
