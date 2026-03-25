/**
 * SSE Event Stream — Server-Sent Events endpoint for live dashboard updates.
 *
 * GET /api/events/stream — Opens SSE connection, pushes events every 5s.
 *
 * Uses ReadableStream API for Next.js App Router compatibility.
 *
 * @module app/api/events/stream/route
 */

import { NextResponse } from "next/server";

/**
 * GET /api/events/stream — SSE endpoint.
 *
 * Sends periodic heartbeat and activity events to connected clients.
 * Connection stays open until client disconnects.
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      /** Send an SSE event */
      function send(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      // Send initial connection event
      send("connected", {
        timestamp: new Date().toISOString(),
        message: "SSE connection established",
      });

      // Heartbeat every 5 seconds
      const heartbeat = setInterval(() => {
        try {
          send("heartbeat", {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
          });
        } catch {
          clearInterval(heartbeat);
        }
      }, 5000);

      // Simulate activity events every 10 seconds
      const activity = setInterval(() => {
        try {
          const events = [
            { type: "agent.status", detail: "Agent health check completed" },
            { type: "task.progress", detail: "Task processing update" },
            { type: "system.metric", detail: "System metrics collected" },
          ];
          const event = events[Math.floor(Math.random() * events.length)]!;
          send("activity", {
            ...event,
            timestamp: new Date().toISOString(),
          });
        } catch {
          clearInterval(activity);
        }
      }, 10000);

      // Cleanup on abort
      const cleanup = () => {
        clearInterval(heartbeat);
        clearInterval(activity);
      };

      // Store cleanup for potential external abort
      (controller as unknown as Record<string, unknown>)._cleanup = cleanup;
    },

    cancel() {
      // Client disconnected
      console.log("[SSE] Client disconnected");
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
