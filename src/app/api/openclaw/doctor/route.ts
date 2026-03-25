/**
 * OpenClaw Doctor API — auto-fix config issues via CLI.
 *
 * POST /api/openclaw/doctor — run openclaw doctor --fix
 *
 * @module app/api/openclaw/doctor/route
 */

import { NextResponse } from "next/server";
import { doctorFix } from "@/lib/openclaw-cli";
import { apiResponse, handleApiError } from "@/lib/api-auth";

/**
 * POST /api/openclaw/doctor — Run doctor fix (non-interactive).
 */
export async function POST() {
  try {
    const result = await doctorFix();
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
