/**
 * Agent Detail API route.
 *
 * GET /api/agents/[id] — Get a single agent by ID with relations.
 *
 * @module app/api/agents/[id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/**
 * GET /api/agents/[id] — Get agent detail.
 *
 * Includes department, tasks (latest 20), and basic stats.
 *
 * @param request - Next.js request
 * @param context - Route context with id parameter
 * @returns Agent detail with relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true },
        },
        tasks: {
          select: {
            id: true,
            description: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        apiError("NOT_FOUND", `Agent with id '${id}' not found`),
        { status: 404 }
      );
    }

    return NextResponse.json(apiResponse(agent));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
