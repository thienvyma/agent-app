/**
 * Tasks API routes.
 *
 * GET  /api/tasks — list tasks (filter by status, agent, priority)
 * POST /api/tasks — create task
 *
 * @module app/api/tasks/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";
import type { TaskStatus } from "@prisma/client";

/**
 * GET /api/tasks — List tasks with optional filters.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TaskStatus | null;
    const agentId = searchParams.get("agent");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (agentId) where.assignedToId = agentId;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: { select: { id: true, name: true, role: true } },
          parentTask: { select: { id: true, description: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json(
      apiResponse(tasks, { total, page, limit }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/tasks — Create a new task.
 *
 * Body: { description, assignedToId?, priority?, parentId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      description?: string;
      assignedToId?: string;
      priority?: number;
      parentTaskId?: string;
    };

    if (!body.description?.trim()) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Task description is required"),
        { status: 422 }
      );
    }

    const task = await prisma.task.create({
      data: {
        description: body.description.trim(),
        assignedToId: body.assignedToId ?? null,
        priority: body.priority ?? 5,
        parentTaskId: body.parentTaskId ?? null,
        status: body.assignedToId ? "IN_PROGRESS" : "PENDING",
      },
    });

    return NextResponse.json(apiResponse(task), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
