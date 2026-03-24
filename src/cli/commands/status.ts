/**
 * `ae status` command — shows system health and agent counts.
 *
 * Checks connectivity to PostgreSQL, Redis, OpenClaw, and Ollama.
 * Returns structured data for both JSON output and table display.
 *
 * @module cli/commands/status
 */

import { createConnection } from "net";
import { FormattableData } from "../utils/output";

/** Structure returned by `ae status` */
export interface StatusData extends FormattableData {
  version: string;
  agents: {
    total: number;
    active: number;
    idle: number;
    error: number;
  };
  tasks: {
    total: number;
    pending: number;
    running: number;
    completed: number;
  };
  services: {
    postgresql: string;
    redis: string;
    openclaw: string;
    ollama: string;
  };
  uptime: string;
}

/**
 * Check if a TCP port is reachable.
 *
 * @param host - Hostname to connect to
 * @param port - Port number
 * @param timeoutMs - Connection timeout in milliseconds
 * @returns "connected" or "disconnected"
 */
async function checkPort(
  host: string,
  port: number,
  timeoutMs = 2000
): Promise<string> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve("disconnected");
    }, timeoutMs);

    socket.on("connect", () => {
      clearTimeout(timer);
      socket.destroy();
      resolve("connected");
    });

    socket.on("error", () => {
      clearTimeout(timer);
      socket.destroy();
      resolve("disconnected");
    });
  });
}

/**
 * Calculate uptime as human-readable string.
 *
 * @returns Uptime in "Xh Ym" format
 */
function getUptime(): string {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Parse host and port from a URL string.
 *
 * @param url - URL string (e.g., "postgresql://user:pass@host:5432/db")
 * @param defaultHost - Fallback host
 * @param defaultPort - Fallback port
 * @returns Parsed { host, port }
 */
function parseHostPort(
  url: string | undefined,
  defaultHost: string,
  defaultPort: number
): { host: string; port: number } {
  if (!url) return { host: defaultHost, port: defaultPort };
  try {
    // Handle redis:// and postgresql:// URLs
    const parsed = new URL(url);
    return {
      host: parsed.hostname || defaultHost,
      port: parsed.port ? parseInt(parsed.port, 10) : defaultPort,
    };
  } catch {
    return { host: defaultHost, port: defaultPort };
  }
}

/**
 * Gather system status data.
 * Checks all 4 services using connection URLs from .env.
 *
 * @returns StatusData with service connectivity and placeholder agent/task counts
 */
export async function getStatusData(): Promise<StatusData> {
  const pg = parseHostPort(process.env.DATABASE_URL, "localhost", 5432);
  const rd = parseHostPort(process.env.REDIS_URL, "localhost", 6379);
  const oc = parseHostPort(process.env.OPENCLAW_API_URL, "localhost", 18789);
  const ol = parseHostPort(process.env.OLLAMA_URL, "localhost", 11434);

  // Check services in parallel
  const [postgresql, redis, openclaw, ollama] = await Promise.all([
    checkPort(pg.host, pg.port),
    checkPort(rd.host, rd.port),
    checkPort(oc.host, oc.port),
    checkPort(ol.host, ol.port),
  ]);

  return {
    version: "0.1.0",
    agents: {
      total: 0,
      active: 0,
      idle: 0,
      error: 0,
    },
    tasks: {
      total: 0,
      pending: 0,
      running: 0,
      completed: 0,
    },
    services: {
      postgresql,
      redis,
      openclaw,
      ollama,
    },
    uptime: getUptime(),
  };
}
