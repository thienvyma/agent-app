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
  ShieldCheck,
  Link2,
} from "lucide-react";

/** Bot status from API */
interface TelegramStatus {
  running: boolean;
  configured: boolean;
  tokenPreview: string | null;
  channelInfo: string | null;
  pendingPairings: Array<{ code: string; sender: string; channel: string }>;
}

/**
 * Telegram Bot Configuration UI — integrated with OpenClaw channels.
 *
 * Flow:
 * 1. Enter bot token from @BotFather → "Save Token"
 * 2. Click "Start Bot" → channels add + gateway restart
 * 3. Send /start to bot on Telegram → receive pairing code
 * 4. Enter pairing code here → "Approve" → user paired
 */
export default function TelegramSettingsPage() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [pairingCode, setPairingCode] = useState("");
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

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

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
      addLog(
        `${action}: ${json.data?.message || json.data?.error || JSON.stringify(json.data).slice(0, 120)}`,
        ok
      );
      await fetchStatus();
      if (action === "configure" && ok) setToken("");
      if (action === "pair" && ok) setPairingCode("");
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
            Telegram Channel Status
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                status?.running
                  ? "bg-green-500/10 text-green-400"
                  : status?.configured
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-red-500/10 text-red-400"
              }`}
            >
              {status?.running ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {status?.running
                ? "Connected"
                : status?.configured
                  ? "Configured (Stopped)"
                  : "Not Configured"}
            </span>
            <button
              onClick={fetchStatus}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#0B0F19] rounded-lg border border-[#1E2535]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Token</p>
            <p className="text-sm text-gray-200 font-mono mt-1">
              {status?.tokenPreview ?? "—"}
            </p>
          </div>
          <div className="p-3 bg-[#0B0F19] rounded-lg border border-[#1E2535]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Pending Pairings
            </p>
            <p className="text-sm text-gray-200 mt-1">
              {status?.pendingPairings?.length ?? 0}
            </p>
          </div>
        </div>
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
            {actionLoading === "configure" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Key className="w-4 h-4" />
            )}
            Save Token
          </button>
        </div>
        <p className="text-[11px] text-gray-600 mt-2">
          Get a token from <span className="text-blue-400">@BotFather</span> on Telegram →
          /newbot → copy token
        </p>
      </div>

      {/* Bot Controls */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1E2535]">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Bot Controls
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => doAction("start")}
            disabled={actionLoading === "start"}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600/15 hover:bg-green-600/25 border border-green-500/30 text-green-400 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          >
            {actionLoading === "start" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Start Bot
          </button>
          <button
            onClick={() => doAction("stop")}
            disabled={actionLoading === "stop"}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          >
            {actionLoading === "stop" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Stop Bot
          </button>
        </div>
        <p className="text-[11px] text-gray-600 mt-2">
          Start adds Telegram channel to OpenClaw gateway. Stop removes it. Gateway restarts
          automatically.
        </p>
      </div>

      {/* Pairing Code Section */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1E2535]">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
          <Link2 className="w-4 h-4 text-violet-400" />
          Pairing Code
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          After starting the bot, send <span className="text-blue-400 font-mono">/start</span>{" "}
          to your bot on Telegram. You&apos;ll receive a pairing code. Enter it below to
          authorize.
        </p>

        <div className="flex gap-2">
          <input
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
            placeholder="Enter pairing code (e.g. ABCD1234)"
            maxLength={12}
            className="flex-1 px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm font-mono uppercase tracking-widest placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <button
            onClick={() =>
              pairingCode.trim() && doAction("pair", { code: pairingCode.trim() })
            }
            disabled={!pairingCode.trim() || actionLoading === "pair"}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-400 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          >
            {actionLoading === "pair" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Approve
          </button>
        </div>

        {/* Pending pairings list */}
        {status?.pendingPairings && status.pendingPairings.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Pending Requests
            </p>
            {status.pendingPairings.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-[#0B0F19] border border-violet-500/20 rounded-lg"
              >
                <div>
                  <span className="text-sm text-violet-300 font-mono">{p.code}</span>
                  <span className="text-xs text-gray-500 ml-3">from {p.sender}</span>
                </div>
                <button
                  onClick={() => doAction("pair", { code: p.code })}
                  disabled={actionLoading === "pair"}
                  className="px-3 py-1 bg-violet-500/15 text-violet-400 rounded-lg text-xs hover:bg-violet-500/25 transition-all"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => doAction("pairing-list")}
          disabled={actionLoading === "pairing-list"}
          className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {actionLoading === "pairing-list" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Refresh pairing list
        </button>
      </div>

      {/* Setup Guide */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-[#1E2535]">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Send className="w-4 h-4 text-blue-400" />
          Setup Guide
        </h3>
        <ol className="space-y-2 text-xs text-gray-400">
          <li className="flex gap-2">
            <span className="text-indigo-400 font-bold shrink-0">1.</span>
            Create bot via <span className="text-blue-400">@BotFather</span> → /newbot → copy
            token
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-400 font-bold shrink-0">2.</span>
            Paste token above → <span className="text-indigo-400">Save Token</span>
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-400 font-bold shrink-0">3.</span>
            Click <span className="text-green-400">Start Bot</span> → gateway restarts with
            Telegram channel
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-400 font-bold shrink-0">4.</span>
            Open Telegram → send <span className="font-mono text-blue-400">/start</span> to
            your bot → receive pairing code
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-400 font-bold shrink-0">5.</span>
            Enter code above → <span className="text-violet-400">Approve</span> → done!
          </li>
        </ol>
      </div>

      {/* Action Log */}
      {log.length > 0 && (
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1E2535]">
          <h3 className="text-sm font-semibold text-white mb-3">Action Log</h3>
          <div className="space-y-1.5 max-h-40 overflow-auto">
            {log.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-gray-600 shrink-0">{entry.time}</span>
                {entry.ok ? (
                  <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                )}
                <span className="text-gray-400">{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
