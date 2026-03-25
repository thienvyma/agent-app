"use client";

import { Activity, Zap, AlertTriangle, CheckCircle, Info, Clock } from "lucide-react";

/** Activity log entry */
interface ActivityEntry {
  id: string;
  event: string;
  data: unknown;
  source: string | null;
  createdAt: string;
}

interface ActivityTimelineProps {
  entries: ActivityEntry[];
}

/** Event type to icon/color mapping */
function getEventStyle(event: string): { icon: typeof Activity; color: string; bg: string } {
  const lower = event.toLowerCase();
  if (lower.includes("error") || lower.includes("fail")) {
    return { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" };
  }
  if (lower.includes("success") || lower.includes("complete")) {
    return { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" };
  }
  if (lower.includes("alert") || lower.includes("warning")) {
    return { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" };
  }
  if (lower.includes("start") || lower.includes("trigger")) {
    return { icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10" };
  }
  return { icon: Info, color: "text-indigo-400", bg: "bg-indigo-500/10" };
}

/**
 * Format time to HH:mm.
 */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Format date to short string.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Vertical activity timeline with color-coded event icons.
 */
export function ActivityTimeline({ entries }: ActivityTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Activity className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No activity recorded</p>
      </div>
    );
  }

  // Group by date
  const grouped = new Map<string, ActivityEntry[]>();
  for (const entry of entries) {
    const dateKey = formatDate(entry.createdAt);
    const arr = grouped.get(dateKey) ?? [];
    arr.push(entry);
    grouped.set(dateKey, arr);
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([date, dateEntries]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-[#1E2535]" />
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{date}</span>
            <div className="h-px flex-1 bg-[#1E2535]" />
          </div>
          <div className="relative ml-4">
            {/* Vertical line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-[#1E2535]" />

            {dateEntries.map((entry) => {
              const style = getEventStyle(entry.event);
              const Icon = style.icon;
              return (
                <div key={entry.id} className="relative flex items-start gap-4 mb-4 last:mb-0">
                  {/* Icon dot */}
                  <div className={`relative z-10 w-7 h-7 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0 ring-2 ring-[#0B0F19]`}>
                    <Icon className={`w-3.5 h-3.5 ${style.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${style.color}`}>{entry.event}</span>
                      {entry.source && (
                        <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">{entry.source}</span>
                      )}
                    </div>
                    {entry.data != null && typeof entry.data === "object" && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">
                        {String(JSON.stringify(entry.data)).slice(0, 120)}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-2.5 h-2.5 text-gray-600" />
                      <span className="text-[10px] text-gray-600">{formatTime(entry.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
