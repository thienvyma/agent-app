/**
 * Messages API routes.
 *
 * GET  /api/messages — list messages (filter by agent, type, source)
 * POST /api/messages — send a message between agents
 *
 * Phase 73: Added OpenClaw session history integration.
 * When source=openclaw, fetches from OpenClaw sessions history.
 *
 * @module app/api/messages/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";
import { Prisma } from "@prisma/client";
import type { MessageType } from "@prisma/client";
import { execOpenClaw } from "@/lib/openclaw-cli";

/** Fetch messages from OpenClaw session history */
async function fetchOpenClawMessages(
  agentId?: string
): Promise<
  Array<{
    id: string;
    source: string;
    fromAgentId: string;
    toAgentId: string;
    content: string;
    type: string;
    createdAt: Date;
  }>
> {
  try {
    const args = agentId
      ? ["sessions", "history", `agent:${agentId}:main`, "--json"]
      : ["sessions", "list", "--json"];

    const result = await execOpenClaw(args, 5_000);
    if (result.exitCode !== 0 || !result.stdout.trim()) return [];

    const entries = JSON.parse(result.stdout) as Array<{
      role?: string;
      content?: string;
      timestamp?: string;
      agent?: string;
      id?: string;
    }>;

    return entries
      .filter((e) => e.content)
      .map((e, i) => ({
        id: `oc-msg-${e.id ?? i}`,
        source: "openclaw",
        fromAgentId: e.role === "assistant" ? (e.agent ?? agentId ?? "agent") : "user",
        toAgentId: e.role === "assistant" ? "user" : (e.agent ?? agentId ?? "agent"),
        content: e.content ?? "",
        type: "CHAT" as string,
        createdAt: e.timestamp ? new Date(e.timestamp) : new Date(),
      }));
  } catch {
    return [];
  }
}

/**
 * GET /api/messages — List messages with optional filters.
 *
 * Query params:
 * - agent: filter by agent ID
 * - type: filter by message type
 * - source: "openclaw" for OpenClaw session history only
 * - page, limit: pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent");
    const type = searchParams.get("type") as MessageType | null;
    const source = searchParams.get("source");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const skip = (page - 1) * limit;

    // Fetch from both sources in parallel
    const [prismaResult, openclawMessages] = await Promise.all([
      // Prisma messages (skip if source=openclaw)
      source === "openclaw"
        ? Promise.resolve({ messages: [], total: 0 })
        : (async () => {
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
            return { messages, total };
          })(),

      // OpenClaw session history (skip if source specified and not "openclaw")
      source && source !== "openclaw"
        ? Promise.resolve([])
        : fetchOpenClawMessages(agentId ?? undefined),
    ]);

    // Merge and sort
    const merged = [...prismaResult.messages, ...openclawMessages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const paginated = merged.slice(0, limit);
    const total = prismaResult.total + openclawMessages.length;

    return NextResponse.json(
      apiResponse(paginated, { total, page, limit }),
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
