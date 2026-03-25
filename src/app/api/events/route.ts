/**
 * SSE (Server-Sent Events) API route for real-time dashboard updates.
 *
 * GET /api/events — Opens SSE stream, receives all RealtimeHub events.
 * Clients reconnect automatically via EventSource API.
 *
 * @module app/api/events/route
 */

import { RealtimeHub } from "@/core/realtime/realtime-hub";

/** Shared RealtimeHub instance (in production from DI container) */
const hub = new RealtimeHub();

/** Export hub for pipeline integration */
export { hub as realtimeHub };

/**
 * GET /api/events — Server-Sent Events stream.
 *
 * Sends real-time events as SSE format:
 * ```
 * data: {"event":"agent:deployed","data":{...},"timestamp":...}
 *
 * ```
 *
 * Includes heartbeat every 30 seconds to keep connection alive.
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send replay buffer on connect
      const recent = hub.getRecentEvents(20);
      for (const event of recent) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      }

      // Subscribe to all future events
      const unsub = hub.subscribeAll((event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Client disconnected
          unsub();
        }
      });

      // Heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          unsub();
        }
      }, 30_000);

      // Cleanup on close
      const originalCancel = controller.close.bind(controller);
      controller.close = () => {
        clearInterval(heartbeat);
        unsub();
        originalCancel();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
