"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Radio,
  Circle,
  Wifi,
  WifiOff,
} from "lucide-react";

/** SSE event from server */
interface SSEEvent {
  id: string;
  type: string;
  detail?: string;
  timestamp: string;
}

/**
 * Realtime event feed — connects to /api/events/stream via EventSource.
 *
 * Features:
 * - Auto-connect/reconnect
 * - Event type badges
 * - Max 50 events in buffer
 */
export function RealtimeFeed() {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/events/stream");
    eventSourceRef.current = es;

    es.addEventListener("connected", (e) => {
      setConnected(true);
      const data = JSON.parse(e.data);
      addEvent("system", "Connected", data.timestamp);
    });

    es.addEventListener("heartbeat", (e) => {
      const data = JSON.parse(e.data);
      addEvent("heartbeat", `Uptime: ${Math.floor(data.uptime)}s`, data.timestamp);
    });

    es.addEventListener("activity", (e) => {
      const data = JSON.parse(e.data);
      addEvent(data.type, data.detail, data.timestamp);
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Reconnect after 3 seconds
      setTimeout(connect, 3000);
    };
  }, []);

  /** Add event to buffer (max 50) */
  function addEvent(type: string, detail: string, timestamp: string) {
    setEvents((prev) => [
      { id: `${Date.now()}-${Math.random()}`, type, detail, timestamp },
      ...prev.slice(0, 49),
    ]);
  }

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return (
    <div className="space-y-3">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          Live Event Stream
        </h3>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
          connected ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
        }`}>
          {connected
            ? <><Wifi className="w-3 h-3" /> Connected</>
            : <><WifiOff className="w-3 h-3" /> Disconnected</>}
        </span>
      </div>

      {/* Events */}
      <div className="space-y-1 max-h-80 overflow-auto">
        {events.length > 0 ? events.map((event) => (
          <div key={event.id} className="flex items-start gap-2 p-2 bg-[#0B0F19] rounded-lg border border-[#1E2535]">
            <Circle className={`w-2 h-2 mt-1.5 shrink-0 ${
              event.type === "system" ? "text-green-400" :
              event.type === "heartbeat" ? "text-gray-500" :
              "text-cyan-400"
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-mono">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  event.type === "system" ? "bg-green-500/10 text-green-400" :
                  event.type === "heartbeat" ? "bg-gray-500/10 text-gray-500" :
                  "bg-cyan-500/10 text-cyan-400"
                }`}>{event.type}</span>
              </div>
              {event.detail && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{event.detail}</p>
              )}
            </div>
          </div>
        )) : (
          <p className="text-sm text-gray-500 text-center py-6">Waiting for events...</p>
        )}
      </div>
    </div>
  );
}
