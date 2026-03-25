/**
 * OpenClaw Settings Page — configure and test OpenClaw connection.
 *
 * Features:
 * - Display current OPENCLAW_API_URL
 * - Test Connection button → GET /api/openclaw/status
 * - Show engine type, deployed agents, connection status
 * - Toggle mock/real mode info
 *
 * @module app/(dashboard)/settings/openclaw/page
 */

"use client";

import React, { useState, useCallback } from "react";

/** OpenClaw status response shape */
interface OpenClawStatus {
  connected: boolean;
  engineType: string;
  gatewayUrl: string;
  useMock: boolean;
  agentsDeployed: number;
  agents: { id: string; name: string; status: string }[];
  error?: string;
  timestamp: string;
}

export default function OpenClawSettingsPage() {
  const [status, setStatus] = useState<OpenClawStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/openclaw/status");
      const data: OpenClawStatus = await res.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary, #e0e0f0)" }}>
        ⚙️ OpenClaw Configuration
      </h1>
      <p style={{ color: "var(--text-secondary, #a0a0b8)", marginBottom: "2rem" }}>
        Quản lý kết nối tới OpenClaw Gateway. App giao tiếp với OpenClaw qua HTTP API — không sửa code OpenClaw.
      </p>

      {/* Connection Info */}
      <div style={{
        background: "var(--bg-secondary, #1a1a2e)",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        border: "1px solid var(--border-color, #333355)",
      }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary, #e0e0f0)" }}>
          Thông tin kết nối
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "0.75rem", fontSize: "0.875rem" }}>
          <span style={{ color: "var(--text-secondary, #a0a0b8)" }}>Gateway URL:</span>
          <span style={{ color: "var(--text-primary, #e0e0f0)", fontFamily: "monospace" }}>
            {status?.gatewayUrl ?? "http://localhost:18789"}
          </span>

          <span style={{ color: "var(--text-secondary, #a0a0b8)" }}>Engine Type:</span>
          <span style={{ color: "var(--text-primary, #e0e0f0)" }}>
            {status?.engineType ?? "—"}
          </span>

          <span style={{ color: "var(--text-secondary, #a0a0b8)" }}>Mock Mode:</span>
          <span style={{ color: status?.useMock ? "#f59e0b" : "#10b981" }}>
            {status ? (status.useMock ? "⚠️ Đang dùng Mock" : "✅ Real OpenClaw") : "—"}
          </span>

          <span style={{ color: "var(--text-secondary, #a0a0b8)" }}>Trạng thái:</span>
          <span style={{ color: status?.connected ? "#10b981" : "#ef4444" }}>
            {status ? (status.connected ? "🟢 Connected" : "🔴 Disconnected") : "—"}
          </span>

          <span style={{ color: "var(--text-secondary, #a0a0b8)" }}>Agents đã deploy:</span>
          <span style={{ color: "var(--text-primary, #e0e0f0)" }}>
            {status?.agentsDeployed ?? "—"}
          </span>
        </div>
      </div>

      {/* Test Connection Button */}
      <button
        onClick={testConnection}
        disabled={loading}
        style={{
          padding: "0.75rem 2rem",
          borderRadius: "8px",
          border: "none",
          background: loading ? "#4b5563" : "var(--accent-primary, #6366f1)",
          color: "#fff",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "0.875rem",
          marginBottom: "1.5rem",
        }}
      >
        {loading ? "Đang kiểm tra..." : "🔌 Test Connection"}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1.5rem",
          color: "#ef4444",
        }}>
          ❌ {error}
        </div>
      )}

      {/* Deployed Agents */}
      {status?.agents && status.agents.length > 0 && (
        <div style={{
          background: "var(--bg-secondary, #1a1a2e)",
          borderRadius: "12px",
          padding: "1.5rem",
          border: "1px solid var(--border-color, #333355)",
        }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary, #e0e0f0)" }}>
            Agents đã deploy ({status.agents.length})
          </h2>
          <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color, #333355)" }}>
                <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-secondary, #a0a0b8)" }}>ID</th>
                <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-secondary, #a0a0b8)" }}>Name</th>
                <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-secondary, #a0a0b8)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {status.agents.map((agent) => (
                <tr key={agent.id} style={{ borderBottom: "1px solid var(--border-color, #333355)" }}>
                  <td style={{ padding: "0.5rem", fontFamily: "monospace", color: "var(--text-primary, #e0e0f0)" }}>{agent.id}</td>
                  <td style={{ padding: "0.5rem", color: "var(--text-primary, #e0e0f0)" }}>{agent.name}</td>
                  <td style={{ padding: "0.5rem", color: agent.status === "RUNNING" ? "#10b981" : "#f59e0b" }}>{agent.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Setup Guide */}
      <div style={{
        background: "var(--bg-secondary, #1a1a2e)",
        borderRadius: "12px",
        padding: "1.5rem",
        marginTop: "1.5rem",
        border: "1px solid var(--border-color, #333355)",
      }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary, #e0e0f0)" }}>
          📖 Hướng dẫn
        </h2>
        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary, #a0a0b8)", lineHeight: 1.8 }}>
          <p>1. Cài OpenClaw: <code style={{ background: "#333355", padding: "2px 6px", borderRadius: "4px" }}>npm install -g openclaw</code></p>
          <p>2. Chạy Gateway: <code style={{ background: "#333355", padding: "2px 6px", borderRadius: "4px" }}>openclaw</code> (port 18789)</p>
          <p>3. Set env: <code style={{ background: "#333355", padding: "2px 6px", borderRadius: "4px" }}>USE_MOCK_ADAPTER=false</code></p>
          <p>4. Restart app: <code style={{ background: "#333355", padding: "2px 6px", borderRadius: "4px" }}>npm run dev</code></p>
        </div>
      </div>
    </div>
  );
}
