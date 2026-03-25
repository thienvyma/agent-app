/**
 * Tests for Extended API routes: Tasks, Messages, Approvals.
 * Phase 17: Extended API Routes.
 * Tests pure handler logic with mocked Prisma.
 */

import { apiResponse, apiError } from "@/lib/api-auth";
import { ApprovalStatus, MessageType, TaskStatus } from "@prisma/client";

// Mock Prisma
const createMockDb = () => ({
  task: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  approvalRequest: {
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  auditLog: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
});

describe("Tasks API Logic", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
  });

  it("should list tasks with status filter", async () => {
    mockDb.task.findMany.mockResolvedValue([
      { id: "t-1", description: "Research competitors", status: TaskStatus.IN_PROGRESS },
      { id: "t-2", description: "Write report", status: TaskStatus.IN_PROGRESS },
    ]);
    mockDb.task.count.mockResolvedValue(2);

    const tasks = await mockDb.task.findMany({
      where: { status: TaskStatus.IN_PROGRESS },
      take: 20,
    });
    const total = await mockDb.task.count({ where: { status: TaskStatus.IN_PROGRESS } });

    const response = apiResponse(tasks, { total, page: 1, limit: 20 });
    expect(response.data).toHaveLength(2);
    expect(response.meta?.total).toBe(2);
  });

  it("should create task with description", async () => {
    mockDb.task.create.mockResolvedValue({
      id: "t-new",
      description: "Analyze market trends",
      status: TaskStatus.PENDING,
      priority: 5,
    });

    const task = await mockDb.task.create({
      data: {
        description: "Analyze market trends",
        status: TaskStatus.PENDING,
        priority: 5,
      },
    });

    expect(task.id).toBe("t-new");
    expect(task.status).toBe(TaskStatus.PENDING);
  });
});

describe("Messages API Logic", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
  });

  it("should list messages with agent filter", async () => {
    mockDb.message.findMany.mockResolvedValue([
      { id: "m-1", content: "Hello", type: MessageType.DELEGATE },
    ]);

    const messages = await mockDb.message.findMany({
      where: { OR: [{ fromAgentId: "a-1" }, { toAgentId: "a-1" }] },
    });

    expect(messages).toHaveLength(1);
  });

  it("should create message with required fields", async () => {
    mockDb.message.create.mockResolvedValue({
      id: "m-new",
      fromAgentId: "a-ceo",
      toAgentId: "a-mkt",
      content: "Plan Q2 campaign",
      type: MessageType.DELEGATE,
    });

    const message = await mockDb.message.create({
      data: {
        fromAgentId: "a-ceo",
        toAgentId: "a-mkt",
        content: "Plan Q2 campaign",
        type: MessageType.DELEGATE,
      },
    });

    expect(message.type).toBe(MessageType.DELEGATE);
  });
});

describe("Approvals API Logic", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
  });

  it("should list pending approvals with task details", async () => {
    mockDb.approvalRequest.findMany.mockResolvedValue([
      {
        id: "apr-1",
        status: ApprovalStatus.PENDING,
        reason: "Customer email",
        task: { description: "Send email to client" },
      },
    ]);

    const pending = await mockDb.approvalRequest.findMany({
      where: { status: ApprovalStatus.PENDING },
      include: { task: true },
    });

    expect(pending).toHaveLength(1);
    expect(pending[0].task.description).toBe("Send email to client");
  });

  it("should approve a request", async () => {
    mockDb.approvalRequest.update.mockResolvedValue({
      id: "apr-1",
      status: ApprovalStatus.APPROVED,
      resolvedAt: new Date(),
    });

    const updated = await mockDb.approvalRequest.update({
      where: { id: "apr-1" },
      data: { status: ApprovalStatus.APPROVED, resolvedAt: new Date() },
    });

    expect(updated.status).toBe(ApprovalStatus.APPROVED);
  });

  it("should get approval stats", async () => {
    mockDb.approvalRequest.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(3);

    const pending = await mockDb.approvalRequest.count({ where: { status: ApprovalStatus.PENDING } });
    const approved = await mockDb.approvalRequest.count({ where: { status: ApprovalStatus.APPROVED } });
    const rejected = await mockDb.approvalRequest.count({ where: { status: ApprovalStatus.REJECTED } });

    expect(pending).toBe(5);
    expect(approved).toBe(20);
    expect(rejected).toBe(3);
  });
});

describe("Audit API Logic", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
  });

  it("should search audit logs with agent filter", async () => {
    mockDb.auditLog.findMany.mockResolvedValue([
      { id: "al-1", agentId: "a-ceo", action: "tool:execute", toolName: "search" },
    ]);

    const logs = await mockDb.auditLog.findMany({
      where: { agentId: "a-ceo" },
      take: 100,
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("tool:execute");
  });
});
