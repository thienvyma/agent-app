/**
 * Activity API — fetch ActivityLog entries.
 *
 * GET /api/activity — list activity logs with filters + pagination
 *
 * @module app/api/activity/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, handleApiError } from "@/lib/api-auth";

/**
 * GET /api/activity — List activity logs.
 *
 * Query params:
 * - event: filter by event type
 * - source: filter by source
 * - days: number of days back (default: 7)
 * - page, limit: pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get("event");
    const source = searchParams.get("source");
    const days = parseInt(searchParams.get("days") ?? "7", 10);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const skip = (page - 1) * limit;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: { createdAt: { gte: Date }; event?: string; source?: string } = {
      createdAt: { gte: since },
    };
    if (event) where.event = event;
    if (source) where.source = source;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json(
      apiResponse(logs, { total, page, limit }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
