/**
 * OpenClaw Update API — version check and update via CLI.
 *
 * GET  /api/openclaw/update — get current version
 * POST /api/openclaw/update — update to latest (stops gateway first)
 *
 * @module app/api/openclaw/update/route
 */

import { NextResponse } from "next/server";
import { getVersion, updateOpenClaw, stopGatewayProcess, controlGateway, getGatewayStatus } from "@/lib/openclaw-cli";
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
 *
 * On Windows, the gateway process locks the npm package files (EBUSY).
 * We must stop the gateway first, then update, then restart.
 */
export async function POST() {
  try {
    // 1. Check if gateway is running — need to stop it first on Windows
    let wasRunning = false;
    try {
      const status = await getGatewayStatus();
      const json = status.json as { port?: { status?: string }; rpc?: { ok?: boolean } } | undefined;
      wasRunning = json?.port?.status === "busy" || json?.rpc?.ok === true;
    } catch {
      // Can't determine — proceed anyway
    }

    // 2. Stop gateway if running (prevents EBUSY on Windows)
    if (wasRunning) {
      await stopGatewayProcess();
    }

    // 3. Run the update
    const result = await updateOpenClaw();

    // 4. Restart gateway if it was running
    if (wasRunning) {
      await controlGateway("start").catch(() => {
        // Best effort restart
      });
    }

    return NextResponse.json(
      apiResponse({
        success: result.exitCode === 0,
        output: result.stdout,
        errors: result.stderr || null,
        gatewayRestarted: wasRunning,
      })
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
