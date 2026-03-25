/**
 * RealtimeHub — central event hub for real-time dashboard updates.
 *
 * EventEmitter-based hub that:
 * - Receives events from core modules (Orchestrator, Pipeline, ApprovalEngine)
 * - Broadcasts to SSE subscribers (dashboard)
 * - Maintains replay buffer for reconnecting clients
 *
 * This is the single point for real-time event distribution.
 * Integrates with AgentPipeline as Step 8 (Rule #14).
 *
 * @see RULES.md Rule #14: Integration Verification
 * @module core/realtime/realtime-hub
 */

import type { RealtimeEvent } from "@/types/realtime";

/** Max events kept in replay buffer */
const MAX_REPLAY_BUFFER = 100;

/** Event handler function type */
type EventHandler = (event: RealtimeEvent) => void;

/** Unsubscribe function */
type Unsubscribe = () => void;

/**
 * Central real-time event hub.
 * Core modules emit → hub broadcasts → SSE clients receive.
 */
export class RealtimeHub {
  /** Per-event subscribers */
  private readonly listeners = new Map<string, Set<EventHandler>>();

  /** Global subscribers (receive all events) */
  private readonly globalListeners = new Set<EventHandler>();

  /** Recent events for replay on reconnect */
  private readonly replayBuffer: RealtimeEvent[] = [];

  /** Total active subscriptions */
  private connectionCount = 0;

  /**
   * Emit an event to all subscribers.
   *
   * @param event - Event name (e.g., "agent:deployed")
   * @param data - Event payload
   */
  emit<T = unknown>(event: string, data: T): void {
    const wrappedEvent: RealtimeEvent<T> = {
      event,
      data,
      timestamp: Date.now(),
    };

    // Add to replay buffer
    this.replayBuffer.push(wrappedEvent as RealtimeEvent);
    if (this.replayBuffer.length > MAX_REPLAY_BUFFER) {
      this.replayBuffer.shift();
    }

    // Notify per-event subscribers
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(wrappedEvent as RealtimeEvent);
      }
    }

    // Notify global subscribers
    for (const handler of this.globalListeners) {
      handler(wrappedEvent as RealtimeEvent);
    }
  }

  /**
   * Subscribe to a specific event.
   *
   * @param event - Event name to listen for
   * @param handler - Callback function
   * @returns Unsubscribe function
   */
  subscribe(event: string, handler: EventHandler): Unsubscribe {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }
    handlers.add(handler);
    this.connectionCount++;

    return () => {
      handlers.delete(handler);
      this.connectionCount--;
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to ALL events (for SSE stream).
   *
   * @param handler - Callback function receiving all events
   * @returns Unsubscribe function
   */
  subscribeAll(handler: EventHandler): Unsubscribe {
    this.globalListeners.add(handler);
    this.connectionCount++;

    return () => {
      this.globalListeners.delete(handler);
      this.connectionCount--;
    };
  }

  /**
   * Get recent events for replay (reconnecting clients).
   *
   * @param count - Number of recent events to return
   * @returns Array of recent events (newest last)
   */
  getRecentEvents(count: number): RealtimeEvent[] {
    const start = Math.max(0, this.replayBuffer.length - count);
    return this.replayBuffer.slice(start);
  }

  /**
   * Get number of active subscriptions.
   *
   * @returns Active connection/subscription count
   */
  getConnectionCount(): number {
    return this.connectionCount;
  }

  /**
   * Clean up all listeners and clear replay buffer.
   */
  dispose(): void {
    this.listeners.clear();
    this.globalListeners.clear();
    this.replayBuffer.length = 0;
    this.connectionCount = 0;
  }
}
