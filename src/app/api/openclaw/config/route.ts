/**
 * OpenClaw Config API — indirect config management via CLI.
 *
 * GET  /api/openclaw/config?path=xxx — read config value
 * POST /api/openclaw/config — set config value
 * DELETE /api/openclaw/config?path=xxx — unset config value
 *
 * @module app/api/openclaw/config/route
 */

import { NextRequest, NextResponse } from "next/server";
import { configGet, configSet, configUnset, configValidate } from "@/lib/openclaw-cli";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/**
 * GET /api/openclaw/config — Read a config value or validate.
 * Query: ?path=gateway.auth.mode or ?action=validate
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const action = searchParams.get("action");

    if (action === "validate") {
      const result = await configValidate();
      return NextResponse.json(
        apiResponse({
          valid: result.exitCode === 0,
          output: result.json ?? result.stdout,
          errors: result.stderr || null,
        })
      );
    }

    if (!path) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Query param 'path' is required"),
        { status: 422 }
      );
    }

    const result = await configGet(path);
    return NextResponse.json(
      apiResponse({
        path,
        value: result.stdout,
        exitCode: result.exitCode,
        error: result.exitCode !== 0 ? result.stderr : null,
      })
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/openclaw/config — Set a config value.
 * Body: { path: string, value: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { path?: string; value?: string };

    if (!body.path?.trim()) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Field 'path' is required"),
        { status: 422 }
      );
    }
    if (body.value === undefined || body.value === null) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Field 'value' is required"),
        { status: 422 }
      );
    }

    const result = await configSet(body.path.trim(), String(body.value));
    return NextResponse.json(
      apiResponse({
        path: body.path,
        value: body.value,
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

/**
 * DELETE /api/openclaw/config — Unset a config value.
 * Query: ?path=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Query param 'path' is required"),
        { status: 422 }
      );
    }

    const result = await configUnset(path);
    return NextResponse.json(
      apiResponse({
        path,
        success: result.exitCode === 0,
        output: result.stdout,
      })
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
