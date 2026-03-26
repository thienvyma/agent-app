/**
 * AlwaysOnManager — crash detection, auto-restart, working hours.
 *
 * BUILD: OpenClaw does NOT have monitoring/restart logic.
 * This module watches agent sessions from outside.
 * Enhanced (S68): can auto-query OpenClaw CLI for session/health data.
 *
 * @module core/scheduler/always-on
 */

/** CLI executor function type (same signature as execOpenClaw) */
type CliExecutor = (args: string[], timeoutMs: number) => Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  json?: unknown;
}>;

/** Working hours configuration */
export interface WorkingHours {
  start: string; // "08:00"
  end: string; // "17:00"
  timezone: string; // "Asia/Ho_Chi_Minh"
  weekdays: number[]; // [1,2,3,4,5] = Mon-Fri
}

/** Agent health check input */
interface AgentHealthInput {
  sessionKey: string;
  responding: boolean;
  lastActivity: number; // timestamp
}

/** Agent health result */
interface AgentHealthResult {
  sessionKey: string;
  status: "healthy" | "crashed" | "stale";
  action: "none" | "restart" | "alert";
}

/** System health result */
export interface SystemHealthResult {
  status: string;
  services: Record<string, string>;
}

/** Agent presence entry */
export interface AgentPresence {
  id: string;
  online: boolean;
}

/** AlwaysOnManager configuration */
interface AlwaysOnConfig {
  /** Optional CLI executor for OpenClaw integration */
  cliExecutor?: CliExecutor;
}

/** Stale threshold: 5 minutes of no activity */
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

/** Night mode: minimum priority to process */
const NIGHT_MODE_MIN_PRIORITY = 8;

/**
 * Monitors agent health and manages auto-restart.
 * Enhanced: can auto-query OpenClaw for session and health data.
 */
export class AlwaysOnManager {
  private cli?: CliExecutor;

  /**
   * @param config - Optional configuration with CLI executor
   */
  constructor(config?: AlwaysOnConfig) {
    this.cli = config?.cliExecutor;
  }

  /**
   * Check agent health from session status (manual input).
   * Backward compatible with existing callers.
   *
   * @param input - Session status data
   * @returns Health result with recommended action
   */
  checkAgentHealth(input: AgentHealthInput): AgentHealthResult {
    if (!input.responding) {
      return {
        sessionKey: input.sessionKey,
        status: "crashed",
        action: "restart",
      };
    }

    const timeSinceActivity = Date.now() - input.lastActivity;
    if (timeSinceActivity > STALE_THRESHOLD_MS) {
      return {
        sessionKey: input.sessionKey,
        status: "stale",
        action: "alert",
      };
    }

    return {
      sessionKey: input.sessionKey,
      status: "healthy",
      action: "none",
    };
  }

  /**
   * Auto-query OpenClaw sessions to check agent health.
   * Calls `openclaw sessions --agent <id> --json` via CLI.
   *
   * @param agentId - Agent ID to check
   * @returns Health result based on session data
   */
  async checkAgentHealthAuto(agentId: string): Promise<AgentHealthResult> {
    if (!this.cli) {
      return {
        sessionKey: `agent:${agentId}:main`,
        status: "crashed",
        action: "restart",
      };
    }

    try {
      const result = await this.cli(
        ["sessions", "--agent", agentId, "--json"],
        15_000
      );
      const json = result.json as { sessions?: Array<{ key: string; active: boolean }> } | undefined;
      const sessions = json?.sessions ?? [];

      if (sessions.length === 0) {
        return {
          sessionKey: `agent:${agentId}:main`,
          status: "crashed",
          action: "restart",
        };
      }

      const mainSession = sessions[0];
      if (!mainSession) {
        return {
          sessionKey: `agent:${agentId}:main`,
          status: "crashed",
          action: "restart",
        };
      }

      return {
        sessionKey: mainSession.key,
        status: mainSession.active ? "healthy" : "stale",
        action: mainSession.active ? "none" : "alert",
      };
    } catch {
      return {
        sessionKey: `agent:${agentId}:main`,
        status: "crashed",
        action: "restart",
      };
    }
  }

  /**
   * Get system-wide health from OpenClaw.
   * Calls `openclaw health --json` via CLI.
   *
   * @returns Parsed system health status
   */
  async getSystemHealth(): Promise<SystemHealthResult> {
    if (!this.cli) {
      return { status: "unknown", services: {} };
    }

    try {
      const result = await this.cli(["health", "--json"], 15_000);
      const json = result.json as { status?: string; services?: Record<string, string> } | undefined;

      return {
        status: json?.status ?? "unknown",
        services: json?.services ?? {},
      };
    } catch {
      return { status: "error", services: {} };
    }
  }

  /**
   * Control heartbeat monitoring.
   * Calls `openclaw system heartbeat <action>`.
   *
   * @param action - 'enable' or 'disable'
   * @returns true if successful
   */
  async enableHeartbeat(action: "enable" | "disable"): Promise<boolean> {
    if (!this.cli) {
      return false;
    }

    try {
      const result = await this.cli(
        ["system", "heartbeat", action],
        15_000
      );
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  /**
   * Get agent presence (online/offline status).
   * Calls `openclaw system presence --json` via CLI.
   *
   * @returns Array of agent presence entries
   */
  async getPresence(): Promise<AgentPresence[]> {
    if (!this.cli) {
      return [];
    }

    try {
      const result = await this.cli(
        ["system", "presence", "--json"],
        15_000
      );
      const json = result.json as { agents?: AgentPresence[] } | undefined;
      return json?.agents ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Check if current time is within working hours.
   *
   * @param hours - Working hours config
   * @param now - Current time (default: now)
   * @returns True if within working hours
   */
  isWithinWorkingHours(hours: WorkingHours, now: Date = new Date()): boolean {
    // Check weekday (0=Sun, 1=Mon, ..., 6=Sat)
    const day = now.getDay();
    if (!hours.weekdays.includes(day)) {
      return false;
    }

    // Parse start/end times
    const [startH, startM] = hours.start.split(":").map(Number);
    const [endH, endM] = hours.end.split(":").map(Number);

    // Get current hour/minute in the timezone
    const currentH = now.getHours();
    const currentM = now.getMinutes();

    const startMinutes = startH! * 60 + startM!;
    const endMinutes = endH! * 60 + endM!;
    const currentMinutes = currentH * 60 + currentM;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  /**
   * Determine if a task should be processed based on priority and working hours.
   * Night mode: only process tasks with priority >= 8.
   *
   * @param priority - Task priority (1-10)
   * @param withinWorkingHours - Whether currently in working hours
   * @returns True if task should be processed
   */
  shouldProcessTask(priority: number, withinWorkingHours: boolean): boolean {
    if (withinWorkingHours) return true;
    return priority >= NIGHT_MODE_MIN_PRIORITY;
  }
}
