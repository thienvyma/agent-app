/**
 * OpenClaw Models API — list/set/status via CLI.
 *
 * GET  /api/openclaw/models — list models + status
 * POST /api/openclaw/models — set primary model
 *
 * @module app/api/openclaw/models/route
 */

import { NextRequest, NextResponse } from "next/server";
import { modelsList, modelsStatus, modelsSet } from "@/lib/openclaw-cli";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/**
 * GET /api/openclaw/models — List models and auth status.
 */
export async function GET() {
  try {
    const [listResult, statusResult] = await Promise.allSettled([
      modelsList(),
      modelsStatus(),
    ]);

    return NextResponse.json(
      apiResponse({
        models: listResult.status === "fulfilled"
          ? { data: listResult.value.json ?? listResult.value.stdout, exitCode: listResult.value.exitCode }
          : { data: null, error: "Failed to list models" },
        status: statusResult.status === "fulfilled"
          ? { data: statusResult.value.json ?? statusResult.value.stdout, exitCode: statusResult.value.exitCode }
          : { data: null, error: "Failed to get status" },
      })
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/openclaw/models — Set primary model.
 * Body: { model: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { model?: string };

    if (!body.model?.trim()) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Field 'model' is required"),
        { status: 422 }
      );
    }

    const result = await modelsSet(body.model.trim());
    return NextResponse.json(
      apiResponse({
        model: body.model,
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
