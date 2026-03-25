/**
 * Cost API routes — integrated with CostTracker (Phase 18).
 *
 * GET /api/cost — Cost report with per-agent breakdown.
 *
 * @module app/api/cost/route
 */

import { NextResponse } from "next/server";
import { apiResponse } from "@/lib/api-auth";
import { CostTracker } from "@/core/cost/cost-tracker";
import { BudgetManager } from "@/core/cost/budget-manager";

/** Shared instances (in production, these would come from DI container) */
const costTracker = new CostTracker();
const budgetManager = new BudgetManager(costTracker);

/**
 * GET /api/cost — Cost report with per-agent breakdown.
 *
 * Query params:
 * - period: "today" | "day" | "week" | "month" (default: "today")
 *
 * @returns Cost report with per-agent token usage and estimated USD cost
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "today";

  const report = costTracker.getReport(period);
  const budgets = budgetManager.listBudgets();

  return NextResponse.json(
    apiResponse({
      report,
      budgets,
      summary: {
        totalTokens: report.totalTokens,
        totalCostUSD: report.totalCostUSD,
        agentCount: report.perAgent.length,
        budgetsConfigured: budgets.length,
      },
    }),
    { status: 200 }
  );
}
