/**
 * Tests for MessageBus and MessageRouter.
 * Phase 13: Agent Messaging.
 * Uses mocked Prisma, BullMQ, and HierarchyEngine.
 */

import { MessageBus } from "@/core/messaging/message-bus";
import { MessageRouter } from "@/core/messaging/message-router";
import { MessageType } from "@prisma/client";
import type { BusMessage } from "@/types/message";

// Mock BullMQ Queue
const createMockQueue = () => ({
  add: jest.fn().mockResolvedValue({ id: "job-001" }),
  close: jest.fn(),
});

// Mock Prisma
const createMockDb = () => ({
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  agent: {
    findUnique: jest.fn(),
  },
});

// Mock HierarchyEngine
const createMockHierarchy = () => ({
  findBestAgent: jest.fn(),
  findAgentsByRole: jest.fn(),
  getOrgTree: jest.fn(),
});

// Mock IAgentEngine
const createMockEngine = () => ({
  deploy: jest.fn(),
  undeploy: jest.fn(),
  sendMessage: jest.fn().mockResolvedValue({
    agentId: "a-1",
    message: "Task completed",
    tokenUsed: 50,
    finishReason: "stop",
    timestamp: new Date(),
  }),
  getStatus: jest.fn(),
  listAgents: jest.fn(),
  healthCheck: jest.fn(),
});

describe("MessageBus", () => {
  let bus: MessageBus;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockQueue: ReturnType<typeof createMockQueue>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    mockQueue = createMockQueue();
    bus = new MessageBus(mockDb as never, mockQueue as never);
  });

  describe("publish", () => {
    it("should save message to DB and add to queue", async () => {
      const msg: BusMessage = {
        fromAgentId: "a-ceo",
        toAgentId: "a-mkt",
        content: "Create Q2 marketing plan",
        type: MessageType.DELEGATE,
      };

      mockDb.message.create.mockResolvedValue({ id: "msg-001", ...msg });

      const messageId = await bus.publish(msg);

      expect(messageId).toBe("msg-001");
      expect(mockDb.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fromAgentId: "a-ceo",
          toAgentId: "a-mkt",
          content: "Create Q2 marketing plan",
          type: MessageType.DELEGATE,
        }),
      });
      expect(mockQueue.add).toHaveBeenCalledWith(
        "message",
        expect.objectContaining({ messageId: "msg-001" }),
        expect.any(Object)
      );
    });

    it("should throw when content is empty", async () => {
      const msg: BusMessage = {
        fromAgentId: "a-ceo",
        toAgentId: "a-mkt",
        content: "",
        type: MessageType.DELEGATE,
      };

      await expect(bus.publish(msg)).rejects.toThrow(/content.*required/i);
    });

    it("should include metadata when provided", async () => {
      const msg: BusMessage = {
        fromAgentId: "a-ceo",
        toAgentId: "a-mkt",
        content: "Urgent task",
        type: MessageType.DELEGATE,
        metadata: { taskId: "task-001", priority: 1 },
      };

      mockDb.message.create.mockResolvedValue({ id: "msg-002", ...msg });

      await bus.publish(msg);

      expect(mockDb.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({ taskId: "task-001" }),
        }),
      });
    });
  });

  describe("broadcast", () => {
    it("should publish to all target agents", async () => {
      const msg: BusMessage = {
        fromAgentId: "a-ceo",
        toAgentId: "", // will be overridden
        content: "Weekly meeting summary",
        type: MessageType.GROUP,
      };

      mockDb.message.create
        .mockResolvedValueOnce({ id: "msg-b1", ...msg, toAgentId: "a-mkt" })
        .mockResolvedValueOnce({ id: "msg-b2", ...msg, toAgentId: "a-fin" })
        .mockResolvedValueOnce({ id: "msg-b3", ...msg, toAgentId: "a-sup" });

      const ids = await bus.broadcast(msg, ["a-mkt", "a-fin", "a-sup"]);

      expect(ids).toHaveLength(3);
      expect(mockDb.message.create).toHaveBeenCalledTimes(3);
      expect(mockQueue.add).toHaveBeenCalledTimes(3);
    });
  });

  describe("getHistory", () => {
    it("should return messages for an agent", async () => {
      mockDb.message.findMany.mockResolvedValue([
        { id: "msg-1", fromAgentId: "a-ceo", toAgentId: "a-mkt", content: "Hello", type: MessageType.DELEGATE },
        { id: "msg-2", fromAgentId: "a-mkt", toAgentId: "a-ceo", content: "Report done", type: MessageType.REPORT },
      ]);

      const history = await bus.getHistory("a-mkt", 10);

      expect(history).toHaveLength(2);
      expect(mockDb.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { fromAgentId: "a-mkt" },
              { toAgentId: "a-mkt" },
            ]),
          }),
          take: 10,
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });

  describe("chain", () => {
    it("should execute steps sequentially", async () => {
      const mockEngine = createMockEngine();
      mockEngine.sendMessage
        .mockResolvedValueOnce({
          agentId: "a-1", message: "Research result", tokenUsed: 30, finishReason: "stop", timestamp: new Date(),
        })
        .mockResolvedValueOnce({
          agentId: "a-2", message: "Written content", tokenUsed: 50, finishReason: "stop", timestamp: new Date(),
        });

      const steps = [
        { agentId: "a-1", instruction: "Research topic X" },
        { agentId: "a-2", instruction: "Write article about: " },
      ];

      const result = await bus.chain(steps, mockEngine as never, "a-ceo");

      expect(result.steps).toHaveLength(2);
      expect(result.steps[0]!.result).toBe("Research result");
      expect(result.steps[1]!.result).toBe("Written content");
      expect(result.finalResult).toBe("Written content");
      expect(mockEngine.sendMessage).toHaveBeenCalledTimes(2);
      // Second call should include first result as context
      expect(mockEngine.sendMessage).toHaveBeenNthCalledWith(
        2,
        "a-2",
        expect.stringContaining("Research result")
      );
    });
  });
});

describe("MessageRouter", () => {
  let router: MessageRouter;
  let mockBus: { publish: jest.Mock; broadcast: jest.Mock };
  let mockHierarchy: ReturnType<typeof createMockHierarchy>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = {
      publish: jest.fn().mockResolvedValue("msg-routed-001"),
      broadcast: jest.fn().mockResolvedValue(["msg-b1", "msg-b2"]),
    };
    mockHierarchy = createMockHierarchy();
    router = new MessageRouter(
      mockHierarchy as never,
      mockBus as never
    );
  });

  describe("route", () => {
    it("should route DELEGATE via findBestAgent", async () => {
      mockHierarchy.findBestAgent.mockResolvedValue({
        id: "a-mkt", name: "Marketing Manager", role: "marketing",
      });

      await router.route("a-ceo", "co-1", "Cần lên kế hoạch marketing tháng 4", MessageType.DELEGATE);

      expect(mockHierarchy.findBestAgent).toHaveBeenCalledWith(
        "co-1",
        "Cần lên kế hoạch marketing tháng 4"
      );
      expect(mockBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          fromAgentId: "a-ceo",
          toAgentId: "a-mkt",
          type: MessageType.DELEGATE,
        })
      );
    });

    it("should broadcast for GROUP type", async () => {
      mockHierarchy.findAgentsByRole.mockResolvedValue([
        { id: "a-mkt" },
        { id: "a-fin" },
      ]);

      await router.route("a-ceo", "co-1", "Weekly meeting update", MessageType.GROUP);

      expect(mockBus.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          fromAgentId: "a-ceo",
          type: MessageType.GROUP,
        }),
        ["a-mkt", "a-fin"]
      );
    });

    it("should route ESCALATION to CEO agent", async () => {
      mockHierarchy.findAgentsByRole.mockResolvedValue([
        { id: "a-ceo", name: "CEO Agent", role: "ceo" },
      ]);

      await router.route("a-mkt", "co-1", "Cannot resolve customer complaint", MessageType.ESCALATION);

      expect(mockHierarchy.findAgentsByRole).toHaveBeenCalledWith("co-1", "ceo");
      expect(mockBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          toAgentId: "a-ceo",
          type: MessageType.ESCALATION,
        })
      );
    });

    it("should throw when no suitable agent found for DELEGATE", async () => {
      mockHierarchy.findBestAgent.mockResolvedValue(null);

      await expect(
        router.route("a-ceo", "co-1", "Do something unknown", MessageType.DELEGATE)
      ).rejects.toThrow(/no suitable agent/i);
    });
  });

  describe("routeToRole", () => {
    it("should find agent by role and publish", async () => {
      mockHierarchy.findAgentsByRole.mockResolvedValue([
        { id: "a-fin", name: "Finance Analyst" },
      ]);

      await router.routeToRole("a-ceo", "co-1", "Calculate revenue", "finance");

      expect(mockHierarchy.findAgentsByRole).toHaveBeenCalledWith("co-1", "finance");
      expect(mockBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          toAgentId: "a-fin",
          type: MessageType.DELEGATE,
        })
      );
    });
  });
});
