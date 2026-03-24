/**
 * Tests for TaskDecomposer and ErrorRecovery.
 * Uses mocked IAgentEngine, HierarchyEngine, and Prisma.
 */

import { TaskDecomposer } from "@/core/tasks/task-decomposer";
import { ErrorRecovery, RecoveryAction } from "@/core/tasks/error-recovery";
import type { IAgentEngine } from "@/core/adapter/i-agent-engine";

// Mock engine
const createMockEngine = (): jest.Mocked<IAgentEngine> => ({
  deploy: jest.fn(),
  undeploy: jest.fn(),
  redeploy: jest.fn(),
  sendMessage: jest.fn(),
  getStatus: jest.fn(),
  listAgents: jest.fn(),
  healthCheck: jest.fn(),
});

// Mock HierarchyEngine
const createMockHierarchy = () => ({
  findAgentsByRole: jest.fn(),
  findBestAgent: jest.fn(),
  getOrgTree: jest.fn(),
});

// Mock Prisma
const createMockDb = () => ({
  task: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  agent: {
    findMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
});

describe("TaskDecomposer", () => {
  let decomposer: TaskDecomposer;
  let mockEngine: jest.Mocked<IAgentEngine>;
  let mockHierarchy: ReturnType<typeof createMockHierarchy>;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEngine = createMockEngine();
    mockHierarchy = createMockHierarchy();
    mockDb = createMockDb();
    decomposer = new TaskDecomposer(mockEngine, mockHierarchy as never, mockDb as never);
  });

  describe("decompose", () => {
    it("should create parent task and sub-tasks from CEO analysis", async () => {
      // CEO agent returns sub-task breakdown
      mockEngine.sendMessage.mockResolvedValue({
        agentId: "agent-ceo-001",
        message: JSON.stringify({
          subTasks: [
            { description: "Viết content KM", role: "marketing", priority: 1 },
            { description: "Tính lợi nhuận KM", role: "finance", priority: 2 },
            { description: "Thiết kế banner", role: "design", priority: 3 },
          ],
        }),
        tokenUsed: 100,
        timestamp: new Date(),
      });

      // HierarchyEngine returns matching agents
      mockHierarchy.findAgentsByRole
        .mockResolvedValueOnce([{ id: "a-mkt", name: "Marketing Manager", role: "marketing" }])
        .mockResolvedValueOnce([{ id: "a-fin", name: "Finance Analyst", role: "finance" }])
        .mockResolvedValueOnce([]);

      // DB creates tasks
      mockDb.task.create
        .mockResolvedValueOnce({ id: "task-parent", description: "Chiến dịch KM", status: "PENDING" })
        .mockResolvedValueOnce({ id: "task-1", description: "Viết content", status: "PENDING" })
        .mockResolvedValueOnce({ id: "task-2", description: "Tính lợi nhuận", status: "PENDING" })
        .mockResolvedValueOnce({ id: "task-3", description: "Thiết kế banner", status: "PENDING" });

      mockDb.auditLog.create.mockResolvedValue({});

      const plan = await decomposer.decompose(
        "Triển khai chiến dịch khuyến mãi tháng này",
        "agent-ceo-001",
        "company-001"
      );

      expect(plan.subTasks).toHaveLength(3);
      expect(mockEngine.sendMessage).toHaveBeenCalledWith(
        "agent-ceo-001",
        expect.stringContaining("Triển khai chiến dịch")
      );
      expect(mockDb.task.create).toHaveBeenCalledTimes(4); // 1 parent + 3 sub
    });
  });

  describe("assignTask", () => {
    it("should update task and send to agent", async () => {
      mockDb.task.update.mockResolvedValue({});
      mockEngine.sendMessage.mockResolvedValue({ agentId: "a-mkt", message: "OK", tokenUsed: 10, timestamp: new Date() });
      mockDb.auditLog.create.mockResolvedValue({});

      await decomposer.assignTask("task-1", "a-mkt", "Viết content marketing");

      expect(mockDb.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "task-1" },
          data: expect.objectContaining({
            assignedToId: "a-mkt",
            status: "IN_PROGRESS",
          }),
        })
      );
      expect(mockEngine.sendMessage).toHaveBeenCalledWith("a-mkt", expect.any(String));
    });
  });

  describe("collectResults", () => {
    it("should return completed report when all sub-tasks done", async () => {
      mockDb.task.findMany.mockResolvedValue([
        { id: "t1", status: "COMPLETED", result: "Content done" },
        { id: "t2", status: "COMPLETED", result: "Budget calculated" },
      ]);

      const report = await decomposer.collectResults("task-parent");

      expect(report.allCompleted).toBe(true);
      expect(report.results).toHaveLength(2);
    });

    it("should mark incomplete when sub-tasks still pending", async () => {
      mockDb.task.findMany.mockResolvedValue([
        { id: "t1", status: "COMPLETED", result: "Done" },
        { id: "t2", status: "IN_PROGRESS", result: null },
      ]);

      const report = await decomposer.collectResults("task-parent");

      expect(report.allCompleted).toBe(false);
    });
  });
});

describe("ErrorRecovery", () => {
  let recovery: ErrorRecovery;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    recovery = new ErrorRecovery(mockDb as never);
  });

  describe("handleFailure", () => {
    it("should RETRY when retryCount < 3", async () => {
      const task = { id: "t1", retryCount: 1, assignedToId: "a-mkt", status: "FAILED" };
      mockDb.task.update.mockResolvedValue({ ...task, retryCount: 2 });
      mockDb.auditLog.create.mockResolvedValue({});

      const action = await recovery.handleFailure(
        task as never,
        new Error("timeout")
      );

      expect(action).toBe(RecoveryAction.RETRY);
      expect(mockDb.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ retryCount: 2 }),
        })
      );
    });

    it("should REASSIGN when retryCount >= 3 and alternate agent exists", async () => {
      const task = {
        id: "t1", retryCount: 3, assignedToId: "a-mkt", status: "FAILED",
        assignedTo: { role: "marketing", departmentId: "dept-1" },
      };
      mockDb.task.update.mockResolvedValue({});
      mockDb.agent.findMany.mockResolvedValue([
        { id: "a-mkt-2", name: "Marketing Assistant", role: "marketing" },
      ]);
      mockDb.auditLog.create.mockResolvedValue({});

      const action = await recovery.handleFailure(task as never, new Error("fail"));

      expect(action).toBe(RecoveryAction.REASSIGN);
    });

    it("should ESCALATE when no alternate agent available", async () => {
      const task = {
        id: "t1", retryCount: 3, assignedToId: "a-mkt", status: "FAILED",
        assignedTo: { role: "marketing", departmentId: "dept-1" },
      };
      mockDb.task.update.mockResolvedValue({});
      mockDb.agent.findMany.mockResolvedValue([]); // No alternates
      mockDb.auditLog.create.mockResolvedValue({});

      const action = await recovery.handleFailure(task as never, new Error("fail"));

      expect(action).toBe(RecoveryAction.ESCALATE);
    });
  });

  describe("partialSave", () => {
    it("should save partial result even on failure", async () => {
      mockDb.task.update.mockResolvedValue({});

      await recovery.partialSave("t1", "Partial content written...");

      expect(mockDb.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "t1" },
          data: expect.objectContaining({ result: "Partial content written..." }),
        })
      );
    });
  });
});
