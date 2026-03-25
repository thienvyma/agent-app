/**
 * StatusBadge — agent status display logic.
 *
 * Maps agent status to color, label, CSS class, and animation.
 * Uses design tokens from globals.css (Phase 21).
 *
 * @module components/status-badge
 */

/** Valid agent statuses */
export const AGENT_STATUSES = [
  "IDLE",
  "RUNNING",
  "ERROR",
  "DEPLOYING",
  "PAUSED_BUDGET",
] as const;

export type AgentStatus = (typeof AGENT_STATUSES)[number];

/** Status display configuration */
export interface StatusConfig {
  label: string;
  cssClass: string;
  colorVar: string;
  animation: string | null;
}

/** Status → display config mapping */
const STATUS_MAP: Record<string, StatusConfig> = {
  IDLE: {
    label: "Idle",
    cssClass: "status-badge--idle",
    colorVar: "--status-idle",
    animation: null,
  },
  RUNNING: {
    label: "Running",
    cssClass: "status-badge--running",
    colorVar: "--status-running",
    animation: "pulse",
  },
  ERROR: {
    label: "Error",
    cssClass: "status-badge--error",
    colorVar: "--status-error",
    animation: null,
  },
  DEPLOYING: {
    label: "Deploying",
    cssClass: "status-badge--deploying",
    colorVar: "--status-deploying",
    animation: "spin",
  },
  PAUSED_BUDGET: {
    label: "Paused (Budget)",
    cssClass: "status-badge--paused",
    colorVar: "--status-paused",
    animation: null,
  },
};

/**
 * Get display configuration for an agent status.
 *
 * @param status - Agent status string
 * @returns StatusConfig with label, CSS class, color variable, and animation
 */
export function getStatusConfig(status: string): StatusConfig {
  return (
    STATUS_MAP[status] ?? {
      label: "Unknown",
      cssClass: "status-badge--idle",
      colorVar: "--status-idle",
      animation: null,
    }
  );
}
