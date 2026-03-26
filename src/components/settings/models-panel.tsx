"use client";

/**
 * ModelsPanel — extracted Model Management panel for OpenClaw Settings.
 *
 * Features: models table, current model badge, test model,
 * fetch models from provider, set primary model.
 *
 * @module components/settings/models-panel
 */

import { useState } from "react";
import {
  Cpu,
  Search,
  CheckCircle2,
  Loader2,
  Zap,
} from "lucide-react";

interface ModelInfo {
  name: string;
  input: string;
  context: string;
  local: boolean;
  auth: boolean;
  tags: string;
}

interface ModelsPanelProps {
  models: ModelInfo[];
  currentModel: string;
  onSetModel: (model: string) => void;
  onTestModel: () => void;
  onFetchModels: () => void;
  testResult: string | null;
  fetchedModels: string[];
  loading: string | null;
}

export function ModelsPanel({
  models,
  currentModel,
  onSetModel,
  onTestModel,
  onFetchModels,
  testResult,
  fetchedModels,
  loading,
}: ModelsPanelProps) {
  const [modelInput, setModelInput] = useState("");

  const thStyle: React.CSSProperties = {
    padding: "8px 12px",
    textAlign: "left",
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #1E2535",
  };

  const tdStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 13,
    color: "#e2e8f0",
    borderBottom: "1px solid #0f172a",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 }}>
      {/* Current model badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Cpu size={14} style={{ color: "#3b82f6" }} />
        <span style={{ fontSize: 13, color: "#94a3b8" }}>Current:</span>
        <span style={{
          padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: "rgba(59,130,246,0.1)", color: "#60a5fa",
          border: "1px solid rgba(59,130,246,0.2)",
        }}>
          {currentModel || "Not set"}
        </span>
      </div>

      {/* Models table */}
      {models.length > 0 && (
        <div style={{ borderRadius: 10, border: "1px solid #1E2535", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#0B0F19" }}>
            <thead>
              <tr>
                <th style={thStyle}>Model</th>
                <th style={thStyle}>Input</th>
                <th style={thStyle}>Context</th>
                <th style={thStyle}>Local</th>
                <th style={thStyle}>Auth</th>
                <th style={thStyle}>Tags</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.name}>
                  <td style={{ ...tdStyle, fontWeight: 600, fontFamily: "monospace" }}>{m.name}</td>
                  <td style={tdStyle}>{m.input}</td>
                  <td style={tdStyle}>{m.context}</td>
                  <td style={tdStyle}>{m.local ? "✅" : "❌"}</td>
                  <td style={tdStyle}>{m.auth ? "✅" : "❌"}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4, fontSize: 11,
                      background: "rgba(99,102,241,0.1)", color: "#818cf8",
                    }}>
                      {m.tags}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Test model + Fetch models */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={onTestModel}
          disabled={loading === "test-model"}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8,
            background: "#1E3A5F", color: "#60a5fa", border: "1px solid #2563eb",
            fontSize: 13, fontWeight: 500, cursor: loading === "test-model" ? "not-allowed" : "pointer",
          }}
        >
          {loading === "test-model" ? <Loader2 size={14} /> : <Zap size={14} />}
          Test Model
        </button>
        <button
          onClick={onFetchModels}
          disabled={loading === "fetch-models"}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8,
            background: "#1E2535", color: "#e2e8f0", border: "1px solid #2A303C",
            fontSize: 13, fontWeight: 500, cursor: loading === "fetch-models" ? "not-allowed" : "pointer",
          }}
        >
          {loading === "fetch-models" ? <Loader2 size={14} /> : <Search size={14} />}
          Fetch Models
        </button>
      </div>

      {/* Test result */}
      {testResult && (
        <div style={{
          padding: 12, borderRadius: 8,
          background: "#0B0F19", border: "1px solid #1E2535",
          fontSize: 13, color: "#94a3b8", whiteSpace: "pre-wrap",
        }}>
          {testResult}
        </div>
      )}

      {/* Fetched models dropdown */}
      {fetchedModels.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {fetchedModels.map((m) => (
            <button
              key={m}
              onClick={() => setModelInput(m)}
              style={{
                padding: "4px 10px", borderRadius: 6, fontSize: 12,
                border: "1px solid #334155", background: "#0f172a",
                color: "#94a3b8", cursor: "pointer",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Set primary model */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={modelInput}
          onChange={(e) => setModelInput(e.target.value)}
          placeholder="Set model (e.g. ollama-lan/Qwen3.5-35B-A3B-Coder)"
          style={{
            flex: 1, padding: "8px 12px",
            background: "#0B0F19", border: "1px solid #1E2535",
            borderRadius: 8, color: "#e2e8f0", fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={() => { if (modelInput) onSetModel(modelInput); }}
          style={{
            padding: "8px 16px", borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <CheckCircle2 size={14} style={{ marginRight: 4 }} />
          Save
        </button>
      </div>
    </div>
  );
}
