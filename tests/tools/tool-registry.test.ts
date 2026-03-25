/**
 * Tests for ToolRegistry, ToolPermission, and AuditLogger.
 * Uses mocked Prisma — no real DB needed.
 */

import { ToolRegistry, ToolDefinition } from "@/core/tools/tool-registry";
import { ToolPermissionService } from "@/core/tools/tool-permission";
import { AuditLogger, AuditAction } from "@/core/tools/audit-logger";

// Mock Prisma
const createMockDb = () => ({
  toolPermission: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
});

describe("ToolRegistry", () => {
  let registry: ToolRegistry;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    registry = new ToolRegistry(mockDb as never);
  });

  const facebookTool: ToolDefinition = {
    name: "facebook_api",
    description: "Post content to Facebook page",
    parameters: { type: "object", properties: { content: { type: "string" } } },
    endpoint: "https://graph.facebook.com/v18/me/feed",
  };

  describe("registerTool", () => {
    it("should register a tool definition", () => {
      registry.registerTool(facebookTool);
      const tool = registry.getTool("facebook_api");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("facebook_api");
    });
  });

  describe("listTools", () => {
    it("should list all registered tools", () => {
      registry.registerTool(facebookTool);
      registry.registerTool({
        name: "google_sheets",
        description: "Read/write Google Sheets",
        parameters: {},
      });
      const tools = registry.listTools();
      expect(tools).toHaveLength(2);
    });
  });

  describe("executeTool", () => {
    it("should execute tool when agent has permission", async () => {
      const handler = jest.fn().mockResolvedValue({ success: true, data: "posted" });
      registry.registerTool({ ...facebookTool, handler });

      // Mock permission check → granted
      mockDb.toolPermission.findUnique.mockResolvedValue({
        id: "perm-1", agentId: "a-mkt", toolName: "facebook_api",
      });
      mockDb.auditLog.create.mockResolvedValue({});

      const result = await registry.executeTool("a-mkt", "facebook_api", { content: "Hello" });

      expect(handler).toHaveBeenCalledWith({ content: "Hello" });
      expect(result.success).toBe(true);
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: "USE_TOOL" }),
        })
      );
    });

    it("should throw PermissionDeniedError when agent lacks permission", async () => {
      registry.registerTool(facebookTool);
      // Mock → no permission
      mockDb.toolPermission.findUnique.mockResolvedValue(null);

      await expect(
        registry.executeTool("a-fin", "facebook_api", {})
      ).rejects.toThrow(/permission denied/i);
    });

    it("should throw when tool not registered", async () => {
      await expect(
        registry.executeTool("a-mkt", "unknown_tool", {})
      ).rejects.toThrow(/not found/i);
    });
  });
});

describe("ToolPermissionService", () => {
  let service: ToolPermissionService;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    service = new ToolPermissionService(mockDb as never);
  });

  describe("grant", () => {
    it("should create a permission record", async () => {
      mockDb.toolPermission.create.mockResolvedValue({});
      await service.grant("a-mkt", "facebook_api", "admin");
      expect(mockDb.toolPermission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: "a-mkt",
            toolName: "facebook_api",
          }),
        })
      );
    });
  });

  describe("check", () => {
    it("should return true when permission exists", async () => {
      mockDb.toolPermission.findUnique.mockResolvedValue({ id: "p1" });
      const result = await service.check("a-mkt", "facebook_api");
      expect(result).toBe(true);
    });

    it("should return false when no permission", async () => {
      mockDb.toolPermission.findUnique.mockResolvedValue(null);
      const result = await service.check("a-fin", "facebook_api");
      expect(result).toBe(false);
    });
  });

  describe("revoke", () => {
    it("should be idempotent (no error if already revoked)", async () => {
      mockDb.toolPermission.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.revoke("a-fin", "facebook_api")).resolves.not.toThrow();
    });
  });

  describe("getAgentTools", () => {
    it("should list all tools granted to an agent", async () => {
      mockDb.toolPermission.findMany.mockResolvedValue([
        { toolName: "facebook_api" },
        { toolName: "tiktok_api" },
      ]);
      const tools = await service.getAgentTools("a-mkt");
      expect(tools).toEqual(["facebook_api", "tiktok_api"]);
    });
  });
});

describe("AuditLogger", () => {
  let logger: AuditLogger;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    logger = new AuditLogger(mockDb as never);
  });

  describe("log", () => {
    it("should create audit log entry", async () => {
      mockDb.auditLog.create.mockResolvedValue({});
      await logger.log({
        agentId: "a-mkt",
        action: "USE_TOOL" as AuditAction,
        details: { toolName: "facebook_api" },
      });
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: "a-mkt",
            action: "USE_TOOL",
          }),
        })
      );
    });
  });

  describe("search", () => {
    it("should filter by agentId and action", async () => {
      mockDb.auditLog.findMany.mockResolvedValue([
        { id: "log-1", agentId: "a-mkt", action: "USE_TOOL" },
      ]);
      const results = await logger.search({ agentId: "a-mkt", action: "USE_TOOL" as AuditAction });
      expect(results).toHaveLength(1);
    });
  });

  describe("getAgentActivity", () => {
    it("should return limited recent activity", async () => {
      mockDb.auditLog.findMany.mockResolvedValue([
        { id: "1" }, { id: "2" }, { id: "3" },
      ]);
      const activity = await logger.getAgentActivity("a-mkt", 3);
      expect(activity).toHaveLength(3);
      expect(mockDb.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
          orderBy: { timestamp: "desc" },
        })
      );
    });
  });
});
