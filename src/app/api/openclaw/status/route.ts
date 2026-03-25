/**
 * OpenClaw Status API route — check connection + get info.
 *
 * GET /api/openclaw/status — returns health, engine type, sessions, config.
 * Used by /settings/openclaw page for connection testing.
 *
 * @module app/api/openclaw/status/route
 */

import { NextResponse } from "next/server";
import { getEngine } from "@/lib/engine-singleton";

/**
 * GET /api/openclaw/status — OpenClaw connection status.
 *
 * Returns:
 * - connected: boolean
 * - engineType: "MockAdapter" | "OpenClawAdapter"
 * - gatewayUrl: string
 * - agents: number (deployed count)
 * - useMock: boolean
 */
export async function GET() {
  try {
    const engine = await getEngine();
    const engineType = engine.constructor.name;
    const healthy = await engine.healthCheck();
    const agents = await engine.listAgents();

    const gatewayUrl = process.env.OPENCLAW_API_URL ?? "http://localhost:18789";
    const useMock = process.env.USE_MOCK_ADAPTER === "true" || engineType === "MockAdapter";

    return NextResponse.json({
      connected: healthy,
      engineType,
      gatewayUrl,
      useMock,
      agentsDeployed: agents.length,
      agents: agents.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      engineType: "unknown",
      gatewayUrl: process.env.OPENCLAW_API_URL ?? "http://localhost:18789",
      useMock: true,
      agentsDeployed: 0,
      agents: [],
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
