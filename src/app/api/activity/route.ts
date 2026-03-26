/**
 * Activity API — fetch ActivityLog entries merged with OpenClaw sessions.
 *
 * GET /api/activity — list activity logs with filters + pagination.
 * Merges Prisma ActivityLog with OpenClaw session metadata for unified view.
 *
 * Phase 73: Added OpenClaw sessions integration.
 *
 * @module app/api/activity/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, handleApiError } from "@/lib/api-auth";
import { execOpenClaw } from "@/lib/openclaw-cli";

/** Fetch OpenClaw sessions as activity entries */
async function fetchOpenClawSessions(): Promise<
  Array<{
    id: string;
    event: string;
    source: string;
    agentId: string;
    details: Record<string, unknown>;
    createdAt: Date;
  }>
> {
  try {
    const result = await execOpenClaw(
      ["sessions", "list", "--json"],
      5_000
    );
    if (result.exitCode !== 0 || !result.stdout.trim()) return [];

    const sessions = JSON.parse(result.stdout) as Array<{
      id?: string;
      agent?: string;
      status?: string;
      started?: string;
      messages?: number;
    }>;

    return sessions.map((s) => ({
      id: `oc-session-${s.id ?? "unknown"}`,
      event: "AGENT_SESSION",
      source: "openclaw",
      agentId: s.agent ?? "unknown",
      details: {
        sessionId: s.id,
        status: s.status,
        messageCount: s.messages ?? 0,
      },
      createdAt: s.started ? new Date(s.started) : new Date(),
    }));
  } catch {
    return [];
  }
}

/**
 * GET /api/activity — List activity logs.
 *
 * Query params:
 * - event: filter by event type
 * - source: filter by source ("openclaw" for OpenClaw-only)
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

    // Fetch from both sources in parallel
    const [prismaResult, openclawSessions] = await Promise.all([
      // Prisma ActivityLog (skip if source=openclaw)
      source === "openclaw"
        ? Promise.resolve({ logs: [], total: 0 })
        : (async () => {
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
            return { logs, total };
          })(),

      // OpenClaw sessions (skip if source is specified and not "openclaw")
      source && source !== "openclaw"
        ? Promise.resolve([])
        : fetchOpenClawSessions(),
    ]);

    // Merge and sort by createdAt descending
    const merged = [...prismaResult.logs, ...openclawSessions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination to merged results
    const paginated = merged.slice(0, limit);
    const total = prismaResult.total + openclawSessions.length;

    return NextResponse.json(
      apiResponse(paginated, { total, page, limit }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

