/**
 * OpenClaw Update API — version check and update via CLI.
 *
 * GET  /api/openclaw/update — get current version
 * POST /api/openclaw/update — update to latest
 *
 * @module app/api/openclaw/update/route
 */

import { NextResponse } from "next/server";
import { getVersion, updateOpenClaw } from "@/lib/openclaw-cli";
import { apiResponse, handleApiError } from "@/lib/api-auth";

/**
 * GET /api/openclaw/update — Get current OpenClaw version.
 */
export async function GET() {
  try {
    const version = await getVersion();
    return NextResponse.json(
      apiResponse({ version })
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/openclaw/update — Update OpenClaw to latest version.
 */
export async function POST() {
  try {
    const result = await updateOpenClaw();
    return NextResponse.json(
      apiResponse({
        success: result.exitCode === 0,
        output: result.stdout,
        errors: result.stderr || null,
      })
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
