/**
 * Agent Chat API route — wire pipeline execution for real agent chat.
 *
 * POST /api/agents/:id/chat — send message to agent via pipeline.
 * This is the CRITICAL route that connects the UI to the real engine.
 *
 * Flow:
 * 1. Validate agentId + message
 * 2. getPipeline() → uses singleton engine (real or mock)
 * 3. pipeline.execute(agentId, message) → 8-step flow
 * 4. Return response with message, tokens, budgetStatus
 *
 * @module app/api/agents/[id]/chat/route
 */

import { NextRequest, NextResponse } from "next/server";
import { getPipeline, getCostTracker } from "@/lib/engine-singleton";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/**
 * POST /api/agents/:id/chat — Send message to agent.
 *
 * Body: { message: string }
 * Returns: { agentId, message, tokenUsed, budgetStatus, contextInjected }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = (await request.json()) as { message?: string };

    // Validate
    if (!body.message?.trim()) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Message is required"),
        { status: 422 }
      );
    }

    // Execute through pipeline (8-step flow)
    const pipeline = await getPipeline();
    const result = await pipeline.execute(agentId, body.message.trim());

    // Get cost info
    const costTracker = getCostTracker();
    const agentUsage = costTracker.getAgentUsage(agentId);

    return NextResponse.json(
      apiResponse({
        agentId: result.agentId,
        response: result.message,
        message: result.message,
        tokenUsed: result.tokenUsed,
        budgetStatus: result.budgetStatus,
        contextInjected: result.contextInjected,
        totalTokens: agentUsage.totalTokens,
        totalCostUSD: agentUsage.estimatedCostUSD,
      }),
      { status: 200 }
    );
  } catch (error) {
    // Handle "not found" as 404
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        apiError("NOT_FOUND", error.message),
        { status: 404 }
      );
    }

    // Handle approval required as 403
    if (error instanceof Error && error.message.includes("Approval required")) {
      return NextResponse.json(
        apiError("APPROVAL_REQUIRED", error.message),
        { status: 403 }
      );
    }

    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
