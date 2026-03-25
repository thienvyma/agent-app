/**
 * Corrections API — correction logs for self-learning.
 *
 * GET  /api/corrections — list corrections with filters + stats
 * POST /api/corrections — create a new correction
 *
 * @module app/api/corrections/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/**
 * GET /api/corrections — List correction logs.
 *
 * Query params:
 * - agent: filter by agentId
 * - stats: "true" → return aggregated stats
 * - page, limit: pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentFilter = searchParams.get("agent");
    const stats = searchParams.get("stats") === "true";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const skip = (page - 1) * limit;

    if (stats) {
      const [total, byAgent] = await Promise.all([
        prisma.correctionLog.count(),
        prisma.correctionLog.groupBy({
          by: ["agentId"],
          _count: { id: true },
        }),
      ]);

      // Get agent names
      const agentIds = byAgent.map((r: { agentId: string }) => r.agentId);
      const agents = await prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true },
      });
      const agentMap = new Map(agents.map((a: { id: string; name: string }) => [a.id, a.name]));

      const perAgent = byAgent.map((r: { agentId: string; _count: { id: number } }) => ({
        agentId: r.agentId,
        agentName: agentMap.get(r.agentId) ?? "Unknown",
        count: r._count.id,
      }));

      return NextResponse.json(
        apiResponse({ total, perAgent }),
        { status: 200 }
      );
    }

    const where: { agentId?: string } = {};
    if (agentFilter) where.agentId = agentFilter;

    const [corrections, total] = await Promise.all([
      prisma.correctionLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          task: { select: { id: true, description: true } },
        },
      }),
      prisma.correctionLog.count({ where }),
    ]);

    return NextResponse.json(
      apiResponse(corrections, { total, page, limit }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/corrections — Create a correction entry.
 *
 * Body: { taskId, agentId, context, wrongOutput, correction, ruleExtracted }
 */
export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as {
      taskId?: string;
      agentId?: string;
      context?: string;
      wrongOutput?: string;
      correction?: string;
      ruleExtracted?: string;
    };

    const errors: Record<string, string> = {};
    if (!data.taskId) errors.taskId = "Task ID required";
    if (!data.agentId) errors.agentId = "Agent ID required";
    if (!data.wrongOutput?.trim()) errors.wrongOutput = "Wrong output required";
    if (!data.correction?.trim()) errors.correction = "Correction required";
    if (!data.ruleExtracted?.trim()) errors.ruleExtracted = "Extracted rule required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Missing required fields", errors),
        { status: 422 }
      );
    }

    const entry = await prisma.correctionLog.create({
      data: {
        taskId: data.taskId!,
        agentId: data.agentId!,
        context: data.context ?? "",
        wrongOutput: data.wrongOutput!.trim(),
        correction: data.correction!.trim(),
        ruleExtracted: data.ruleExtracted!.trim(),
      },
    });

    return NextResponse.json(apiResponse(entry), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
