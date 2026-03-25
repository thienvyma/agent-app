"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Filter,
} from "lucide-react";

/** Approval from API */
interface Approval {
  id: string;
  taskId: string;
  status: string;
  policy: string;
  reason: string;
  ownerResponse: string | null;
  createdAt: string;
  resolvedAt: string | null;
  task: {
    id: string;
    description: string;
    assignedToId: string | null;
    result: string | null;
  };
}

/** Status tab config */
const TABS = [
  { id: "", label: "Pending", icon: Clock, color: "text-amber-400" },
  { id: "APPROVED", label: "Approved", icon: CheckCircle2, color: "text-green-400" },
  { id: "REJECTED", label: "Rejected", icon: XCircle, color: "text-red-400" },
  { id: "MODIFIED", label: "Modified", icon: MessageSquare, color: "text-blue-400" },
] as const;

/**
 * Approvals Queue page.
 *
 * Lists approval requests with approve/reject actions.
 * Tabs: Pending | Approved | Rejected | Modified.
 */
export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  /** Fetch approvals */
  const fetchApprovals = useCallback(async () => {
    try {
      const statusParam = tab ? `&status=${tab}` : "";
      const res = await fetch(`/api/approvals?limit=100${statusParam}`);
      const json = await res.json();
      setApprovals(json.data || []);
    } catch (err) {
      console.error("[ApprovalsPage] Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    fetchApprovals();
  }, [fetchApprovals]);

  /** Approve an item */
  async function handleApprove(id: string) {
    setProcessingId(id);
    try {
      await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      await fetchApprovals();
    } catch (err) {
      console.error("[ApprovalsPage] Approve failed:", err);
    } finally {
      setProcessingId(null);
    }
  }

  /** Reject an item */
  async function handleReject(id: string) {
    const feedback = rejectFeedback[id];
    if (!feedback?.trim()) return;
    setProcessingId(id);
    try {
      await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reject", feedback }),
      });
      setShowRejectInput(null);
      setRejectFeedback((prev) => ({ ...prev, [id]: "" }));
      await fetchApprovals();
    } catch (err) {
      console.error("[ApprovalsPage] Reject failed:", err);
    } finally {
      setProcessingId(null);
    }
  }

  /** Time ago helper */
  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-amber-400" />
            Approval Queue
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review and approve agent actions that require human oversight
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500">{approvals.length} items</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#111827] rounded-xl border border-[#1E2535] w-fit">
        {TABS.map((t) => {
          const TabIcon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-[#1E2535] text-white font-medium"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isActive ? t.color : ""}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Approvals List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#111827] border border-[#1E2535] text-center">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No {tab ? tab.toLowerCase() : "pending"} approvals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-[#111827] border border-[#1E2535] hover:border-[#2A303C] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium mb-1.5 line-clamp-2">
                    {item.task.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      {item.policy}
                    </span>
                    <span>•</span>
                    <span>{item.reason}</span>
                    <span>•</span>
                    <span>{timeAgo(item.createdAt)}</span>
                  </div>

                  {/* Owner response for resolved items */}
                  {item.ownerResponse && (
                    <div className="mt-2 p-2.5 rounded-lg bg-[#0B0F19] border border-[#1E2535] text-xs text-gray-400">
                      <span className="text-gray-500 font-medium">Response: </span>
                      {item.ownerResponse}
                    </div>
                  )}

                  {/* Reject feedback input */}
                  {showRejectInput === item.id && (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={rejectFeedback[item.id] ?? ""}
                        onChange={(e) => setRejectFeedback((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Reason for rejection (required)..."
                        className="flex-1 px-3 py-2 bg-[#0B0F19] border border-[#1E2535] rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={!rejectFeedback[item.id]?.trim() || processingId === item.id}
                        className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm text-white font-medium disabled:opacity-50 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowRejectInput(null)}
                        className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Action buttons (only for pending) */}
                {item.status === "PENDING" && showRejectInput !== item.id && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={processingId === item.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {processingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectInput(item.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}

                {/* Status badge for resolved */}
                {item.status !== "PENDING" && (
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                    item.status === "APPROVED" ? "text-green-400 bg-green-500/10" :
                    item.status === "REJECTED" ? "text-red-400 bg-red-500/10" :
                    "text-blue-400 bg-blue-500/10"
                  }`}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}