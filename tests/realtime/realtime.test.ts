/**
 * Tests for RealtimeHub — central event system.
 * Phase 19: Realtime Events.
 *
 * Tests: emit/subscribe, typed events, event replay, pipeline integration.
 */

import { RealtimeHub } from "@/core/realtime/realtime-hub";
import { AGENT_EVENTS, TASK_EVENTS, COST_EVENTS, SYSTEM_EVENTS } from "@/types/realtime";

describe("RealtimeHub", () => {
  let hub: RealtimeHub;

  beforeEach(() => {
    hub = new RealtimeHub();
  });

  afterEach(() => {
    hub.dispose();
  });

  describe("emit + subscribe", () => {
    it("should deliver event to subscriber", () => {
      const handler = jest.fn();
      hub.subscribe(AGENT_EVENTS.DEPLOYED, handler);

      hub.emit(AGENT_EVENTS.DEPLOYED, {
        agentId: "a-ceo",
        name: "CEO Agent",
        status: "RUNNING",
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          event: AGENT_EVENTS.DEPLOYED,
          data: { agentId: "a-ceo", name: "CEO Agent", status: "RUNNING" },
        })
      );
    });

    it("should deliver to multiple subscribers", () => {
      const h1 = jest.fn();
      const h2 = jest.fn();
      hub.subscribe(TASK_EVENTS.CREATED, h1);
      hub.subscribe(TASK_EVENTS.CREATED, h2);

      hub.emit(TASK_EVENTS.CREATED, { taskId: "t-1", description: "Test", priority: 5 });

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });

    it("should NOT deliver to unsubscribed handler", () => {
      const handler = jest.fn();
      const unsub = hub.subscribe(AGENT_EVENTS.STATUS, handler);
      unsub();

      hub.emit(AGENT_EVENTS.STATUS, { agentId: "a-1", oldStatus: "IDLE", newStatus: "RUNNING" });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("subscribeAll", () => {
    it("should receive events from any channel", () => {
      const handler = jest.fn();
      hub.subscribeAll(handler);

      hub.emit(AGENT_EVENTS.DEPLOYED, { agentId: "a-1" });
      hub.emit(COST_EVENTS.WARNING, { agentId: "a-2" });

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe("event replay", () => {
    it("should store recent events for replay", () => {
      hub.emit(AGENT_EVENTS.DEPLOYED, { agentId: "a-1" });
      hub.emit(AGENT_EVENTS.DEPLOYED, { agentId: "a-2" });
      hub.emit(TASK_EVENTS.CREATED, { taskId: "t-1" });

      const recent = hub.getRecentEvents(2);
      expect(recent).toHaveLength(2);
      expect(recent[0]!.event).toBe(AGENT_EVENTS.DEPLOYED);
      expect(recent[1]!.event).toBe(TASK_EVENTS.CREATED);
    });

    it("should limit replay buffer size", () => {
      for (let i = 0; i < 200; i++) {
        hub.emit(SYSTEM_EVENTS.HEALTH, { services: {}, timestamp: i });
      }

      const recent = hub.getRecentEvents(200);
      expect(recent.length).toBeLessThanOrEqual(100);
    });
  });

  describe("event timestamp", () => {
    it("should add timestamp to every event", () => {
      const handler = jest.fn();
      hub.subscribe(AGENT_EVENTS.DEPLOYED, handler);

      hub.emit(AGENT_EVENTS.DEPLOYED, { agentId: "a-1" });

      const event = handler.mock.calls[0]![0];
      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe("number");
    });
  });

  describe("getConnectionCount", () => {
    it("should track subscriber count", () => {
      expect(hub.getConnectionCount()).toBe(0);

      const unsub1 = hub.subscribe(AGENT_EVENTS.DEPLOYED, jest.fn());
      const unsub2 = hub.subscribeAll(jest.fn());
      expect(hub.getConnectionCount()).toBe(2);

      unsub1();
      expect(hub.getConnectionCount()).toBe(1);

      unsub2();
      expect(hub.getConnectionCount()).toBe(0);
    });
  });

  describe("dispose", () => {
    it("should remove all listeners and clear buffer", () => {
      hub.subscribe(AGENT_EVENTS.DEPLOYED, jest.fn());
      hub.emit(AGENT_EVENTS.DEPLOYED, { agentId: "a-1" });

      hub.dispose();

      expect(hub.getConnectionCount()).toBe(0);
      expect(hub.getRecentEvents(10)).toHaveLength(0);
    });
  });
});
