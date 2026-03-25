/**
 * NotificationBell — header bell icon with unread count + dropdown.
 *
 * Shows recent realtime events as notifications.
 * Unread badge with count (max display: 9+).
 * Dropdown lists notifications sorted newest first.
 *
 * @module components/ui/notification-bell
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Zap, AlertTriangle, CheckCircle, Clock } from "lucide-react";

/** Notification item */
export interface Notification {
  id: string;
  event: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

/**
 * Count unread notifications.
 */
export function countUnread(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}

/**
 * Format timestamp to relative time string.
 */
export function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Sort notifications newest first.
 */
export function sortNotifications(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => b.timestamp - a.timestamp);
}

/** Get icon for event category */
function getEventIcon(event: string) {
  if (event.startsWith("agent:")) return Zap;
  if (event.startsWith("task:completed")) return CheckCircle;
  if (event.startsWith("task:failed") || event.startsWith("cost:")) return AlertTriangle;
  if (event.startsWith("approval:")) return Clock;
  return Bell;
}

/** Get color for event category */
function getEventColor(event: string): string {
  if (event.startsWith("agent:")) return "text-indigo-400";
  if (event.includes("completed") || event.includes("success")) return "text-emerald-400";
  if (event.includes("failed") || event.includes("error")) return "text-red-400";
  if (event.includes("warning") || event.includes("approval")) return "text-amber-400";
  return "text-gray-400";
}

interface NotificationBellProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

/**
 * Notification bell with dropdown for header.
 */
export function NotificationBell({ notifications, onMarkRead, onMarkAllRead }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = countUnread(notifications);
  const sorted = sortNotifications(notifications).slice(0, 20);
  const displayCount = unread > 9 ? "9+" : String(unread);

  /** Close on click outside */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {displayCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-[380px] bg-[#111827] border border-[#1E2535] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1E2535]">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              sorted.map((notif) => {
                const Icon = getEventIcon(notif.event);
                const color = getEventColor(notif.event);
                return (
                  <button
                    key={notif.id}
                    onClick={() => onMarkRead(notif.id)}
                    className={`w-full flex items-start gap-3 p-3 hover:bg-white/[0.03] transition-colors text-left border-b border-[#1E2535]/50 ${
                      !notif.read ? "bg-indigo-500/[0.03]" : ""
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-medium ${notif.read ? "text-gray-400" : "text-white"}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{formatTimestamp(notif.timestamp)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
