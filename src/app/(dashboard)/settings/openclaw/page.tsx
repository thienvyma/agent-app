"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Server,
  Play,
  Square,
  RotateCw,
  Cpu,
  Key,
  Shield,
  Wrench,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Terminal,
} from "lucide-react";

/** Reusable status badge */
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

/** Reusable action button */
function ActionBtn({
  label, icon: Icon, onClick, loading, variant = "default",
}: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  loading?: boolean;
  variant?: "default" | "primary" | "danger";
}) {
  const colors = {
    default: { bg: "#1E2535", hover: "#2A3040", text: "#e2e8f0", border: "#2A303C" },
    primary: { bg: "rgba(99,102,241,0.15)", hover: "rgba(99,102,241,0.25)", text: "#818cf8", border: "rgba(99,102,241,0.3)" },
    danger: { bg: "rgba(239,68,68,0.1)", hover: "rgba(239,68,68,0.2)", text: "#f87171", border: "rgba(239,68,68,0.2)" },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500,
        background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
        cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1,
        transition: "background 0.15s",
      }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {label}
    </button>
  );
}

/** Panel component */
function Panel({ title, icon: Icon, iconColor, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; iconColor: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#111827", border: "1px solid #1E2535", borderRadius: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "16px 20px", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <Icon size={18} style={{ color: iconColor }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", flex: 1, textAlign: "left" }}>{title}</span>
        {open ? <ChevronDown size={16} style={{ color: "#64748b" }} /> : <ChevronRight size={16} style={{ color: "#64748b" }} />}
      </button>
      {open && <div style={{ padding: "0 20px 20px", borderTop: "1px solid #1E2535" }}>{children}</div>}
    </div>
  );
}

/**
 * OpenClaw Settings Page — full configuration UI.
 *
 * Uses indirect CLI commands via API routes.
 * Never modifies OpenClaw config files directly.
 */
export default function OpenClawSettingsPage() {
  // ── State ──
  const [version, setVersion] = useState<string>("");
  const [gateway, setGateway] = useState<{ running: boolean; status: unknown; errors: string | null } | null>(null);
  const [models, setModels] = useState<{ models: unknown; status: unknown } | null>(null);
  const [configValidation, setConfigValidation] = useState<{ valid: boolean; output: unknown } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<Array<{ time: string; action: string; result: string; ok: boolean }>>([]);

  // Config editor
  const [configPath, setConfigPath] = useState("");
  const [configValue, setConfigValue] = useState("");
  const [configResult, setConfigResult] = useState("");

  // Auth form
  const [authProvider, setAuthProvider] = useState("anthropic");
  const [authApiKey, setAuthApiKey] = useState("");
  const [authBaseUrl, setAuthBaseUrl] = useState("");

  // Model set form
  const [modelInput, setModelInput] = useState("");

  /** Add action to log */
  const log = useCallback((action: string, result: string, ok: boolean) => {
    setActionLog((prev) => [
      { time: new Date().toLocaleTimeString(), action, result, ok },
      ...prev.slice(0, 19),
    ]);
  }, []);

  /** Fetch all status */
  const fetchAll = useCallback(async () => {
    try {
      const [vRes, gRes, mRes, cRes] = await Promise.allSettled([
        fetch("/api/openclaw/update").then((r) => r.json()),
        fetch("/api/openclaw/gateway").then((r) => r.json()),
        fetch("/api/openclaw/models").then((r) => r.json()),
        fetch("/api/openclaw/config?action=validate").then((r) => r.json()),
      ]);

      if (vRes.status === "fulfilled") setVersion(vRes.value.data?.version ?? "unknown");
      if (gRes.status === "fulfilled") setGateway(gRes.value.data ?? null);
      if (mRes.status === "fulfilled") setModels(mRes.value.data ?? null);
      if (cRes.status === "fulfilled") setConfigValidation(cRes.value.data ?? null);
    } catch (err) {
      console.error("[OpenClawSettings] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /** Generic action executor */
  async function doAction(name: string, url: string, options?: RequestInit) {
    setActionLoading(name);
    try {
      const res = await fetch(url, options);
      const json = await res.json();
      const ok = json.data?.success !== false && res.ok;
      log(name, json.data?.output || json.data?.errors || JSON.stringify(json.data).slice(0, 200), ok);
      await fetchAll();
    } catch (err) {
      log(name, String(err), false);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <Loader2 size={32} style={{ color: "#818cf8" }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Settings size={24} style={{ color: "#818cf8" }} /> OpenClaw Configuration
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Manage OpenClaw indirectly via CLI commands — no config files modified directly
          </p>
        </div>
        <StatusBadge ok={gateway?.running ?? false} label={gateway?.running ? "Gateway Online" : "Gateway Offline"} />
      </div>

      {/* ═══ 1. System Info ═══ */}
      <Panel title="System Info" icon={Server} iconColor="#818cf8">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ padding: "10px 16px", background: "#0B0F19", borderRadius: 10, border: "1px solid #1E2535" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Version</span>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", margin: "2px 0 0", fontFamily: "monospace" }}>{version}</p>
            </div>
            <div style={{ padding: "10px 16px", background: "#0B0F19", borderRadius: 10, border: "1px solid #1E2535" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Config Valid</span>
              <p style={{ margin: "2px 0 0" }}>
                <StatusBadge ok={configValidation?.valid ?? false} label={configValidation?.valid ? "Valid" : "Invalid"} />
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ActionBtn label="Update OpenClaw" icon={Download} variant="primary"
              loading={actionLoading === "update"}
              onClick={() => doAction("update", "/api/openclaw/update", { method: "POST" })} />
            <ActionBtn label="Doctor Fix" icon={Wrench} variant="primary"
              loading={actionLoading === "doctor"}
              onClick={() => doAction("doctor", "/api/openclaw/doctor", { method: "POST" })} />
            <ActionBtn label="Refresh" icon={RotateCw}
              loading={actionLoading === "refresh"}
              onClick={() => { setActionLoading("refresh"); fetchAll().then(() => setActionLoading(null)); }} />
          </div>
        </div>
      </Panel>

      {/* ═══ 2. Gateway ═══ */}
      <Panel title="Gateway Control" icon={Server} iconColor="#22c55e">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StatusBadge ok={gateway?.running ?? false} label={gateway?.running ? "Running" : "Stopped"} />
            {gateway?.errors && (
              <span style={{ fontSize: 12, color: "#f87171", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} /> {typeof gateway.errors === "string" ? gateway.errors.slice(0, 100) : "Error"}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ActionBtn label="Start" icon={Play} variant="primary"
              loading={actionLoading === "gw-start"}
              onClick={() => doAction("gw-start", "/api/openclaw/gateway", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "start" }),
              })} />
            <ActionBtn label="Stop" icon={Square} variant="danger"
              loading={actionLoading === "gw-stop"}
              onClick={() => doAction("gw-stop", "/api/openclaw/gateway", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "stop" }),
              })} />
            <ActionBtn label="Restart" icon={RotateCw}
              loading={actionLoading === "gw-restart"}
              onClick={() => doAction("gw-restart", "/api/openclaw/gateway", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "restart" }),
              })} />
          </div>
        </div>
      </Panel>

      {/* ═══ 3. Models ═══ */}
      <Panel title="Model Management" icon={Cpu} iconColor="#3b82f6">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 }}>
          {/* Current model info */}
          <div style={{ padding: 12, background: "#0B0F19", borderRadius: 10, border: "1px solid #1E2535", fontSize: 13 }}>
            <pre style={{ color: "#94a3b8", margin: 0, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>
              {models?.status ? (typeof models.status === "object" ? JSON.stringify(models.status, null, 2) : String(models.status)) : "No model data"}
            </pre>
          </div>
          {/* Set primary model */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              placeholder="e.g. ollama-lan/qwen2.5:7b or anthropic/claude-sonnet-4-6"
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13,
                background: "#0B0F19", border: "1px solid #1E2535", color: "#e2e8f0",
                outline: "none", fontFamily: "monospace",
              }}
            />
            <ActionBtn label="Set Model" icon={Cpu} variant="primary"
              loading={actionLoading === "set-model"}
              onClick={() => {
                if (!modelInput.trim()) return;
                doAction("set-model", "/api/openclaw/models", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ model: modelInput.trim() }),
                });
              }} />
          </div>
        </div>
      </Panel>

      {/* ═══ 4. Provider Auth ═══ */}
      <Panel title="Provider Authentication" icon={Key} iconColor="#f59e0b" defaultOpen={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={authProvider}
              onChange={(e) => setAuthProvider(e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: 8, fontSize: 13,
                background: "#0B0F19", border: "1px solid #1E2535", color: "#e2e8f0",
              }}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="google">Google</option>
              <option value="ollama-lan">Ollama LAN</option>
            </select>
            <input
              value={authApiKey}
              onChange={(e) => setAuthApiKey(e.target.value)}
              placeholder="API Key (e.g. sk-ant-...)"
              type="password"
              style={{
                flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, fontSize: 13,
                background: "#0B0F19", border: "1px solid #1E2535", color: "#e2e8f0",
                outline: "none", fontFamily: "monospace",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={authBaseUrl}
              onChange={(e) => setAuthBaseUrl(e.target.value)}
              placeholder="Base URL (optional, e.g. http://192.168.1.35:8080/v1)"
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13,
                background: "#0B0F19", border: "1px solid #1E2535", color: "#e2e8f0",
                outline: "none", fontFamily: "monospace",
              }}
            />
            <ActionBtn label="Save Auth" icon={Shield} variant="primary"
              loading={actionLoading === "set-auth"}
              onClick={() => {
                if (!authApiKey.trim() && !authBaseUrl.trim()) return;
                doAction("set-auth", "/api/openclaw/auth", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ provider: authProvider, apiKey: authApiKey, baseUrl: authBaseUrl }),
                });
                setAuthApiKey("");
              }} />
          </div>
        </div>
      </Panel>

      {/* ═══ 5. Config Editor (Advanced) ═══ */}
      <Panel title="Config Editor (Advanced)" icon={Terminal} iconColor="#c084fc" defaultOpen={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            Read/write any OpenClaw config path via <code style={{ color: "#818cf8" }}>openclaw config get/set</code>
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={configPath}
              onChange={(e) => setConfigPath(e.target.value)}
              placeholder="Config path (e.g. gateway.auth.mode)"
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13,
                background: "#0B0F19", border: "1px solid #1E2535", color: "#e2e8f0",
                outline: "none", fontFamily: "monospace",
              }}
            />
            <ActionBtn label="Get" icon={ChevronRight}
              loading={actionLoading === "config-get"}
              onClick={async () => {
                if (!configPath.trim()) return;
                setActionLoading("config-get");
                try {
                  const res = await fetch(`/api/openclaw/config?path=${encodeURIComponent(configPath)}`);
                  const json = await res.json();
                  setConfigResult(json.data?.value ?? json.data?.error ?? "No result");
                  log("config get " + configPath, json.data?.value ?? "error", json.data?.exitCode === 0);
                } catch (err) { setConfigResult(String(err)); }
                finally { setActionLoading(null); }
              }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={configValue}
              onChange={(e) => setConfigValue(e.target.value)}
              placeholder="Value to set"
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13,
                background: "#0B0F19", border: "1px solid #1E2535", color: "#e2e8f0",
                outline: "none", fontFamily: "monospace",
              }}
            />
            <ActionBtn label="Set" icon={CheckCircle2} variant="primary"
              loading={actionLoading === "config-set"}
              onClick={() => {
                if (!configPath.trim() || !configValue.trim()) return;
                doAction("config-set", "/api/openclaw/config", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ path: configPath, value: configValue }),
                });
              }} />
          </div>
          {configResult && (
            <div style={{ padding: 12, background: "#0B0F19", borderRadius: 10, border: "1px solid #1E2535" }}>
              <pre style={{ color: "#94a3b8", margin: 0, fontSize: 13, whiteSpace: "pre-wrap" }}>{configResult}</pre>
            </div>
          )}
        </div>
      </Panel>

      {/* ═══ Action Log ═══ */}
      {actionLog.length > 0 && (
        <Panel title={`Action Log (${actionLog.length})`} icon={Terminal} iconColor="#64748b" defaultOpen={false}>
          <div style={{ paddingTop: 12, maxHeight: 250, overflow: "auto" }}>
            {actionLog.map((entry, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, alignItems: "flex-start",
                padding: "6px 0", borderBottom: i < actionLog.length - 1 ? "1px solid #1E2535" : "none",
              }}>
                <span style={{ fontSize: 11, color: "#475569", whiteSpace: "nowrap", marginTop: 2 }}>{entry.time}</span>
                {entry.ok ? <CheckCircle2 size={12} style={{ color: "#4ade80", marginTop: 3, flexShrink: 0 }} /> : <XCircle size={12} style={{ color: "#f87171", marginTop: 3, flexShrink: 0 }} />}
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{entry.action}</span>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0", wordBreak: "break-all" }}>{entry.result.slice(0, 200)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
