"use client";

import { useState, useEffect, useCallback } from "react";
import { ActivityTimeline } from "./components/activity-timeline";
import { ActivityTable } from "./components/activity-table";
import {
  Activity,
  Loader2,
  LayoutList,
  Clock,
  Filter,
  Zap,
} from "lucide-react";

/** Activity entry from API */
interface ActivityEntry {
  id: string;
  event: string;
  data: unknown;
  source: string | null;
  createdAt: string;
}

/**
 * Activity dashboard with timeline ↔ table toggle.
 */
export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"timeline" | "table">("timeline");
  const [eventFilter, setEventFilter] = useState("");

  /** Fetch activity logs */
  const fetchActivity = useCallback(async (pg: number) => {
    try {
      const params = new URLSearchParams({
        days: "30",
        page: String(pg),
        limit: "20",
      });
      if (eventFilter) params.set("event", eventFilter);
      const res = await fetch(`/api/activity?${params}`);
      const json = await res.json();
      setEntries(json.data ?? []);
      setTotal(json.pagination?.total ?? 0);
      setPage(pg);
    } catch (err) {
      console.error("[ActivityPage] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [eventFilter]);

  useEffect(() => {
    fetchActivity(1);
  }, [fetchActivity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-purple-400" />
            Activity
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            System events and agent activity log
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Event Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <input
              placeholder="Filter events..."
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="pl-8 pr-4 py-2 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-300 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex bg-[#0B0F19] rounded-xl border border-[#1E2535] overflow-hidden">
            <button
              onClick={() => setView("timeline")}
              className={`px-3 py-2 text-xs font-medium transition-all ${
                view === "timeline" ? "bg-indigo-500/20 text-indigo-400" : "text-gray-500 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-3 py-2 text-xs font-medium transition-all ${
                view === "table" ? "bg-indigo-500/20 text-indigo-400" : "text-gray-500 hover:text-white"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535]">
          <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3">
            <Activity className="w-4.5 h-4.5 text-purple-400" />
          </div>
          <p className="text-xs text-gray-500">Total Events</p>
          <p className="text-lg font-bold text-purple-400">{total}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535]">
          <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
            <Zap className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <p className="text-xs text-gray-500">Event Types</p>
          <p className="text-lg font-bold text-blue-400">{new Set(entries.map((e) => e.event)).size}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535]">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3">
            <Clock className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <p className="text-xs text-gray-500">Sources</p>
          <p className="text-lg font-bold text-emerald-400">{new Set(entries.filter((e) => e.source).map((e) => e.source)).size}</p>
        </div>
      </div>

      {/* View */}
      {view === "timeline" ? (
        <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
          <ActivityTimeline entries={entries} />
        </div>
      ) : (
        <ActivityTable
          entries={entries}
          total={total}
          page={page}
          limit={20}
          onPageChange={fetchActivity}
        />
      )}
    </div>
  );
}