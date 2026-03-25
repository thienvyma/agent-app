"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";

/** Correction entry from API */
interface CorrectionEntry {
  id: string;
  taskId: string;
  agentId: string;
  context: string;
  wrongOutput: string;
  correction: string;
  ruleExtracted: string;
  vectorId: string | null;
  createdAt: string;
  task?: { id: string; description: string } | null;
}

interface CorrectionListProps {
  corrections: CorrectionEntry[];
  loading: boolean;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

/**
 * Format time ago.
 */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Correction log list with expandable detail rows.
 */
export function CorrectionList({ corrections, loading, total, page, onPageChange }: CorrectionListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const totalPages = Math.ceil(total / 20);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (corrections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Lightbulb className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No corrections recorded</p>
        <p className="text-xs mt-1">Corrections appear when agents learn from mistakes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {corrections.map((c) => {
        const isOpen = expanded.has(c.id);
        return (
          <div key={c.id} className="rounded-xl bg-[#0B0F19] border border-[#1E2535] overflow-hidden">
            {/* Row header */}
            <button
              onClick={() => toggleExpand(c.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {c.task?.description?.slice(0, 50) ?? `Task ${c.taskId.slice(0, 8)}...`}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-gray-500">Agent: {c.agentId.slice(0, 8)}</span>
                  <span className="text-[10px] text-gray-600 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
              </div>
              {/* Rule badge */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-lg">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-medium">Rule Learned</span>
              </div>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="border-t border-[#1E2535] p-4 space-y-3">
                {/* Wrong output */}
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-medium text-red-400">Wrong Output</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{c.wrongOutput}</p>
                </div>

                {/* Correction */}
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">Correction</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{c.correction}</p>
                </div>

                {/* Rule extracted */}
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">Rule Extracted</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{c.ruleExtracted}</p>
                </div>

                {/* Context (if available) */}
                {c.context && (
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-[#1E2535]">
                    <span className="text-xs font-medium text-gray-500 mb-1.5 block">Context</span>
                    <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{c.context}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3">
          <span className="text-xs text-gray-500">Page {page} of {totalPages} · {total} corrections</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5"
            >
              ← Prev
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
