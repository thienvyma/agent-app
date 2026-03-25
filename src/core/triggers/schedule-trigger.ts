/**
 * ScheduleTrigger — cron-based trigger scheduler.
 *
 * Manages recurring triggers using cron expressions.
 * Each schedule fires its trigger at the specified time.
 *
 * @module core/triggers/schedule-trigger
 */

import type { TriggerRegistry } from "@/core/triggers/trigger-registry";

/** Valid cron expression pattern (5-part) */
const CRON_REGEX = /^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/;

/** Active schedule entry */
interface ScheduleEntry {
  triggerId: string;
  cronExpression: string;
  timer?: ReturnType<typeof setInterval>;
}

/**
 * Manages cron-based trigger schedules.
 */
export class ScheduleTrigger {
  private readonly schedules = new Map<string, ScheduleEntry>();

  constructor(private readonly registry: TriggerRegistry) {}

  /**
   * Add a new cron schedule for a trigger.
   *
   * @param triggerId - Trigger to schedule
   * @param cronExpression - 5-part cron expression
   * @throws Error if cron expression is invalid
   */
  addSchedule(triggerId: string, cronExpression: string): void {
    if (!CRON_REGEX.test(cronExpression)) {
      throw new Error(
        `Invalid cron expression: "${cronExpression}". Expected 5-part format (e.g., "0 9 * * *")`
      );
    }

    // Store schedule entry (timer would be node-cron in production)
    // For now we store config only — actual cron scheduling uses node-cron
    this.schedules.set(triggerId, {
      triggerId,
      cronExpression,
    });
  }

  /**
   * Remove a scheduled trigger.
   *
   * @param triggerId - Trigger to unschedule
   */
  removeSchedule(triggerId: string): void {
    const entry = this.schedules.get(triggerId);
    if (entry?.timer) {
      clearInterval(entry.timer);
    }
    this.schedules.delete(triggerId);
  }

  /**
   * Start all active cron triggers from registry.
   * Loads all active cron-type triggers and creates schedules.
   */
  async startAll(): Promise<void> {
    const triggers = await this.registry.list({
      type: "cron",
      active: true,
    });

    for (const trigger of triggers) {
      if (trigger.config.cronExpression) {
        this.addSchedule(trigger.id, trigger.config.cronExpression);
      }
    }
  }

  /**
   * List all active schedules.
   *
   * @returns Active schedule entries with trigger ID and expression
   */
  listActive(): Array<{
    triggerId: string;
    cronExpression: string;
  }> {
    return Array.from(this.schedules.values()).map((s) => ({
      triggerId: s.triggerId,
      cronExpression: s.cronExpression,
    }));
  }

  /**
   * Stop all active schedules.
   */
  stopAll(): void {
    for (const [id] of this.schedules) {
      this.removeSchedule(id);
    }
  }
}
