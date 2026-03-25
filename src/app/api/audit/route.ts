/**
 * Audit API routes.
 *
 * GET /api/audit — search audit logs
 *
 * @module app/api/audit/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, handleApiError } from "@/lib/api-auth";

/**
 * GET /api/audit — Search audit logs with filters.
 *
 * Query params:
 * - agent: filter by agentId
 * - action: filter by action type
 * - limit (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent");
    const action = searchParams.get("action");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);

    const where: Record<string, unknown> = {};
    if (agentId) where.agentId = agentId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: limit,
        orderBy: { timestamp: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json(
      apiResponse(logs, { total, page: 1, limit }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
