/**
 * Health check API route — no auth required.
 *
 * GET /api/health — System health status.
 *
 * @module app/api/health/route
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health — Check system health.
 *
 * Returns database connectivity, system uptime, and memory usage.
 * No authentication required.
 */
export async function GET() {
  const services: Record<string, { status: string; latencyMs?: number }> = {};

  // Check database
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    services.database = {
      status: "connected",
      latencyMs: Date.now() - start,
    };
  } catch {
    services.database = { status: "disconnected" };
  }

  // Determine overall status
  const allConnected = Object.values(services).every(
    (s) => s.status === "connected"
  );
  const status = allConnected ? "healthy" : "degraded";

  const response = {
    status,
    services,
    system: {
      uptime: Math.round(process.uptime()),
      memoryUsageMB: Math.round(
        process.memoryUsage().heapUsed / 1024 / 1024
      ),
      nodeVersion: process.version,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status: status === "healthy" ? 200 : 503,
  });
}
