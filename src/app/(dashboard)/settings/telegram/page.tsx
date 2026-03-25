"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send,
  Play,
  Square,
  Key,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Terminal,
  Bot,
  RefreshCw,
} from "lucide-react";

/** Bot status from API */
interface TelegramStatus {
  running: boolean;
  configured: boolean;
  tokenPreview: string | null;
  startedAt: string | null;
  lastError: string | null;
  commands: string[];
  envVar: string;
}

/**
 * Telegram Bot Configuration UI.
 * Manages bot token, start/stop, status monitoring.
 */
export default function TelegramSettingsPage() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [log, setLog] = useState<Array<{ time: string; msg: string; ok: boolean }>>([]);

  const addLog = useCallback((msg: string, ok: boolean) => {
    setLog((prev) => [{ time: new Date().toLocaleTimeString(), msg, ok }, ...prev.slice(0, 14)]);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram");
      const json = await res.json();
      setStatus(json.data ?? null);
    } catch (err) {
      console.error("[Telegram] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function doAction(action: string, extra?: Record<string, string>) {
    setActionLoading(action);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      const ok = res.ok && json.data?.success !== false;
      addLog(`${action}: ${json.data?.message || json.data?.error || JSON.stringify(json.data).slice(0, 100)}`, ok);
      await fetchStatus();
      if (action === "configure" && ok) setToken("");
    } catch (err) {
      addLog(`${action}: ${err}`, false);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status Card */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1E2535]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-400" />
            Telegram Bot Status
          </h3>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              status?.running
                ? "bg-green-500/10 text-green-400"
                : status?.configured
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-red-500/10 text-red-400"
            }`}>
              {status?.running ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {status?.running ? "Running" : status?.configured ? "Stopped" : "Not Configured"}
            </span>
            <button onClick={fetchStatus} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-[#0B0F19] rounded-lg border border-[#1E2535]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Token</p>
            <p className="text-sm text-gray-200 font-mono mt-1">{status?.tokenPreview ?? "—"}</p>
          </div>
          <div className="p-3 bg-[#0B0F19] rounded-lg border border-[#1E2535]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Started</p>
            <p className="text-sm text-gray-200 mt-1">
              {status?.startedAt ? new Date(status.startedAt).toLocaleTimeString() : "—"}
            </p>
          </div>
          <div className="p-3 bg-[#0B0F19] rounded-lg border border-[#1E2535]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Env Var</p>
            <p className="text-sm text-gray-200 font-mono mt-1">{status?.envVar ?? "—"}</p>
          </div>
          <div className="p-3 bg-[#0B0F19] rounded-lg border border-[#1E2535]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Commands</p>
            <p className="text-sm text-gray-200 mt-1">{status?.commands?.length ?? 0} registered</p>
          </div>
        </div>

        {status?.lastError && (
          <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-300">{status.lastError}</p>
          </div>
        )}
      </div>

      {/* Token Config */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1E2535]">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-amber-400" />
          Bot Token
        </h3>
        <div className="flex gap-2">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your Telegram Bot Token from @BotFather"
            type="password"
            className="flex-1 px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={() => token.trim() && doAction("configure", { token: token.trim() })}
            disabled={!token.trim() || actionLoading === "configure"}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          >
            {actionLoading === "configure" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Save Token
          </button>
        </div>
        <p className="text-[11px] text-gray-600 mt-2">
          Get a token from <span className="text-blue-400">@BotFather</span> on Telegram → /newbot → copy token
        </p>
      </div>

      {/* Controls */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1E2535]">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Bot Controls
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => doAction("start")}
            disabled={actionLoading === "start" || !status?.configured}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600/15 hover:bg-green-600/25 border border-green-500/30 text-green-400 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          >
            {actionLoading === "start" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start Bot
          </button>
          <button
            onClick={() => doAction("stop")}
            disabled={actionLoading === "stop" || !status?.running}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          >
            {actionLoading === "stop" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
            Stop Bot
          </button>
        </div>
      </div>

      {/* Commands list */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1E2535]">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Send className="w-4 h-4 text-blue-400" />
          Registered Commands ({status?.commands?.length ?? 0})
        </h3>
        <div className="flex flex-wrap gap-2">
          {status?.commands?.map((cmd) => (
            <span key={cmd} className="px-3 py-1.5 bg-[#0B0F19] border border-[#1E2535] rounded-lg text-xs text-gray-300 font-mono">
              {cmd}
            </span>
          ))}
        </div>
      </div>

      {/* Action Log */}
      {log.length > 0 && (
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1E2535]">
          <h3 className="text-sm font-semibold text-white mb-3">Action Log</h3>
          <div className="space-y-1.5 max-h-40 overflow-auto">
            {log.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-gray-600 shrink-0">{entry.time}</span>
                {entry.ok
                  ? <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                  : <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />}
                <span className="text-gray-400">{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
