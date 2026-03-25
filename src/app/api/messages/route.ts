/**
 * Messages API routes.
 *
 * GET  /api/messages — list messages (filter by agent, type)
 * POST /api/messages — send a message between agents
 *
 * @module app/api/messages/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";
import { Prisma } from "@prisma/client";
import type { MessageType } from "@prisma/client";

/**
 * GET /api/messages — List messages with optional filters.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent");
    const type = searchParams.get("type") as MessageType | null;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (agentId) {
      where.OR = [{ fromAgentId: agentId }, { toAgentId: agentId }];
    }
    if (type) where.type = type;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          fromAgent: { select: { id: true, name: true, role: true } },
          toAgent: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.message.count({ where }),
    ]);

    return NextResponse.json(
      apiResponse(messages, { total, page, limit }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/messages — Send a message between agents.
 *
 * Body: { fromAgentId, toAgentId, content, type }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      fromAgentId?: string;
      toAgentId?: string;
      content?: string;
      type?: MessageType;
    };

    const errors: Record<string, string> = {};
    if (!body.fromAgentId) errors.fromAgentId = "Sender ID required";
    if (!body.toAgentId) errors.toAgentId = "Recipient ID required";
    if (!body.content?.trim()) errors.content = "Content required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Missing required fields", errors),
        { status: 422 }
      );
    }

    const message = await prisma.message.create({
      data: {
        fromAgentId: body.fromAgentId!,
        toAgentId: body.toAgentId!,
        content: body.content!.trim(),
        type: body.type ?? "DELEGATE",
        metadata: {} as Prisma.InputJsonValue,
      },
      include: {
        fromAgent: { select: { id: true, name: true } },
        toAgent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(apiResponse(message), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
