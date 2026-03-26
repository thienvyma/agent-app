/**
 * OpenClaw Gateway API — start/stop/restart/status via CLI.
 *
 * GET  /api/openclaw/gateway — gateway status (rich JSON)
 * POST /api/openclaw/gateway — control gateway (start/stop/restart)
 *
 * @module app/api/openclaw/gateway/route
 */

import { NextRequest, NextResponse } from "next/server";
import { getGatewayStatus, controlGateway, stopGatewayProcess, startGatewayBackground, execOpenClaw } from "@/lib/openclaw-cli";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/** Shape of `openclaw gateway status --json` */
interface GatewayStatusJson {
  service?: {
    runtime?: { status?: string; detail?: string; missingUnit?: boolean };
    configAudit?: { ok?: boolean; issues?: string[] };
  };
  gateway?: {
    port?: number;
    probeUrl?: string;
    bindMode?: string;
  };
  port?: {
    port?: number;
    status?: string; // "busy" | "free"
    listeners?: Array<{ pid: number; address: string; command: string }>;
  };
  rpc?: {
    ok?: boolean;
    url?: string;
  };
}

/**
 * GET /api/openclaw/gateway — Gateway status.
 *
 * Parses the rich JSON from `openclaw gateway status --json` to provide
 * accurate health information including service state, port usage, and RPC probe.
 */
export async function GET() {
  try {
    const result = await getGatewayStatus();
    const json = result.json as GatewayStatusJson | undefined;

    // Determine real runtime state from rich JSON
    const portBusy = json?.port?.status === "busy";
    const rpcOk = json?.rpc?.ok === true;
    const serviceRuntime = json?.service?.runtime?.status ?? "unknown";
    const serviceMissing = json?.service?.runtime?.missingUnit === true;
    const port = json?.gateway?.port ?? json?.port?.port ?? 18789;

    // Gateway is truly "running" only if port is busy AND RPC probe succeeds
    const running = portBusy && rpcOk;

    // Get the dashboard URL with token (so the link actually works)
    let dashboardUrl = `http://127.0.0.1:${port}`;
    try {
      const dashResult = await execOpenClaw(["dashboard", "--no-open"], 5000);
      const match = dashResult.stdout.match(/Dashboard URL:\s*(http\S+)/);
      if (match && match[1]) {
        dashboardUrl = match[1];
      }
    } catch {
      // Fallback to plain URL
    }

    return NextResponse.json(
      apiResponse({
        running,
        port,
        dashboardUrl,
        serviceStatus: serviceRuntime,
        serviceMissing,
        rpcOk,
        portBusy,
        status: json ?? result.stdout,
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

    // For stop/restart: use process kill fallback if service manager fails
    if (action === "stop" || action === "restart") {
      const stopped = await stopGatewayProcess();
      if (action === "stop") {
        return NextResponse.json(
          apiResponse({
            action,
            success: stopped,
            output: stopped ? "Gateway stopped" : "Failed to stop gateway",
            error: stopped ? null : "Could not stop gateway process",
          })
        );
      }
      // restart: fall through to start logic below
    }

    // For start (or restart after stop):
    if (action === "start" || action === "restart") {
      // Start as hidden background process (no visible terminal window)
      const started = await startGatewayBackground(18789);

      return NextResponse.json(
        apiResponse({
          action,
          success: started,
          output: started ? "Gateway started (background)" : "Failed to start gateway",
          error: started ? null : "Could not start gateway process",
        })
      );
    }

    // Fallback for any other action
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
