/**
 * AlwaysOnManager — crash detection, auto-restart, working hours.
 *
 * BUILD: OpenClaw does NOT have monitoring/restart logic.
 * This module watches agent sessions from outside.
 *
 * @module core/scheduler/always-on
 */

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

/** Stale threshold: 5 minutes of no activity */
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

/** Night mode: minimum priority to process */
const NIGHT_MODE_MIN_PRIORITY = 8;

/**
 * Monitors agent health and manages auto-restart.
 */
export class AlwaysOnManager {
  /**
   * Check agent health from session status.
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
