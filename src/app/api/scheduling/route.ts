/**
 * Scheduling API — CRUD for ScheduledJob entries.
 *
 * GET   /api/scheduling — list scheduled jobs
 * POST  /api/scheduling — create new job
 * PATCH /api/scheduling — toggle job enabled/disabled
 *
 * @module app/api/scheduling/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/**
 * GET /api/scheduling — List all scheduled jobs.
 *
 * Query: agent (filter), enabled (filter)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agent = searchParams.get("agent");
    const enabled = searchParams.get("enabled");

    const where: { agentId?: string; enabled?: boolean } = {};
    if (agent) where.agentId = agent;
    if (enabled !== null && enabled !== "") where.enabled = enabled === "true";

    const jobs = await prisma.scheduledJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(apiResponse(jobs), { status: 200 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/scheduling — Create a new scheduled job.
 *
 * Body: { name, cronExpression, agentId, taskTemplate }
 */
export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as {
      name?: string;
      cronExpression?: string;
      agentId?: string;
      taskTemplate?: string;
    };

    const errors: Record<string, string> = {};
    if (!data.name?.trim()) errors.name = "Job name is required";
    if (!data.cronExpression?.trim()) errors.cronExpression = "Cron expression required";
    if (!data.agentId) errors.agentId = "Agent is required";
    if (!data.taskTemplate?.trim()) errors.taskTemplate = "Task template required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Missing required fields", errors),
        { status: 422 }
      );
    }

    const job = await prisma.scheduledJob.create({
      data: {
        name: data.name!.trim(),
        cronExpression: data.cronExpression!.trim(),
        agentId: data.agentId!,
        taskTemplate: data.taskTemplate!.trim(),
      },
    });

    return NextResponse.json(apiResponse(job), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * PATCH /api/scheduling — Toggle job enabled/disabled.
 *
 * Body: { id, enabled }
 */
export async function PATCH(request: NextRequest) {
  try {
    const data = (await request.json()) as { id?: string; enabled?: boolean };

    if (!data.id) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Job ID required"),
        { status: 422 }
      );
    }

    const job = await prisma.scheduledJob.update({
      where: { id: data.id },
      data: { enabled: data.enabled ?? false },
    });

    return NextResponse.json(apiResponse(job), { status: 200 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
