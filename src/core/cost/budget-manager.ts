/**
 * BudgetManager — daily token budget management with auto-pause.
 *
 * Flow:
 * 1. Owner sets budget: setBudget(agentId, maxTokensPerDay)
 * 2. After each trackUsage: checkBudget(agentId)
 *    - < 80%   → ok
 *    - 80-99%  → warning (alert owner)
 *    - >= 100% → exceeded (auto-pause agent)
 * 3. Midnight: resetDaily()
 *
 * @module core/cost/budget-manager
 */

import type { CostTracker } from "@/core/cost/cost-tracker";

/** Budget status levels */
export type BudgetStatus = "ok" | "warning" | "exceeded";

/** Budget check result */
export interface BudgetCheckResult {
  agentId: string;
  limit: number;
  used: number;
  percentUsed: number;
  status: BudgetStatus;
}

/**
 * Manages per-agent daily token budgets.
 */
export class BudgetManager {
  private readonly budgets = new Map<string, number>();

  constructor(private readonly tracker: CostTracker) {}

  /**
   * Set daily token budget for an agent.
   *
   * @param agentId - Agent ID
   * @param maxTokensPerDay - Maximum tokens allowed per day
   */
  setBudget(agentId: string, maxTokensPerDay: number): void {
    this.budgets.set(agentId, maxTokensPerDay);
  }

  /**
   * Get budget status for an agent.
   *
   * @param agentId - Agent ID
   * @returns Budget info with current usage
   */
  getBudget(agentId: string): BudgetCheckResult {
    const limit = this.budgets.get(agentId);
    const usage = this.tracker.getAgentUsage(agentId);

    if (!limit) {
      return {
        agentId,
        limit: 0,
        used: usage.totalTokens,
        percentUsed: 0,
        status: "ok",
      };
    }

    const percentUsed = Math.round((usage.totalTokens / limit) * 100);

    return {
      agentId,
      limit,
      used: usage.totalTokens,
      percentUsed,
      status: this.getStatus(percentUsed),
    };
  }

  /**
   * Check budget and return status for an agent.
   *
   * @param agentId - Agent ID to check
   * @returns Budget check result with status
   */
  checkBudget(agentId: string): BudgetCheckResult {
    return this.getBudget(agentId);
  }

  /**
   * List all agents with configured budgets.
   *
   * @returns Array of budget check results
   */
  listBudgets(): BudgetCheckResult[] {
    const results: BudgetCheckResult[] = [];

    for (const [agentId] of this.budgets) {
      results.push(this.getBudget(agentId));
    }

    return results;
  }

  /**
   * Remove budget for an agent.
   *
   * @param agentId - Agent ID
   */
  removeBudget(agentId: string): void {
    this.budgets.delete(agentId);
  }

  /**
   * Reset daily usage counters (preserves budget limits).
   * Should be called at midnight via cron.
   */
  resetDaily(): void {
    this.tracker.resetDaily();
  }

  /**
   * Determine budget status from percentage used.
   */
  private getStatus(percentUsed: number): BudgetStatus {
    if (percentUsed >= 100) return "exceeded";
    if (percentUsed >= 80) return "warning";
    return "ok";
  }
}
