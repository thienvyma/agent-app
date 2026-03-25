/**
 * useRealtimeEvents — React hook for SSE (Server-Sent Events) subscription.
 *
 * Connects to GET /api/events, parses SSE data, dispatches to callbacks.
 * Auto-reconnects with exponential backoff on disconnection.
 *
 * Wire: S19 RealtimeHub → /api/events → this hook → UI re-render.
 *
 * @module hooks/use-realtime
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/** Realtime event from SSE stream */
export interface RealtimeEvent<T = unknown> {
  event: string;
  data: T;
  timestamp: number;
}

/** Configuration for useRealtimeEvents */
export interface UseRealtimeConfig {
  /** SSE endpoint URL (default: /api/events) */
  url?: string;
  /** Event categories to listen for (default: all) */
  filter?: string[];
  /** Called for each incoming event */
  onEvent?: (event: RealtimeEvent) => void;
  /** Called on connection state change */
  onConnectionChange?: (connected: boolean) => void;
  /** Whether to enable the connection (default: true) */
  enabled?: boolean;
}

/**
 * Calculate exponential backoff delay for reconnection.
 *
 * @param attempt - Current retry attempt (0-based)
 * @param baseMs - Base delay in ms (default: 1000)
 * @param maxMs - Maximum delay in ms (default: 30000)
 * @returns Delay in milliseconds
 */
export function calculateBackoff(attempt: number, baseMs: number = 1000, maxMs: number = 30000): number {
  return Math.min(baseMs * Math.pow(2, attempt), maxMs);
}

/**
 * Parse SSE data line to RealtimeEvent.
 *
 * @param raw - Raw JSON string from SSE data field
 * @returns Parsed event or null if invalid
 */
export function parseSSEData(raw: string): RealtimeEvent | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.event === "string" && typeof parsed.timestamp === "number") {
      return parsed as RealtimeEvent;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Filter events by category prefix.
 *
 * @param events - Array of events
 * @param category - Category prefix (e.g., "agent", "task")
 * @returns Filtered events
 */
export function filterByCategory(events: RealtimeEvent[], category: string): RealtimeEvent[] {
  return events.filter((e) => e.event.startsWith(`${category}:`));
}

/**
 * React hook to subscribe to SSE realtime events.
 *
 * @param config - Hook configuration
 * @returns Connection state and recent events
 */
export function useRealtimeEvents(config: UseRealtimeConfig = {}) {
  const {
    url = "/api/events",
    filter,
    onEvent,
    onConnectionChange,
    enabled = true,
  } = config;

  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const retryRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  /** Handle incoming SSE message */
  const handleMessage = useCallback(
    (messageEvent: MessageEvent) => {
      const parsed = parseSSEData(messageEvent.data as string);
      if (!parsed) return;

      // Apply filter if specified
      if (filter && filter.length > 0) {
        const category = parsed.event.split(":")[0];
        if (category && !filter.includes(category)) return;
      }

      setEvents((prev) => [...prev.slice(-99), parsed]);
      onEvent?.(parsed);
    },
    [filter, onEvent]
  );

  /** Connect to SSE endpoint */
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        retryRef.current = 0;
        setConnected(true);
        onConnectionChange?.(true);
      };

      es.onmessage = handleMessage;

      es.onerror = () => {
        es.close();
        setConnected(false);
        onConnectionChange?.(false);

        // Reconnect with backoff
        const delay = calculateBackoff(retryRef.current);
        retryRef.current++;
        reconnectTimeout = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      eventSourceRef.current?.close();
      setConnected(false);
    };
  }, [url, enabled, handleMessage, onConnectionChange]);

  return { connected, events };
}
