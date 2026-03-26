"use client";

/**
 * OnboardWizard — guided 6-step OpenClaw setup wizard.
 *
 * Steps: Check → Provider → Model → Gateway → Health → Complete
 * Pre-fills defaults from Huong_Dan_Ket_Noi_Qwen.md.
 *
 * @module components/settings/onboard-wizard
 */

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Search,
} from "lucide-react";

/** Step definition */
interface Step {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "error";
}

/** Props for OnboardWizard */
interface OnboardWizardProps {
  onComplete?: () => void;
}

/** Call onboard API */
async function callOnboard(
  step: string,
  params: Record<string, string> = {}
) {
  const res = await fetch("/api/openclaw/onboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, params }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Unknown error");
  return data.data;
}

export function OnboardWizard({ onComplete }: OnboardWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepResults, setStepResults] = useState<Record<string, unknown>>({});

  // Provider presets for quick cloud/local API setup
  const PROVIDER_PRESETS = [
    { label: "Gemini (Google AI)", name: "gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", apiKeyHint: "AIza...", defaultModel: "gemini-2.5-flash" },
    { label: "OpenAI", name: "openai", baseUrl: "https://api.openai.com/v1", apiKeyHint: "sk-...", defaultModel: "gpt-4o" },
    { label: "OpenRouter", name: "openrouter", baseUrl: "https://openrouter.ai/api/v1", apiKeyHint: "sk-or-...", defaultModel: "google/gemini-2.5-flash" },
    { label: "Ollama (Local)", name: "ollama", baseUrl: "http://localhost:11434/v1", apiKeyHint: "sk-local", defaultModel: "qwen2.5:7b" },
    { label: "Ollama (LAN)", name: "ollama-lan", baseUrl: "http://192.168.1.35:8080/v1", apiKeyHint: "sk-local", defaultModel: "Qwen3.5-35B-A3B-Coder" },
    { label: "Custom", name: "custom", baseUrl: "", apiKeyHint: "", defaultModel: "" },
  ];

  // Form state
  const [selectedPreset, setSelectedPreset] = useState("ollama-lan");
  const [providerName, setProviderName] = useState("ollama-lan");
  const [baseUrl, setBaseUrl] = useState("http://192.168.1.35:8080/v1");
  const [apiKey, setApiKey] = useState("sk-local");
  const [model, setModel] = useState("Qwen3.5-35B-A3B-Coder");
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  /** Apply preset values when user selects a provider */
  const applyPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = PROVIDER_PRESETS.find((p) => p.name === presetName);
    if (preset && preset.name !== "custom") {
      setProviderName(preset.name);
      setBaseUrl(preset.baseUrl);
      setApiKey(preset.apiKeyHint === "sk-local" ? "sk-local" : "");
      setModel(preset.defaultModel);
    }
  };

  const steps: Step[] = [
    { id: "check", label: "Check", status: currentStep > 0 ? "complete" : currentStep === 0 ? "active" : "pending" },
    { id: "provider", label: "Provider", status: currentStep > 1 ? "complete" : currentStep === 1 ? "active" : "pending" },
    { id: "model", label: "Model", status: currentStep > 2 ? "complete" : currentStep === 2 ? "active" : "pending" },
    { id: "gateway", label: "Gateway", status: currentStep > 3 ? "complete" : currentStep === 3 ? "active" : "pending" },
    { id: "health", label: "Health", status: currentStep > 4 ? "complete" : currentStep === 4 ? "active" : "pending" },
    { id: "complete", label: "Complete", status: currentStep === 5 ? "complete" : "pending" },
  ];

  const executeStep = async (stepId: string, params: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await callOnboard(stepId, params);
      setStepResults((prev) => ({ ...prev, [stepId]: result }));
      setCurrentStep((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    setLoading(true);
    try {
      const models = await callOnboard("models", { baseUrl });
      setAvailableModels(models as string[]);
      if (Array.isArray(models) && models.length > 0) {
        setModel(models[0] as string);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ──
  const containerStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    border: "1px solid #334155",
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
  };

  const stepIndicatorStyle = (s: Step): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    color: s.status === "complete" ? "#4ade80" : s.status === "active" ? "#60a5fa" : "#64748b",
    background: s.status === "active" ? "rgba(96,165,250,0.1)" : "transparent",
    border: s.status === "active" ? "1px solid rgba(96,165,250,0.3)" : "1px solid transparent",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 32,
  };

  const btnPrimary: React.CSSProperties = {
    padding: "10px 24px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 6,
    fontWeight: 500,
  };

  // ── Step Content ──
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Check installed
        return (
          <div>
            <p style={{ color: "#94a3b8", marginBottom: 16 }}>
              Kiểm tra OpenClaw CLI đã cài đặt chưa.
            </p>
            <button
              style={btnPrimary}
              onClick={() => executeStep("check")}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Check Installation
            </button>
          </div>
        );

      case 1: // Provider setup
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ color: "#94a3b8" }}>Chọn AI provider hoặc nhập thủ công.</p>
            <div>
              <label style={labelStyle}>Provider Preset</label>
              <select
                style={selectStyle}
                value={selectedPreset}
                onChange={(e) => applyPreset(e.target.value)}
              >
                {PROVIDER_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Provider Name</label>
              <input style={inputStyle} value={providerName} onChange={(e) => setProviderName(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Base URL</label>
              <input style={inputStyle} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>
                API Key
                {PROVIDER_PRESETS.find((p) => p.name === selectedPreset)?.apiKeyHint && (
                  <span style={{ color: "#64748b", fontWeight: 400 }}>
                    {" "}(format: {PROVIDER_PRESETS.find((p) => p.name === selectedPreset)?.apiKeyHint})
                  </span>
                )}
              </label>
              <input
                style={inputStyle}
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={PROVIDER_PRESETS.find((p) => p.name === selectedPreset)?.apiKeyHint ?? ""}
              />
            </div>
            <button
              style={btnPrimary}
              onClick={() => executeStep("provider", { name: providerName, baseUrl, apiKey })}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              Save Provider
            </button>
          </div>
        );

      case 2: // Model setup
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ color: "#94a3b8" }}>Chọn model AI để sử dụng.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} value={model} onChange={(e) => setModel(e.target.value)} />
              <button
                style={{ ...btnPrimary, background: "#1e293b", border: "1px solid #334155" }}
                onClick={fetchModels}
                disabled={loading}
              >
                {loading ? <Loader2 size={14} /> : <Search size={14} />}
                Fetch
              </button>
            </div>
            {availableModels.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {availableModels.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 6,
                      border: m === model ? "1px solid #3b82f6" : "1px solid #334155",
                      background: m === model ? "rgba(59,130,246,0.1)" : "#0f172a",
                      color: m === model ? "#60a5fa" : "#94a3b8",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            <button
              style={btnPrimary}
              onClick={() => executeStep("model", { provider: providerName, model })}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              Set Model
            </button>
          </div>
        );

      case 3: // Gateway
        return (
          <div>
            <p style={{ color: "#94a3b8", marginBottom: 16 }}>
              Khởi động OpenClaw Gateway (port 18789).
            </p>
            <button
              style={btnPrimary}
              onClick={() => executeStep("gateway", { port: "18789" })}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
              Start Gateway
            </button>
          </div>
        );

      case 4: // Health
        return (
          <div>
            <p style={{ color: "#94a3b8", marginBottom: 16 }}>
              Kiểm tra kết nối tới Gateway và Model.
            </p>
            <button
              style={btnPrimary}
              onClick={() => executeStep("health")}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Verify Health
            </button>
          </div>
        );

      case 5: // Complete
        return (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h3 style={{ color: "#4ade80", fontSize: 20, marginBottom: 8 }}>
              Setup Complete!
            </h3>
            <p style={{ color: "#94a3b8", marginBottom: 24 }}>
              OpenClaw đã sẵn sàng. Model: <strong style={{ color: "#60a5fa" }}>{model}</strong>
            </p>
            <button
              style={btnPrimary}
              onClick={onComplete}
            >
              <CheckCircle2 size={16} />
              Go to Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={containerStyle} id="onboard-wizard">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700, margin: 0 }}>
          🦞 OpenClaw Setup Wizard
        </h2>
        <button
          onClick={onComplete}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: 13,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          I&apos;ve already configured OpenClaw
        </button>
      </div>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {steps.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
            <div style={stepIndicatorStyle(s)}>
              {s.status === "complete" ? (
                <CheckCircle2 size={14} />
              ) : s.status === "active" ? (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa" }} />
              ) : (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#334155" }} />
              )}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={14} style={{ color: "#334155", margin: "0 2px" }} />
            )}
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          padding: "10px 16px",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 8,
          color: "#f87171",
          fontSize: 13,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <XCircle size={16} />
          {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 12 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step content */}
      <div style={{ minHeight: 120 }}>
        {renderStepContent()}
      </div>

      {/* Back button */}
      {currentStep > 0 && currentStep < 5 && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => { setCurrentStep((p) => p - 1); setError(null); }}
            style={{
              background: "none",
              border: "1px solid #334155",
              borderRadius: 8,
              color: "#94a3b8",
              padding: "8px 16px",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ChevronLeft size={14} />
            Back
          </button>
        </div>
      )}
    </div>
  );
}
