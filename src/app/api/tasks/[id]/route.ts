/**
 * Single Task API routes.
 *
 * GET   /api/tasks/:id — fetch task detail with sub-tasks + approval
 * PATCH /api/tasks/:id — update task status (kanban drag-drop)
 *
 * @module app/api/tasks/[id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";
import type { TaskStatus } from "@prisma/client";

/**
 * GET /api/tasks/:id — Fetch a single task with relations.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, role: true, status: true } },
        parentTask: { select: { id: true, description: true, status: true } },
        subTasks: {
          select: { id: true, description: true, status: true, priority: true, assignedToId: true },
          orderBy: { createdAt: "asc" },
        },
        approvalRequest: true,
        correctionLog: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        apiError("NOT_FOUND", "Task not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(apiResponse(task), { status: 200 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * PATCH /api/tasks/:id — Update task status or fields.
 *
 * Body: { status?, assignedToId?, priority?, result? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      status?: TaskStatus;
      assignedToId?: string | null;
      priority?: number;
      result?: string;
    };

    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;
    if (body.priority) updateData.priority = body.priority;
    if (body.result) updateData.result = body.result;
    if (body.status === "COMPLETED") updateData.completedAt = new Date();

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json(apiResponse(updated), { status: 200 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
