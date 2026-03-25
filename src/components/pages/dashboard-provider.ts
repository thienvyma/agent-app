/**
 * DashboardProvider — data logic for the Home/Overview page.
 *
 * Generates stat cards, activity timeline items, and budget alerts.
 *
 * @module components/pages/dashboard-provider
 */

import { formatTimeAgo } from "@/components/agent-card";

/** Dashboard summary data (from API aggregation) */
interface DashboardData {
  agentsTotal: number;
  agentsActive: number;
  tasksRunning: number;
  tasksTotal: number;
  pendingApprovals: number;
  tokensToday: number;
}

/** Stat card for dashboard */
export interface StatCard {
  label: string;
  value: string;
  icon: string;
  highlight: boolean;
}

/** Activity timeline item */
export interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  timeText: string;
}

/** Budget alert */
export interface BudgetAlert {
  agentId: string;
  name: string;
  percent: number;
  exceeded: boolean;
}

/** Audit entry input */
interface AuditEntry {
  id: string;
  action: string;
  agentName: string;
  timestamp: Date;
  details?: string;
}

/** Agent budget data */
interface AgentBudget {
  agentId: string;
  name: string;
  usage: number;
  budget: number;
}

/**
 * Generate 4 stat cards for dashboard overview.
 *
 * @param data - Aggregated dashboard data
 * @returns Array of 4 stat cards
 */
export function generateStatCards(data: DashboardData): StatCard[] {
  return [
    {
      label: "Agents",
      value: `${data.agentsActive}/${data.agentsTotal} Active`,
      icon: "Users",
      highlight: false,
    },
    {
      label: "Tasks",
      value: `${data.tasksRunning} Running / ${data.tasksTotal} Total`,
      icon: "ListTodo",
      highlight: false,
    },
    {
      label: "Approvals",
      value: `${data.pendingApprovals} Pending`,
      icon: "Clock",
      highlight: data.pendingApprovals > 0,
    },
    {
      label: "Cost",
      value: `${data.tokensToday.toLocaleString("en-US")} tokens`,
      icon: "DollarSign",
      highlight: false,
    },
  ];
}

/** Action → icon mapping */
const ACTION_ICONS: Record<string, string> = {
  "agent:deployed": "🚀",
  "agent:undeployed": "⏹️",
  "task:completed": "✅",
  "task:failed": "❌",
  "approval:pending": "⏳",
  "approval:resolved": "✔️",
  "cost:warning": "⚠️",
  "cost:paused": "🚨",
};

/**
 * Format an audit entry into an activity timeline item.
 *
 * @param entry - Audit log entry
 * @returns Formatted activity item
 */
export function formatActivityItem(entry: AuditEntry): ActivityItem {
  const icon = ACTION_ICONS[entry.action] ?? "📋";
  const actionText = entry.action.replace(":", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: entry.id,
    icon,
    text: `${entry.agentName} — ${actionText}`,
    timeText: formatTimeAgo(entry.timestamp),
  };
}

/**
 * Get agents with budget usage > 80%.
 *
 * @param agents - Agent budget data
 * @returns Budget alerts sorted by percentage descending
 */
export function getBudgetAlerts(agents: AgentBudget[]): BudgetAlert[] {
  return agents
    .map((a) => ({
      agentId: a.agentId,
      name: a.name,
      percent: Math.round((a.usage / a.budget) * 100),
      exceeded: a.usage > a.budget,
    }))
    .filter((a) => a.percent > 80)
    .sort((a, b) => b.percent - a.percent);
}
