/**
 * Agents API routes.
 *
 * GET  /api/agents — list agents (filter by status, role)
 * POST /api/agents — create agent
 *
 * @module app/api/agents/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";
import type { AgentStatus } from "@prisma/client";

/**
 * GET /api/agents — List agents with optional filters.
 *
 * Query params:
 * - status (IDLE, RUNNING, ERROR, etc.)
 * - role (ceo, marketing, finance, etc.)
 * - page (default: 1)
 * - limit (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as AgentStatus | null;
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (role) where.role = role;

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          department: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.agent.count({ where }),
    ]);

    return NextResponse.json(
      apiResponse(agents, { total, page, limit }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/agents — Create a new agent.
 *
 * Body: { name, role, sop, model, tools[], skills[], departmentId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      role?: string;
      sop?: string;
      model?: string;
      tools?: string[];
      skills?: string[];
      departmentId?: string;
    };

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!body.name?.trim()) errors.name = "Name is required";
    if (!body.role?.trim()) errors.role = "Role is required";
    if (!body.departmentId) errors.departmentId = "Department ID is required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Missing required fields", errors),
        { status: 422 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name: body.name!.trim(),
        role: body.role!.trim(),
        sop: body.sop ?? "",
        model: body.model ?? "qwen2.5:7b",
        tools: body.tools ?? [],
        skills: body.skills ?? [],
        departmentId: body.departmentId!,
      },
    });

    return NextResponse.json(apiResponse(agent), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
