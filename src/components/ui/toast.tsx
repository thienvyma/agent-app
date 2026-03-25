/**
 * Toast notification component for realtime events.
 *
 * Renders floating toast notifications in the top-right corner.
 * Supports severity levels: info, success, warning, error.
 * Auto-dismisses after configurable duration.
 *
 * @module components/ui/toast
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

/** Toast severity levels */
export type ToastSeverity = "info" | "success" | "warning" | "error";

/** Toast configuration */
export interface ToastConfig {
  id: string;
  title: string;
  message: string;
  severity: ToastSeverity;
  /** Duration in ms (0 = no auto-dismiss) */
  duration: number;
  dismissible: boolean;
}

/**
 * Map a realtime event to a toast config.
 *
 * @param event - Event name
 * @param data - Event payload
 * @returns Toast configuration
 */
export function eventToToast(event: string, data: Record<string, unknown>): ToastConfig {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const base = { id, dismissible: true, duration: 5000 };

  if (event === "agent:deployed") {
    return { ...base, title: "Agent Deployed", message: `${data.name ?? "Agent"} is now active`, severity: "success" };
  }
  if (event === "agent:undeployed") {
    return { ...base, title: "Agent Stopped", message: `${data.name ?? "Agent"} has been stopped`, severity: "info" };
  }
  if (event === "task:completed") {
    return { ...base, title: "Task Completed", message: "Task finished successfully", severity: "success" };
  }
  if (event === "task:failed") {
    return { ...base, title: "Task Failed", message: `${data.error ?? "Unknown error"}`, severity: "error", duration: 8000 };
  }
  if (event === "cost:warning") {
    return { ...base, title: "Budget Warning", message: `${data.percentUsed ?? 0}% of budget used`, severity: "warning", duration: 10000 };
  }
  if (event === "approval:pending") {
    return { ...base, title: "Approval Required", message: `${data.reason ?? "Action needs approval"}`, severity: "warning", duration: 0 };
  }
  return { ...base, title: "System Event", message: event, severity: "info" };
}

/** Severity → icon + color mapping */
const SEVERITY_CONFIG: Record<ToastSeverity, { icon: typeof Info; bg: string; border: string; text: string }> = {
  info:    { icon: Info,          bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400" },
  success: { icon: CheckCircle,   bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
  warning: { icon: AlertTriangle, bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400" },
  error:   { icon: AlertCircle,   bg: "bg-red-500/10",     border: "border-red-500/20",     text: "text-red-400" },
};

interface ToastItemProps {
  toast: ToastConfig;
  onDismiss: (id: string) => void;
}

/**
 * Single toast item with auto-dismiss and animation.
 */
function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  const config = SEVERITY_CONFIG[toast.severity];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg} ${config.border} backdrop-blur-sm shadow-xl animate-slide-in-right min-w-[320px] max-w-[420px]`}>
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.text}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{toast.message}</p>
      </div>
      {toast.dismissible && (
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Toast container — renders stack of toast notifications.
 *
 * @param toasts - Array of active toasts
 * @param onDismiss - Callback when toast is dismissed
 */
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastConfig[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * Hook to manage toast state.
 *
 * @param maxToasts - Maximum simultaneous toasts (default: 5)
 * @returns addToast, dismissToast, toasts, ToastContainer
 */
export function useToasts(maxToasts: number = 5) {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  /** Add a toast */
  const addToast = useCallback(
    (config: ToastConfig) => {
      setToasts((prev) => [...prev.slice(-(maxToasts - 1)), config]);
    },
    [maxToasts]
  );

  /** Dismiss a toast by ID */
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
