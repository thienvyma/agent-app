/**
 * CLI: ae realtime — Realtime hub monitoring commands.
 *
 * Commands:
 * - ae realtime events — show recent hub events
 * - ae realtime stats  — hub connection/event stats
 *
 * @module cli/commands/realtime
 */

import { Command } from "commander";

/** Event entry for CLI display */
interface EventEntry {
  event: string;
  data: unknown;
  timestamp: number;
}

/** Formatted event for CLI output */
interface FormattedEvent {
  type: string;
  data: unknown;
  time: string;
}

/** Hub stats input */
interface HubStatsInput {
  connectionCount: number;
  totalEvents: number;
  recentEventCount: number;
  uptime: number;
}

/** Formatted hub stats */
interface FormattedStats {
  connections: number;
  totalEvents: number;
  recentEvents: number;
  uptimeText: string;
}

/**
 * Format events for CLI display.
 */
export function getRealtimeEventsData(events: EventEntry[]): FormattedEvent[] {
  return events.map((e) => ({
    type: e.event,
    data: e.data,
    time: new Date(e.timestamp).toISOString(),
  }));
}

/**
 * Format hub statistics.
 */
export function getRealtimeStats(input: HubStatsInput): FormattedStats {
  const hours = Math.floor(input.uptime / 3600);
  const minutes = Math.floor((input.uptime % 3600) / 60);

  return {
    connections: input.connectionCount,
    totalEvents: input.totalEvents,
    recentEvents: input.recentEventCount,
    uptimeText: `${hours}h ${minutes}m`,
  };
}

/** Commander command */
export const realtimeCommand = new Command("realtime")
  .description("🔴 Realtime hub monitoring (Phase 19)");

realtimeCommand
  .command("events")
  .description("Show recent hub events")
  .option("--limit <n>", "Number of events", "10")
  .action(async (options: { limit: string }) => {
    try {
      const { RealtimeHub } = await import("@/core/realtime/realtime-hub");
      const hub = new RealtimeHub();
      const rawEvents = hub.getRecentEvents(parseInt(options.limit, 10));
      console.log(JSON.stringify(getRealtimeEventsData(rawEvents), null, 2));
    } catch (error) {
      console.error("Error fetching events:", error);
      process.exit(1);
    }
  });

realtimeCommand
  .command("stats")
  .description("Show hub statistics")
  .action(async () => {
    try {
      const { RealtimeHub } = await import("@/core/realtime/realtime-hub");
      const hub = new RealtimeHub();
      console.log(JSON.stringify(getRealtimeStats({
        connectionCount: hub.getConnectionCount(),
        totalEvents: hub.getRecentEvents(1000).length,
        recentEventCount: hub.getRecentEvents(10).length,
        uptime: process.uptime(),
      }), null, 2));
    } catch (error) {
      console.error("Error fetching stats:", error);
      process.exit(1);
    }
  });
