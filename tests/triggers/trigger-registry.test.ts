/**
 * Tests for TriggerRegistry, WebhookHandler, and ScheduleTrigger.
 * Phase 14: External Triggers.
 * Uses mocked MessageBus and in-memory registry.
 */

import { TriggerRegistry } from "@/core/triggers/trigger-registry";
import { WebhookHandler } from "@/core/triggers/webhook-handler";
import { ScheduleTrigger } from "@/core/triggers/schedule-trigger";
import type { TriggerConfig } from "@/types/trigger";

// Mock MessageBus
const createMockMessageBus = () => ({
  publish: jest.fn().mockResolvedValue("msg-001"),
  broadcast: jest.fn(),
  chain: jest.fn(),
  getHistory: jest.fn(),
});

describe("TriggerRegistry", () => {
  let registry: TriggerRegistry;
  let mockBus: ReturnType<typeof createMockMessageBus>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = createMockMessageBus();
    registry = new TriggerRegistry(mockBus as never);
  });

  describe("register", () => {
    it("should register a new trigger and return its ID", async () => {
      const config: Omit<TriggerConfig, "id" | "createdAt" | "lastFired"> = {
        name: "Daily Report",
        type: "cron",
        targetAgentId: "a-fin",
        config: {
          cronExpression: "0 9 * * *",
          messageTemplate: "Generate daily financial report",
        },
        active: true,
      };

      const id = await registry.register(config);

      expect(id).toBeDefined();
      expect(typeof id).toBe("string");
    });

    it("should throw on invalid cron expression", async () => {
      const config: Omit<TriggerConfig, "id" | "createdAt" | "lastFired"> = {
        name: "Bad Cron",
        type: "cron",
        targetAgentId: "a-fin",
        config: {
          cronExpression: "invalid-cron",
          messageTemplate: "Test",
        },
        active: true,
      };

      await expect(registry.register(config)).rejects.toThrow(/cron/i);
    });

    it("should throw when missing messageTemplate", async () => {
      const config = {
        name: "No Template",
        type: "webhook" as const,
        targetAgentId: "a-sales",
        config: {} as { messageTemplate: string },
        active: true,
      };

      await expect(registry.register(config)).rejects.toThrow(/template/i);
    });
  });

  describe("unregister", () => {
    it("should remove a registered trigger", async () => {
      const id = await registry.register({
        name: "Test Trigger",
        type: "api",
        targetAgentId: "a-1",
        config: { messageTemplate: "API call received" },
        active: true,
      });

      await registry.unregister(id);
      const list = await registry.list();

      expect(list.find((t) => t.id === id)).toBeUndefined();
    });
  });

  describe("list", () => {
    it("should list all triggers with filtering", async () => {
      await registry.register({
        name: "Trigger A",
        type: "webhook",
        targetAgentId: "a-1",
        config: { messageTemplate: "Webhook event", webhookSecret: "sec1" },
        active: true,
      });
      await registry.register({
        name: "Trigger B",
        type: "cron",
        targetAgentId: "a-2",
        config: { messageTemplate: "Cron job", cronExpression: "0 9 * * *" },
        active: false,
      });

      const all = await registry.list();
      expect(all).toHaveLength(2);

      const activeOnly = await registry.list({ active: true });
      expect(activeOnly).toHaveLength(1);
      expect(activeOnly[0]!.name).toBe("Trigger A");

      const cronOnly = await registry.list({ type: "cron" });
      expect(cronOnly).toHaveLength(1);
      expect(cronOnly[0]!.name).toBe("Trigger B");
    });
  });

  describe("fire", () => {
    it("should publish message via MessageBus using template", async () => {
      const id = await registry.register({
        name: "Order Webhook",
        type: "webhook",
        targetAgentId: "a-sales",
        config: {
          messageTemplate: "New order received: {{orderId}}",
          webhookSecret: "secret123",
        },
        active: true,
      });

      await registry.fire(id, { orderId: "ORD-001" });

      expect(mockBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          toAgentId: "a-sales",
          content: expect.stringContaining("ORD-001"),
        })
      );
    });

    it("should throw when trigger not found", async () => {
      await expect(
        registry.fire("nonexistent-id", {})
      ).rejects.toThrow(/not found/i);
    });

    it("should update lastFired timestamp", async () => {
      const id = await registry.register({
        name: "Test",
        type: "api",
        targetAgentId: "a-1",
        config: { messageTemplate: "Test fired" },
        active: true,
      });

      await registry.fire(id, {});

      const triggers = await registry.list();
      const trigger = triggers.find((t) => t.id === id);
      expect(trigger?.lastFired).toBeDefined();
    });
  });

  describe("getStats", () => {
    it("should return summary stats", async () => {
      await registry.register({
        name: "A", type: "webhook", targetAgentId: "a-1",
        config: { messageTemplate: "T" }, active: true,
      });
      await registry.register({
        name: "B", type: "cron", targetAgentId: "a-2",
        config: { messageTemplate: "T", cronExpression: "0 9 * * *" }, active: true,
      });
      await registry.register({
        name: "C", type: "webhook", targetAgentId: "a-3",
        config: { messageTemplate: "T" }, active: false,
      });

      const stats = await registry.getStats();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.byType.webhook).toBe(2);
      expect(stats.byType.cron).toBe(1);
    });
  });
});

describe("WebhookHandler", () => {
  let handler: WebhookHandler;
  let registry: TriggerRegistry;
  let mockBus: ReturnType<typeof createMockMessageBus>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockBus = createMockMessageBus();
    registry = new TriggerRegistry(mockBus as never);
    handler = new WebhookHandler(registry);
  });

  it("should fire trigger with valid HMAC signature", async () => {
    const id = await registry.register({
      name: "Shopify Orders",
      type: "webhook",
      targetAgentId: "a-sales",
      config: {
        messageTemplate: "New order: {{orderId}}",
        webhookSecret: "test-secret",
      },
      active: true,
    });

    const payload = JSON.stringify({ orderId: "ORD-123" });
    const crypto = await import("crypto");
    const signature = crypto
      .createHmac("sha256", "test-secret")
      .update(payload)
      .digest("hex");

    const result = await handler.handleWebhook(
      id,
      { "x-webhook-signature": signature },
      payload
    );

    expect(result.success).toBe(true);
    expect(mockBus.publish).toHaveBeenCalled();
  });

  it("should reject invalid HMAC signature", async () => {
    const id = await registry.register({
      name: "Secured Hook",
      type: "webhook",
      targetAgentId: "a-1",
      config: {
        messageTemplate: "Event",
        webhookSecret: "real-secret",
      },
      active: true,
    });

    const result = await handler.handleWebhook(
      id,
      { "x-webhook-signature": "invalid-sig" },
      '{"data": "test"}'
    );

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/signature/i);
  });

  it("should allow webhooks without secret configured", async () => {
    const id = await registry.register({
      name: "Open Hook",
      type: "webhook",
      targetAgentId: "a-1",
      config: { messageTemplate: "Open event" },
      active: true,
    });

    const result = await handler.handleWebhook(id, {}, '{"test": true}');

    expect(result.success).toBe(true);
  });
});

describe("ScheduleTrigger", () => {
  let scheduler: ScheduleTrigger;
  let registry: TriggerRegistry;
  let mockBus: ReturnType<typeof createMockMessageBus>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = createMockMessageBus();
    registry = new TriggerRegistry(mockBus as never);
    scheduler = new ScheduleTrigger(registry);
  });

  it("should add and list active schedules", async () => {
    const id = await registry.register({
      name: "Daily Report",
      type: "cron",
      targetAgentId: "a-fin",
      config: {
        cronExpression: "0 9 * * *",
        messageTemplate: "Generate report",
      },
      active: true,
    });

    scheduler.addSchedule(id, "0 9 * * *");

    const active = scheduler.listActive();
    expect(active).toHaveLength(1);
    expect(active[0]!.triggerId).toBe(id);
    expect(active[0]!.cronExpression).toBe("0 9 * * *");
  });

  it("should remove a schedule", async () => {
    const id = await registry.register({
      name: "Weekly",
      type: "cron",
      targetAgentId: "a-1",
      config: { cronExpression: "0 9 * * 1", messageTemplate: "Weekly" },
      active: true,
    });

    scheduler.addSchedule(id, "0 9 * * 1");
    scheduler.removeSchedule(id);

    const active = scheduler.listActive();
    expect(active).toHaveLength(0);
  });

  it("should throw on invalid cron expression", () => {
    expect(() => scheduler.addSchedule("t-1", "not-a-cron")).toThrow(/cron/i);
  });
});
