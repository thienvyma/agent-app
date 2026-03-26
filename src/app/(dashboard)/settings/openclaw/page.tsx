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
import { OnboardWizard } from "@/components/settings/onboard-wizard";
import { GatewayPanel } from "@/components/settings/gateway-panel";
import { ModelsPanel } from "@/components/settings/models-panel";
import { ConfigPanel } from "@/components/settings/config-panel";

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
 * Registered providers list — fetches from /api/openclaw/providers.
 */
function RegisteredProviders() {
  const [providers, setProviders] = useState<Array<{ name: string; baseUrl?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/openclaw/providers")
      .then((r) => r.json())
      .then((json) => setProviders(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 12 }}><Loader2 size={16} className="animate-spin" style={{ color: "#818cf8" }} /></div>;
  if (providers.length === 0) return (
    <div style={{ padding: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, fontSize: 13, color: "#f87171" }}>
      <AlertTriangle size={14} style={{ display: "inline", marginRight: 6 }} />
      No providers registered — agents cannot use cloud models. Add a provider below.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Registered Providers</span>
      {providers.map((p) => (
        <div key={p.name} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
          background: "#0B0F19", borderRadius: 8, border: "1px solid #1E2535",
        }}>
          <CheckCircle2 size={14} style={{ color: "#4ade80", flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", minWidth: 100 }}>{p.name}</span>
          <span style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{p.baseUrl ?? ""}</span>
        </div>
      ))}
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
  const [gateway, setGateway] = useState<{
    running: boolean;
    status: unknown;
    errors: string | null;
    dashboardUrl?: string;
    serviceStatus?: string;
    serviceMissing?: boolean;
    port?: number;
  } | null>(null);
  const [models, setModels] = useState<{ models: unknown; status: unknown } | null>(null);
  const [configValidation, setConfigValidation] = useState<{ valid: boolean; output: unknown } | null>(null);
  const [cliAvailable, setCliAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<Array<{ time: string; action: string; result: string; ok: boolean }>>([]);
  const [showWizard, setShowWizard] = useState(false);

  // Models panel state
  const [testResult, setTestResult] = useState<string | null>(null);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [panelLoading, setPanelLoading] = useState<string | null>(null);

  // Config editor
  const [configPath, setConfigPath] = useState("");
  const [configValue, setConfigValue] = useState("");
  const [configResult, setConfigResult] = useState("");

  // Auth form — defaults to first dropdown option (gemini) with pre-filled URL
  const [authProvider, setAuthProvider] = useState("gemini");
  const [authApiKey, setAuthApiKey] = useState("");
  const [authBaseUrl, setAuthBaseUrl] = useState("https://generativelanguage.googleapis.com/v1beta/openai");

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

      // Check if CLI is available by inspecting responses
      let cliOk = true;
      if (vRes.status === "fulfilled") {
        const ver = vRes.value.data?.version ?? "";
        const exitCode = vRes.value.data?.exitCode;
        if (!ver || ver === "unknown" || exitCode === 1) cliOk = false;
        setVersion(cliOk ? ver : "Not installed");
      } else {
        cliOk = false;
        setVersion("Not installed");
      }
      setCliAvailable(cliOk);

      if (gRes.status === "fulfilled") setGateway(gRes.value.data ?? null);
      if (mRes.status === "fulfilled") setModels(cliOk ? (mRes.value.data ?? null) : null);
      if (cRes.status === "fulfilled") setConfigValidation(cliOk ? (cRes.value.data ?? null) : null);
    } catch (err) {
      console.error("[OpenClawSettings] fetch error:", err);
      setCliAvailable(false);
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

      {/* Onboard Wizard — show when gateway offline, CLI not available, or user requests */}
      {(showWizard || !cliAvailable || !gateway?.running) && (
        <OnboardWizard onComplete={() => { setShowWizard(false); fetchAll(); }} />
      )}

      {/* Manual wizard trigger when everything is working but user wants to reconfigure */}
      {cliAvailable && gateway?.running && !showWizard && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px", borderRadius: 10, fontSize: 13,
          background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
          color: "#818cf8",
        }}>
          <span>Need to reconfigure?</span>
          <button
            onClick={() => setShowWizard(true)}
            style={{
              background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 6, color: "#818cf8", padding: "4px 12px", fontSize: 12,
              cursor: "pointer", fontWeight: 600,
            }}
          >
            Launch Setup Wizard
          </button>
        </div>
      )}

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
        <GatewayPanel
          running={gateway?.running ?? false}
          errors={typeof gateway?.errors === "string" ? gateway.errors : null}
          port={gateway?.port ?? 18789}
          dashboardUrl={gateway?.dashboardUrl}
          serviceStatus={gateway?.serviceStatus}
          serviceMissing={gateway?.serviceMissing}
          actionLoading={actionLoading}
          onAction={(action) => doAction(`gw-${action}`, "/api/openclaw/gateway", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          })}
        />
      </Panel>

      {/* ═══ 3. Models ═══ */}
      <Panel title="Model Management" icon={Cpu} iconColor="#3b82f6">
        <ModelsPanel
          models={models?.models ? (Array.isArray(models.models) ? models.models as { name: string; input: string; context: string; local: boolean; auth: boolean; tags: string }[] : []) : []}
          currentModel={modelInput || "ollama-lan/Qwen3.5-35B-A3B-Coder"}
          testResult={testResult}
          fetchedModels={fetchedModels}
          loading={panelLoading}
          onSetModel={(model) => {
            doAction("set-model", "/api/openclaw/models", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ model }),
            });
          }}
          onTestModel={async () => {
            setPanelLoading("test-model");
            try {
              const res = await fetch("/api/openclaw/onboard", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ step: "health" }),
              });
              const json = await res.json();
              setTestResult(json.success ? "✅ Model responding" : `❌ ${json.error}`);
            } catch (e) { setTestResult(`❌ ${e}`); }
            finally { setPanelLoading(null); }
          }}
          onFetchModels={async () => {
            setPanelLoading("fetch-models");
            try {
              const res = await fetch("/api/openclaw/onboard", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ step: "models", params: { baseUrl: "http://192.168.1.35:8080/v1" } }),
              });
              const json = await res.json();
              if (json.success && Array.isArray(json.data)) setFetchedModels(json.data);
            } catch { /* ignore */ }
            finally { setPanelLoading(null); }
          }}
        />
      </Panel>

      {/* ═══ 4. Provider Registration ═══ */}
      <Panel title="AI Providers" icon={Key} iconColor="#f59e0b" defaultOpen={true}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 16 }}>
          {/* Registered providers list */}
          <RegisteredProviders />

          {/* Add new provider form */}
          <div style={{ padding: 16, background: "#0B0F19", borderRadius: 12, border: "1px solid #1E2535" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", margin: "0 0 12px" }}>Add / Update Provider</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={authProvider}
                  onChange={(e) => {
                    setAuthProvider(e.target.value);
                    const presets: Record<string, { url: string; hint: string }> = {
                      gemini: { url: "https://generativelanguage.googleapis.com/v1beta/openai", hint: "AIza..." },
                      openai: { url: "https://api.openai.com/v1", hint: "sk-..." },
                      openrouter: { url: "https://openrouter.ai/api/v1", hint: "sk-or-..." },
                      "ollama-lan": { url: "http://192.168.1.35:8080/v1", hint: "sk-local" },
                      ollama: { url: "http://localhost:11434/v1", hint: "sk-local" },
                    };
                    const p = presets[e.target.value];
                    if (p) { setAuthBaseUrl(p.url); setAuthApiKey(p.hint === "sk-local" ? "sk-local" : ""); }
                  }}
                  style={{
                    padding: "8px 12px", borderRadius: 8, fontSize: 13,
                    background: "#111827", border: "1px solid #1E2535", color: "#e2e8f0", minWidth: 140,
                  }}
                >
                  <option value="gemini">Gemini (Google)</option>
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="ollama-lan">Ollama LAN</option>
                  <option value="ollama">Ollama Local</option>
                </select>
                <input
                  value={authBaseUrl}
                  onChange={(e) => setAuthBaseUrl(e.target.value)}
                  placeholder="Base URL"
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13,
                    background: "#111827", border: "1px solid #1E2535", color: "#e2e8f0",
                    outline: "none", fontFamily: "monospace",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={authApiKey}
                  onChange={(e) => setAuthApiKey(e.target.value)}
                  placeholder="API Key"
                  type="password"
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13,
                    background: "#111827", border: "1px solid #1E2535", color: "#e2e8f0",
                    outline: "none", fontFamily: "monospace",
                  }}
                />
                <ActionBtn label="Register Provider" icon={Shield} variant="primary"
                  loading={actionLoading === "register-provider"}
                  onClick={async () => {
                    if (!authApiKey.trim() || !authBaseUrl.trim()) return;
                    setActionLoading("register-provider");
                    try {
                      const res = await fetch("/api/openclaw/providers", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: authProvider, baseUrl: authBaseUrl, apiKey: authApiKey }),
                      });
                      const json = await res.json();
                      log("register-provider", `${authProvider}: ${json.data?.registered ? "registered" : json.error?.message ?? "failed"}`, res.ok);
                      if (res.ok) { setAuthApiKey(""); await fetchAll(); }
                    } catch (err) { log("register-provider", String(err), false); }
                    finally { setActionLoading(null); }
                  }} />
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* ═══ 5. Config Editor (Advanced) ═══ */}
      <Panel title="Config Editor (Advanced)" icon={Terminal} iconColor="#c084fc" defaultOpen={false}>
        <ConfigPanel
          loading={actionLoading}
          onGet={async (path) => {
            setActionLoading("config-get");
            try {
              const res = await fetch(`/api/openclaw/config?path=${encodeURIComponent(path)}`);
              const json = await res.json();
              const val = json.data?.value ?? json.data?.error ?? "No result";
              log("config get " + path, val, json.data?.exitCode === 0);
              return val;
            } catch (err) { return String(err); }
            finally { setActionLoading(null); }
          }}
          onSet={async (path, value) => {
            await doAction("config-set", "/api/openclaw/config", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path, value }),
            });
          }}
        />
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
