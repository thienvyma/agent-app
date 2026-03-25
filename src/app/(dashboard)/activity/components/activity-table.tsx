"use client";

import { Download, Clock, Zap } from "lucide-react";

/** Activity log entry */
interface ActivityEntry {
  id: string;
  event: string;
  data: unknown;
  source: string | null;
  createdAt: string;
}

interface ActivityTableProps {
  entries: ActivityEntry[];
  total: number;
  page: number;
  limit: number;
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
 * Paginated activity table with CSV export.
 */
export function ActivityTable({ entries, total, page, limit, onPageChange }: ActivityTableProps) {
  const totalPages = Math.ceil(total / limit);

  /** Export CSV */
  function exportCSV() {
    const headers = "Event,Source,Data,Date\n";
    const rows = entries.map((e) =>
      `"${e.event}","${e.source ?? ""}","${JSON.stringify(e.data ?? {}).replace(/"/g, '""')}","${new Date(e.createdAt).toISOString()}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Activity Log</h3>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/5 transition-all"
        >
          <Download className="w-3 h-3" />
          CSV
        </button>
      </div>

      {/* Table */}
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 italic py-8 text-center">No activity entries found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2535]">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-[#1E2535]/50 hover:bg-[#0B0F19]/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-indigo-400" />
                      <span className="text-gray-300 font-medium">{entry.event}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                      {entry.source ?? "system"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs max-w-[300px] truncate">
                    {entry.data ? JSON.stringify(entry.data).slice(0, 80) : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-500 text-xs">{timeAgo(entry.createdAt)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1E2535]">
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages} · {total} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5 transition-all"
            >
              ← Prev
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5 transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
