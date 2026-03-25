/**
 * CostRepository — CRUD for CostEntry + Budget.
 *
 * @module repositories/cost
 */

import { getPrisma } from "./base";

export class CostRepository {
  private prisma = getPrisma();

  async trackUsage(agentId: string, tokens: number, costUsd: number, model: string, taskDesc?: string) {
    return this.prisma.costEntry.create({ data: { agentId, tokens, costUsd, model, taskDesc } });
  }

  async getDailyUsage(date?: string) {
    const targetDate = date ?? new Date().toISOString().split("T")[0]!;
    const start = new Date(`${targetDate}T00:00:00Z`);
    const end = new Date(`${targetDate}T23:59:59Z`);

    return this.prisma.costEntry.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { agent: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAgentCostSummary(agentId: string) {
    const result = await this.prisma.costEntry.aggregate({
      where: { agentId },
      _sum: { tokens: true, costUsd: true },
      _count: true,
    });
    return { totalTokens: result._sum.tokens ?? 0, totalCost: result._sum.costUsd ?? 0, entries: result._count };
  }

  async getTotalCostToday() {
    const today = new Date().toISOString().split("T")[0]!;
    const start = new Date(`${today}T00:00:00Z`);
    const result = await this.prisma.costEntry.aggregate({
      where: { createdAt: { gte: start } },
      _sum: { tokens: true, costUsd: true },
    });
    return { tokens: result._sum.tokens ?? 0, costUsd: result._sum.costUsd ?? 0 };
  }

  // Budget
  async getBudget(date?: string) {
    const targetDate = date ?? new Date().toISOString().split("T")[0]!;
    return this.prisma.budget.findUnique({ where: { date: targetDate } });
  }

  async setBudget(date: string, dailyLimit: number, warningPct?: number) {
    return this.prisma.budget.upsert({
      where: { date },
      update: { dailyLimit, warningPct },
      create: { date, dailyLimit, warningPct: warningPct ?? 80 },
    });
  }

  async updateBudgetSpent(date: string, spent: number) {
    return this.prisma.budget.update({
      where: { date },
      data: { currentSpent: { increment: spent } },
    });
  }
}
