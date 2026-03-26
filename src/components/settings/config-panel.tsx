"use client";

/**
 * ConfigPanel — extracted Config Editor panel for OpenClaw Settings.
 *
 * Features: common config quick-access buttons, get/set any config path,
 * result display.
 *
 * @module components/settings/config-panel
 */

import { useState } from "react";
import {
  ChevronRight,
  CheckCircle2,
  Loader2,
  Settings,
} from "lucide-react";

/** Common config shortcuts */
const COMMON_CONFIGS = [
  { label: "Primary Model", path: "agents.defaults.model.primary" },
  { label: "Gateway Port", path: "gateway.port" },
  { label: "Gateway Auth Token", path: "gateway.auth.token" },
  { label: "Default Agent", path: "agents.defaults.name" },
] as const;

interface ConfigPanelProps {
  onGet: (path: string) => Promise<string>;
  onSet: (path: string, value: string) => Promise<void>;
  loading: string | null;
}

export function ConfigPanel({ onGet, onSet, loading }: ConfigPanelProps) {
  const [configPath, setConfigPath] = useState("");
  const [configValue, setConfigValue] = useState("");
  const [configResult, setConfigResult] = useState("");
  const [quickResults, setQuickResults] = useState<Record<string, string>>({});

  const handleGet = async (path: string) => {
    const result = await onGet(path);
    setConfigResult(result);
    setQuickResults((prev) => ({ ...prev, [path]: result }));
  };

  const handleSet = async (path: string, value: string) => {
    await onSet(path, value);
    setConfigResult(`Set ${path} = ${value}`);
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13,
    background: "#0B0F19", border: "1px solid #1E2535", color: "#e2e8f0",
    outline: "none", fontFamily: "monospace",
  };

  const btnStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 14px", borderRadius: 8,
    background: "#1E2535", color: "#e2e8f0", border: "1px solid #2A303C",
    fontSize: 13, fontWeight: 500, cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 16 }}>
      {/* Common configs */}
      <div>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", fontWeight: 600 }}>
          Quick Access
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {COMMON_CONFIGS.map((cfg) => (
            <div key={cfg.path} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", background: "#0B0F19",
              borderRadius: 8, border: "1px solid #1E2535",
            }}>
              <Settings size={12} style={{ color: "#818cf8", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 120 }}>{cfg.label}</span>
              <code style={{ fontSize: 12, color: "#64748b", flex: 1 }}>{cfg.path}</code>
              {quickResults[cfg.path] && (
                <span style={{
                  fontSize: 12, color: "#4ade80",
                  fontFamily: "monospace", maxWidth: 200,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {quickResults[cfg.path]}
                </span>
              )}
              <button
                onClick={() => handleGet(cfg.path)}
                style={{ ...btnStyle, padding: "4px 10px", fontSize: 11 }}
              >
                Get
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Raw get/set */}
      <div>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px" }}>
          Read/write any config path via <code style={{ color: "#818cf8" }}>openclaw config get/set</code>
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={configPath}
            onChange={(e) => setConfigPath(e.target.value)}
            placeholder="Config path (e.g. gateway.auth.mode)"
            style={inputStyle}
          />
          <button
            onClick={() => { if (configPath.trim()) handleGet(configPath); }}
            disabled={loading === "config-get"}
            style={btnStyle}
          >
            {loading === "config-get" ? <Loader2 size={14} /> : <ChevronRight size={14} />}
            Get
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={configValue}
            onChange={(e) => setConfigValue(e.target.value)}
            placeholder="Value to set"
            style={inputStyle}
          />
          <button
            onClick={() => {
              if (configPath.trim() && configValue.trim()) {
                handleSet(configPath, configValue);
              }
            }}
            disabled={loading === "config-set"}
            style={{ ...btnStyle, background: "#1E3A5F", color: "#60a5fa", border: "1px solid #2563eb" }}
          >
            {loading === "config-set" ? <Loader2 size={14} /> : <CheckCircle2 size={14} />}
            Set
          </button>
        </div>
      </div>

      {/* Result */}
      {configResult && (
        <div style={{
          padding: 12, background: "#0B0F19", borderRadius: 10,
          border: "1px solid #1E2535",
        }}>
          <pre style={{ color: "#94a3b8", margin: 0, fontSize: 13, whiteSpace: "pre-wrap" }}>
            {configResult}
          </pre>
        </div>
      )}
    </div>
  );
}
