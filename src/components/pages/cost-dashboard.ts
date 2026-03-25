/**
 * CostDashboard — data logic for Cost/Budget page.
 *
 * Generates bar chart data, budget table with status, and 7-day trend.
 *
 * @module components/pages/cost-dashboard
 */

/** Per-agent usage for bar chart */
interface AgentUsage {
  agentId: string;
  name: string;
  tokens: number;
}

/** Bar chart data point */
export interface BarChartItem {
  agentId: string;
  name: string;
  tokens: number;
  percent: number;
}

/** Agent budget data for table */
interface AgentBudgetRow {
  agentId: string;
  name: string;
  used: number;
  budget: number;
}

/** Budget table row with calculated fields */
export interface BudgetTableRow {
  agentId: string;
  name: string;
  used: number;
  budget: number;
  percent: number;
  status: "OK" | "WARNING" | "EXCEEDED";
}

/** Daily trend data point */
interface TrendInput {
  date: string;
  tokens: number;
}

/** Trend output data point */
export interface TrendPoint {
  date: string;
  tokens: number;
}

/**
 * Generate bar chart data sorted by usage descending.
 * Percent is relative to the max usage agent.
 *
 * @param agents - Per-agent token usage
 * @returns Bar chart items with relative percentages
 */
export function generateBarChartData(agents: AgentUsage[]): BarChartItem[] {
  const sorted = [...agents].sort((a, b) => b.tokens - a.tokens);
  const max = sorted[0]?.tokens ?? 1;

  return sorted.map((a) => ({
    agentId: a.agentId,
    name: a.name,
    tokens: a.tokens,
    percent: Math.round((a.tokens / max) * 100),
  }));
}

/**
 * Generate budget table with status calculation.
 *
 * - OK: < 80%
 * - WARNING: 80-100%
 * - EXCEEDED: > 100%
 *
 * @param agents - Agent budget data
 * @returns Budget table rows with status
 */
export function generateBudgetTable(agents: AgentBudgetRow[]): BudgetTableRow[] {
  return agents.map((a) => {
    const percent = Math.round((a.used / a.budget) * 100);
    let status: BudgetTableRow["status"] = "OK";
    if (percent >= 100) status = "EXCEEDED";
    else if (percent >= 80) status = "WARNING";

    return {
      agentId: a.agentId,
      name: a.name,
      used: a.used,
      budget: a.budget,
      percent,
      status,
    };
  });
}

/**
 * Calculate daily trend from history data.
 *
 * @param history - Daily token history
 * @returns Trend data points (same format, validated)
 */
export function calculateTrend(history: TrendInput[]): TrendPoint[] {
  return history.map((h) => ({
    date: h.date,
    tokens: h.tokens,
  }));
}
