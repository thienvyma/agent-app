/**
 * AgentCard — agent display card logic.
 *
 * Formats agent data for card rendering: token count, time ago, status.
 *
 * @module components/agent-card
 */

import { getStatusConfig, type StatusConfig } from "@/components/status-badge";

/** Raw agent data for card */
export interface AgentCardData {
  id: string;
  name: string;
  role: string;
  department: string;
  model: string;
  status: string;
  toolCount: number;
  tokensToday: number;
  lastActive: Date;
}

/** Formatted agent card for display */
export interface AgentCardDisplay {
  id: string;
  name: string;
  role: string;
  department: string;
  model: string;
  toolCount: number;
  formattedTokens: string;
  lastActiveText: string;
  statusConfig: StatusConfig;
  initials: string;
}

/**
 * Format a number with comma separators.
 *
 * @param n - Number to format
 * @returns Formatted string (e.g., "1,234")
 */
export function formatTokenCount(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Format a date as relative time ago.
 *
 * @param date - Date to format
 * @returns Human-readable time string (e.g., "5 min ago")
 */
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

/**
 * Format agent data for card display.
 *
 * @param data - Raw agent data
 * @returns Formatted display data
 */
export function formatAgentCard(data: AgentCardData): AgentCardDisplay {
  return {
    id: data.id,
    name: data.name,
    role: data.role,
    department: data.department,
    model: data.model,
    toolCount: data.toolCount,
    formattedTokens: formatTokenCount(data.tokensToday),
    lastActiveText: formatTimeAgo(data.lastActive),
    statusConfig: getStatusConfig(data.status),
    initials: data.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
  };
}
