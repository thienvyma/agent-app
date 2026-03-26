"use client";

/**
 * GatewayPanel — extracted Gateway Control panel for OpenClaw Settings.
 *
 * Features: start/stop/restart, status badge, port display,
 * dashboard link, error display.
 *
 * @module components/settings/gateway-panel
 */

import {
  Play,
  Square,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface GatewayPanelProps {
  running: boolean;
  errors: string | null;
  port?: number;
  dashboardUrl?: string;
  serviceStatus?: string;
  serviceMissing?: boolean;
  onAction: (action: "start" | "stop" | "restart") => void;
  actionLoading: string | null;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
      color: ok ? "#4ade80" : "#f87171",
      background: ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
    }}>
      {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {label}
    </span>
  );
}

function ActionBtn({ label, icon: Icon, onClick, loading, variant = "default" }: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  loading?: boolean;
  variant?: "default" | "primary" | "danger";
}) {
  const colors = {
    default: { bg: "#1E2535", text: "#e2e8f0", border: "#2A303C" },
    primary: { bg: "#1E3A5F", text: "#60a5fa", border: "#2563eb" },
    danger: { bg: "#3B1A1A", text: "#f87171", border: "#991b1b" },
  };
  const c = colors[variant];
  return (
    <button
      onClick={onClick}
      disabled={!!loading}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 8,
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {label}
    </button>
  );
}

export function GatewayPanel({ running, errors, port, dashboardUrl, serviceStatus, serviceMissing, onAction, actionLoading }: GatewayPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 }}>
      {/* Status + Port */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <StatusBadge ok={running} label={running ? "Running" : "Stopped"} />
        {port && (
          <span style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 12,
            background: "#0B0F19", border: "1px solid #1E2535", color: "#94a3b8",
            fontFamily: "monospace",
          }}>
            Port: {port}
          </span>
        )}
        {running && (
          <a
            href={dashboardUrl || `http://127.0.0.1:${port}/`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 12, color: "#818cf8", textDecoration: "none",
            }}
          >
            <ExternalLink size={12} /> Open Dashboard
          </a>
        )}
        {serviceMissing && (
          <span style={{ fontSize: 11, color: "#f59e0b" }}>
            ⚠ Service not registered — Start/Stop use service manager
          </span>
        )}
      </div>

      {/* Error */}
      {errors && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, color: "#f87171",
        }}>
          <AlertTriangle size={14} /> {errors.slice(0, 200)}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <ActionBtn label="Start" icon={Play} variant="primary"
          loading={actionLoading === "gw-start"}
          onClick={() => onAction("start")} />
        <ActionBtn label="Stop" icon={Square} variant="danger"
          loading={actionLoading === "gw-stop"}
          onClick={() => onAction("stop")} />
        <ActionBtn label="Restart" icon={RotateCw}
          loading={actionLoading === "gw-restart"}
          onClick={() => onAction("restart")} />
      </div>
    </div>
  );
}
