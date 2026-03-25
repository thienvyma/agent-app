/**
 * Cost Entries API — DB-backed cost data.
 *
 * GET /api/cost/entries — fetch cost entries with filters
 * GET /api/cost/entries?summary=true — aggregated per-agent totals
 *
 * @module app/api/cost/entries/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, handleApiError } from "@/lib/api-auth";

/** Per-agent aggregated summary type */
interface AgentSummaryItem {
  agentId: string;
  agentName: string;
  model: string;
  totalTokens: number;
  totalCostUsd: number;
  requestCount: number;
}

/**
 * GET /api/cost/entries — List cost entries or aggregate summary.
 *
 * Query params:
 * - summary: "true" → per-agent aggregated totals
 * - agent: filter by agentId
 * - days: number of days back (default: 7)
 * - page, limit: pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get("summary") === "true";
    const agentFilter = searchParams.get("agent");
    const days = parseInt(searchParams.get("days") ?? "7", 10);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
    const skip = (page - 1) * limit;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: { createdAt: { gte: Date }; agentId?: string } = {
      createdAt: { gte: since },
    };
    if (agentFilter) where.agentId = agentFilter;

    if (summary) {
      // Aggregated per-agent summary
      const entries = await prisma.costEntry.groupBy({
        by: ["agentId"],
        where,
        _sum: { tokens: true, costUsd: true },
        _count: { id: true },
      });

      // Enrich with agent names
      const agentIds = entries.map((entry: { agentId: string }) => entry.agentId);
      const agents = await prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, model: true },
      });
      const agentMap = new Map(agents.map((agent: { id: string; name: string; model: string }) => [agent.id, agent]));

      const result: AgentSummaryItem[] = entries.map(
        (entry: { agentId: string; _sum: { tokens: number | null; costUsd: number | null }; _count: { id: number } }) => ({
          agentId: entry.agentId,
          agentName: agentMap.get(entry.agentId)?.name ?? "Unknown",
          model: agentMap.get(entry.agentId)?.model ?? "unknown",
          totalTokens: entry._sum.tokens ?? 0,
          totalCostUsd: entry._sum.costUsd ?? 0,
          requestCount: entry._count.id,
        })
      );

      // Sort by tokens desc
      result.sort((a: AgentSummaryItem, b: AgentSummaryItem) => b.totalTokens - a.totalTokens);

      const totalTokens = result.reduce((sum: number, row: AgentSummaryItem) => sum + row.totalTokens, 0);
      const totalCostUsd = result.reduce((sum: number, row: AgentSummaryItem) => sum + row.totalCostUsd, 0);

      return NextResponse.json(
        apiResponse({
          agents: result,
          totals: { totalTokens, totalCostUsd, agentCount: result.length },
          period: `${days} days`,
        }),
        { status: 200 }
      );
    }

    // Detailed entries list
    const [entries, total] = await Promise.all([
      prisma.costEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          agent: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.costEntry.count({ where }),
    ]);

    return NextResponse.json(
      apiResponse(entries, { total, page, limit }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
