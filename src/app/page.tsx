/**
 * Landing page — will become Dashboard after auth is wired up.
 * For now, shows system status to verify scaffold works.
 */
export default function HomePage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        background: "#0f172a",
        color: "#f1f5f9",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        🏢 Agentic Enterprise
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
        AI-powered Autonomous Business — v0.1.0
      </p>
      <div
        style={{
          background: "rgba(30, 41, 59, 0.8)",
          padding: "1.5rem 2rem",
          borderRadius: "12px",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          minWidth: "320px",
        }}
      >
        <p style={{ color: "#22c55e", marginBottom: "0.5rem" }}>
          ✅ Next.js 15 — Running
        </p>
        <p style={{ color: "#94a3b8", marginBottom: "0.5rem" }}>
          ⏳ PostgreSQL — Check docker compose
        </p>
        <p style={{ color: "#94a3b8", marginBottom: "0.5rem" }}>
          ⏳ Redis — Check docker compose
        </p>
        <p style={{ color: "#94a3b8" }}>
          ⏳ OpenClaw — Port 18789
        </p>
      </div>
    </main>
  );
}
