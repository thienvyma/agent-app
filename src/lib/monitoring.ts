/**
 * HealthMonitor — service health checking and reporting.
 *
 * Checks: database, redis, ollama, openclaw.
 * Status: healthy (all OK), degraded (non-critical down), unhealthy (critical down).
 *
 * @module lib/monitoring
 */

/** Service health status */
export type HealthStatus = "healthy" | "degraded" | "unhealthy";

/** Individual service check result */
export interface ServiceCheck {
  name: string;
  status: HealthStatus;
  latencyMs: number;
}

/** Agent stats for report */
interface AgentStats {
  agentsTotal: number;
  agentsRunning: number;
  version: string;
}

/** Complete health report */
export interface HealthReport {
  status: HealthStatus;
  services: ServiceCheck[];
  agents: { total: number; running: number; idle: number };
  uptime: number;
  version: string;
  timestamp: string;
}

/** Critical services — if these are down, system is unhealthy */
const CRITICAL_SERVICES = ["database", "redis"];

/** Latency threshold for degraded status (ms) */
const DEGRADED_LATENCY_MS = 5000;

/**
 * Check a single service health.
 *
 * @param name - Service name
 * @param reachable - Whether service responded
 * @param latencyMs - Response time in ms
 * @returns Service check result
 */
export function checkServiceHealth(
  name: string,
  reachable: boolean,
  latencyMs: number
): ServiceCheck {
  if (!reachable) {
    return { name, status: "unhealthy", latencyMs: 0 };
  }

  if (latencyMs > DEGRADED_LATENCY_MS) {
    return { name, status: "degraded", latencyMs };
  }

  return { name, status: "healthy", latencyMs };
}

/**
 * Determine overall system health from service checks.
 *
 * Rules:
 * - Any CRITICAL service unhealthy → "unhealthy"
 * - Any non-critical unhealthy or any degraded → "degraded"
 * - All healthy → "healthy"
 *
 * @param checks - Array of service checks
 * @returns Overall health status
 */
export function getOverallHealth(checks: ServiceCheck[]): HealthStatus {
  // Check critical services first
  for (const check of checks) {
    if (
      CRITICAL_SERVICES.includes(check.name) &&
      check.status === "unhealthy"
    ) {
      return "unhealthy";
    }
  }

  // Check for any degraded or non-critical unhealthy
  for (const check of checks) {
    if (check.status === "unhealthy" || check.status === "degraded") {
      return "degraded";
    }
  }

  return "healthy";
}

/**
 * Format a complete health report.
 *
 * @param checks - Service check results
 * @param stats - Agent statistics
 * @returns Formatted health report
 */
export function formatHealthReport(
  checks: ServiceCheck[],
  stats: AgentStats
): HealthReport {
  return {
    status: getOverallHealth(checks),
    services: checks,
    agents: {
      total: stats.agentsTotal,
      running: stats.agentsRunning,
      idle: stats.agentsTotal - stats.agentsRunning,
    },
    uptime: process.uptime(),
    version: stats.version,
    timestamp: new Date().toISOString(),
  };
}
