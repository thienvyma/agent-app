/**
 * OpenClaw Gateway API — start/stop/restart/status via CLI.
 *
 * GET  /api/openclaw/gateway — gateway status (JSON)
 * POST /api/openclaw/gateway — control gateway (start/stop/restart)
 *
 * @module app/api/openclaw/gateway/route
 */

import { NextRequest, NextResponse } from "next/server";
import { getGatewayStatus, controlGateway } from "@/lib/openclaw-cli";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/**
 * GET /api/openclaw/gateway — Gateway status.
 */
export async function GET() {
  try {
    const result = await getGatewayStatus();
    return NextResponse.json(
      apiResponse({
        running: result.exitCode === 0,
        status: result.json ?? result.stdout,
        errors: result.exitCode !== 0 ? (result.stderr || result.stdout) : null,
      })
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/openclaw/gateway — Control gateway.
 * Body: { action: "start" | "stop" | "restart" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { action?: string };
    const action = body.action as "start" | "stop" | "restart";

    if (!["start", "stop", "restart"].includes(action)) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "action must be 'start', 'stop', or 'restart'"),
        { status: 422 }
      );
    }

    const result = await controlGateway(action);
    return NextResponse.json(
      apiResponse({
        action,
        success: result.exitCode === 0,
        output: result.stdout,
        error: result.exitCode !== 0 ? result.stderr : null,
      })
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
