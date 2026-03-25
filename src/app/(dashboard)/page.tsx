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

/**
 * Dashboard Overview — Main page for Agentic Enterprise.
 * Professional glassmorphism cards with live stats.
 */
export default function OverviewPage() {
  /* ─── Mock Data ─── */
  const stats = [
    { label: "Active Agents", value: "3 / 4", icon: Users, trend: "+1 today", color: "#818cf8", href: "/agents" },
    { label: "Tasks Completed", value: "43", icon: CheckSquare, trend: "+12 vs yesterday", color: "#22c55e", href: "/tasks" },
    { label: "Tokens Used", value: "78.3K", icon: Zap, trend: "78% of quota", color: "#3b82f6", href: "/budget" },
    { label: "Budget Remaining", value: "₫7.9M", icon: DollarSign, trend: "of ₫10M total", color: "#f59e0b", href: "/budget" },
  ];

  const agents = [
    { id: "ceo-001", name: "CEO Agent", role: "CEO", dept: "Executive", status: "running", tasks: 12, tokens: 25400 },
    { id: "mkt-001", name: "Marketing Agent", role: "Marketing Manager", dept: "Marketing", status: "running", tasks: 18, tokens: 31200 },
    { id: "fin-001", name: "Finance Agent", role: "CFO", dept: "Finance", status: "idle", tasks: 8, tokens: 12800 },
    { id: "dev-001", name: "Developer Agent", role: "Tech Lead", dept: "Engineering", status: "paused", tasks: 5, tokens: 8900 },
  ];

  const tasks = [
    { id: 1, title: "Viết nội dung marketing Q2", agent: "Marketing", status: "completed", time: "5m ago" },
    { id: 2, title: "Phân tích ROI chiến dịch T3", agent: "Finance", status: "completed", time: "12m ago" },
    { id: 3, title: "Review báo giá client", agent: "CEO", status: "pending", time: "18m ago" },
    { id: 4, title: "Cập nhật SEO meta tags", agent: "Marketing", status: "running", time: "25m ago" },
    { id: 5, title: "Deploy hotfix authentication", agent: "Developer", status: "completed", time: "1h ago" },
  ];

  const services = [
    { name: "Next.js", status: "healthy", latency: "2ms" },
    { name: "PostgreSQL", status: "healthy", latency: "8ms" },
    { name: "Redis", status: "healthy", latency: "1ms" },
    { name: "Ollama", status: "degraded", latency: "450ms" },
    { name: "OpenClaw", status: "healthy", latency: "15ms" },
  ];

  const statusColors: Record<string, { dot: string; text: string; bg: string }> = {
    running: { dot: "#22c55e", text: "#4ade80", bg: "rgba(34,197,94,0.08)" },
    idle: { dot: "#64748b", text: "#94a3b8", bg: "rgba(100,116,139,0.08)" },
    paused: { dot: "#f59e0b", text: "#fbbf24", bg: "rgba(245,158,11,0.08)" },
    error: { dot: "#ef4444", text: "#f87171", bg: "rgba(239,68,68,0.08)" },
  };

  const taskColors: Record<string, { text: string; bg: string; label: string }> = {
    completed: { text: "#4ade80", bg: "rgba(34,197,94,0.1)", label: "Done" },
    running: { text: "#60a5fa", bg: "rgba(59,130,246,0.1)", label: "Running" },
    pending: { text: "#fbbf24", bg: "rgba(245,158,11,0.1)", label: "Pending" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            Dashboard Overview
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            Real-time monitoring of your autonomous business operations
          </p>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 20,
          background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
        }}>
          <Circle size={8} fill="#22c55e" stroke="none" />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#4ade80" }}>System Online</span>
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
        {/* Agent Team */}
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
            {agents.map((agent) => {
              const sc = statusColors[agent.status] || { dot: "#64748b", text: "#94a3b8", bg: "rgba(100,116,139,0.08)" };
              return (
                <div key={agent.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: 12,
                  background: "#0B0F19", border: "1px solid #1E2535",
                  transition: "border-color 0.15s",
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
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{agent.dept} · {agent.role}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "3px 10px", borderRadius: 8,
                      fontSize: 12, fontWeight: 600,
                      color: sc.text, background: sc.bg,
                    }}>
                      <Circle size={6} fill={sc.dot} stroke="none" />
                      {agent.status}
                    </span>
                    <p style={{ fontSize: 11, color: "#475569", margin: "4px 0 0" }}>
                      {agent.tasks} tasks · {(agent.tokens / 1000).toFixed(1)}K
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Tasks */}
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
            {tasks.map((task) => {
              const tc = taskColors[task.status] || { text: "#60a5fa", bg: "rgba(59,130,246,0.1)", label: "Running" };
              return (
                <div key={task.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: 10,
                  background: "#0B0F19", border: "1px solid #1E2535",
                }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0", margin: 0 }}>{task.title}</p>
                    <p style={{ fontSize: 12, color: "#475569", margin: "3px 0 0" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock size={11} /> {task.agent} · {task.time}
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

      {/* Service Health */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }} className="health-grid">
        {services.map((svc, i) => {
          const healthy = svc.status === "healthy";
          const sColor = healthy ? "#22c55e" : "#f59e0b";
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
          .health-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 639px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .health-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
