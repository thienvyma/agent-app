/**
 * Tests for ApprovalEngine, ApprovalPolicy, and ApprovalQueue.
 * Phase 15: Approval Workflow (HITL).
 * Uses mocked Prisma and MessageBus.
 */

import { ApprovalEngine } from "@/core/approval/approval-engine";
import { ApprovalPolicy } from "@/core/approval/approval-policy";
import { ApprovalQueue } from "@/core/approval/approval-queue";
import { ApprovalStatus } from "@prisma/client";

// Mock Prisma
const createMockDb = () => ({
  approvalRequest: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  correctionLog: {
    create: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
  },
});

describe("ApprovalEngine", () => {
  let engine: ApprovalEngine;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    engine = new ApprovalEngine(mockDb as never);
  });

  describe("requestApproval", () => {
    it("should create a PENDING approval request", async () => {
      mockDb.approvalRequest.create.mockResolvedValue({
        id: "apr-001",
        taskId: "task-001",
        status: ApprovalStatus.PENDING,
        policy: "customer-facing",
        reason: "Email gửi cho khách hàng cần duyệt",
        createdAt: new Date(),
      });

      const result = await engine.requestApproval(
        "task-001",
        "a-mkt",
        "customer-facing",
        "Email gửi cho khách hàng cần duyệt"
      );

      expect(result.id).toBe("apr-001");
      expect(result.status).toBe(ApprovalStatus.PENDING);
      expect(mockDb.approvalRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: "task-001",
          status: ApprovalStatus.PENDING,
          policy: "customer-facing",
          reason: "Email gửi cho khách hàng cần duyệt",
        }),
      });
    });
  });

  describe("approve", () => {
    it("should update status to APPROVED and set resolvedAt", async () => {
      mockDb.approvalRequest.update.mockResolvedValue({
        id: "apr-001",
        status: ApprovalStatus.APPROVED,
        ownerResponse: "LGTM",
        resolvedAt: new Date(),
      });

      await engine.approve("apr-001", "LGTM");

      expect(mockDb.approvalRequest.update).toHaveBeenCalledWith({
        where: { id: "apr-001" },
        data: expect.objectContaining({
          status: ApprovalStatus.APPROVED,
          ownerResponse: "LGTM",
          resolvedAt: expect.any(Date),
        }),
      });
    });
  });

  describe("reject", () => {
    it("should update status to REJECTED and create CorrectionLog", async () => {
      mockDb.approvalRequest.findUnique.mockResolvedValue({
        id: "apr-001",
        taskId: "task-001",
        task: {
          id: "task-001",
          assignedToId: "a-mkt",
          description: "Write customer email",
          result: "Dear customer, here is our offer...",
        },
      });

      mockDb.approvalRequest.update.mockResolvedValue({
        id: "apr-001",
        status: ApprovalStatus.REJECTED,
      });

      mockDb.correctionLog.create.mockResolvedValue({ id: "cor-001" });

      await engine.reject("apr-001", "Thiếu bảng giá chi tiết");

      expect(mockDb.approvalRequest.update).toHaveBeenCalledWith({
        where: { id: "apr-001" },
        data: expect.objectContaining({
          status: ApprovalStatus.REJECTED,
          ownerResponse: "Thiếu bảng giá chi tiết",
        }),
      });

      expect(mockDb.correctionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: "task-001",
          agentId: "a-mkt",
          correction: "Thiếu bảng giá chi tiết",
        }),
      });
    });

    it("should throw if approval not found", async () => {
      mockDb.approvalRequest.findUnique.mockResolvedValue(null);

      await expect(
        engine.reject("nonexistent", "feedback")
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("modify", () => {
    it("should update status to MODIFIED", async () => {
      mockDb.approvalRequest.update.mockResolvedValue({
        id: "apr-001",
        status: ApprovalStatus.MODIFIED,
      });

      await engine.modify("apr-001", "Thêm bảng giá vào email");

      expect(mockDb.approvalRequest.update).toHaveBeenCalledWith({
        where: { id: "apr-001" },
        data: expect.objectContaining({
          status: ApprovalStatus.MODIFIED,
          ownerResponse: "Thêm bảng giá vào email",
        }),
      });
    });
  });
});

describe("ApprovalPolicy", () => {
  let policy: ApprovalPolicy;

  beforeEach(() => {
    policy = new ApprovalPolicy();
  });

  it("should require approval for customer-facing tasks", () => {
    const result = policy.evaluate(
      "Gửi email báo giá cho khách hàng ABC",
      "marketing"
    );

    expect(result.decision).toBe("approval-required");
    expect(result.reason).toBeDefined();
  });

  it("should require approval for payment tasks", () => {
    const result = policy.evaluate(
      "Thanh toán hóa đơn nhà cung cấp 50 triệu",
      "finance"
    );

    expect(result.decision).toBe("approval-required");
  });

  it("should auto-approve internal research tasks", () => {
    const result = policy.evaluate(
      "Nghiên cứu đối thủ cạnh tranh trong ngành",
      "marketing"
    );

    expect(result.decision).toBe("auto");
  });

  it("should require approval for contract decisions", () => {
    const result = policy.evaluate(
      "Ký hợp đồng với đối tác mới",
      "ceo"
    );

    expect(result.decision).toBe("approval-required");
  });
});

describe("ApprovalQueue", () => {
  let queue: ApprovalQueue;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    queue = new ApprovalQueue(mockDb as never);
  });

  describe("getPending", () => {
    it("should return pending approval requests", async () => {
      mockDb.approvalRequest.findMany.mockResolvedValue([
        { id: "apr-1", status: ApprovalStatus.PENDING, reason: "Customer email" },
        { id: "apr-2", status: ApprovalStatus.PENDING, reason: "Payment" },
      ]);

      const pending = await queue.getPending();

      expect(pending).toHaveLength(2);
      expect(mockDb.approvalRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ApprovalStatus.PENDING },
        })
      );
    });
  });

  describe("getStats", () => {
    it("should return counts by status", async () => {
      mockDb.approvalRequest.count
        .mockResolvedValueOnce(3)  // pending
        .mockResolvedValueOnce(10) // approved
        .mockResolvedValueOnce(2)  // rejected
        .mockResolvedValueOnce(1); // modified

      const stats = await queue.getStats();

      expect(stats.pending).toBe(3);
      expect(stats.approved).toBe(10);
      expect(stats.rejected).toBe(2);
      expect(stats.modified).toBe(1);
    });
  });
});
