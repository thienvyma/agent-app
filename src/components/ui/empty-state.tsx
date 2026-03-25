/**
 * EmptyState — placeholder for when no data is available.
 *
 * Shows an icon, message, and optional action button.
 * Used on pages like /tasks (no tasks), /agents (no agents), etc.
 *
 * @module components/ui/empty-state
 */

import React from "react";

/** Empty state configuration */
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Empty state component with icon, title, description, and optional action.
 *
 * @param props - Empty state configuration
 * @returns Centered empty state illustration
 */
export function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps): React.ReactElement {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      padding: "4rem 2rem",
      textAlign: "center" as const,
    },
  },
    React.createElement("div", {
      style: {
        fontSize: "4rem",
        marginBottom: "1.5rem",
        filter: "grayscale(0.3)",
      },
    }, icon),
    React.createElement("h3", {
      style: {
        color: "var(--text-primary, #e0e0f0)",
        fontSize: "1.25rem",
        fontWeight: 600,
        marginBottom: "0.5rem",
      },
    }, title),
    description && React.createElement("p", {
      style: {
        color: "var(--text-secondary, #a0a0b8)",
        maxWidth: "320px",
        lineHeight: 1.5,
        marginBottom: actionLabel ? "1.5rem" : "0",
      },
    }, description),
    actionLabel && onAction && React.createElement("button", {
      onClick: onAction,
      style: {
        padding: "0.625rem 1.5rem",
        borderRadius: "8px",
        border: "none",
        background: "var(--accent-primary, #6366f1)",
        color: "#fff",
        fontWeight: 500,
        cursor: "pointer",
        transition: "opacity 0.2s",
      },
      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
        (e.target as HTMLButtonElement).style.opacity = "0.85";
      },
      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
        (e.target as HTMLButtonElement).style.opacity = "1";
      },
    }, actionLabel)
  );
}

/** Pre-configured empty states for common pages */
export const EMPTY_STATES = {
  agents: { icon: "🤖", title: "Chưa có Agent", description: "Tạo agent đầu tiên để bắt đầu." },
  tasks: { icon: "📋", title: "Chưa có Task", description: "Tất cả tasks đã hoàn thành hoặc chưa tạo." },
  messages: { icon: "💬", title: "Chưa có tin nhắn", description: "Gửi tin nhắn cho agent để bắt đầu." },
  approvals: { icon: "✅", title: "Không có yêu cầu duyệt", description: "Tất cả đã được xử lý." },
  knowledge: { icon: "📚", title: "Chưa có tri thức", description: "Thêm tài liệu vào knowledge base." },
} as const;
