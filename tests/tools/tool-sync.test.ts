/**
 * Tests for ToolRegistry OpenClaw integration (Session 71).
 * Covers: syncPermissionsToOpenClaw, parseToolCalls, logToolCalls.
 */

import { ToolRegistry } from "@/core/tools/tool-registry";
import type { ToolDefinition } from "@/core/tools/tool-registry";

// Mock DB
const createMockDb = () => ({
  toolPermission: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({}),
  },
});

// Mock config writer
const createMockConfigWriter = () => jest.fn().mockResolvedValue(undefined);

describe("ToolRegistry (OpenClaw Sync Enhancement)", () => {
  let registry: ToolRegistry;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockConfigWriter: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    mockConfigWriter = createMockConfigWriter();
    registry = new ToolRegistry(mockDb as never, { configWriter: mockConfigWriter });
  });

  describe("syncPermissionsToOpenClaw", () => {
    it("should generate correct allow list from DB permissions", async () => {
      mockDb.toolPermission.findMany.mockResolvedValue([
        { agentId: "finance", toolName: "web_search" },
        { agentId: "finance", toolName: "read" },
      ]);

      await registry.syncPermissionsToOpenClaw("finance");

      expect(mockConfigWriter).toHaveBeenCalledWith(
        "finance",
        expect.objectContaining({
          tools: expect.objectContaining({
            allow: expect.arrayContaining(["web_search", "read"]),
          }),
        })
      );
    });

    it("should pass empty allow list when no permissions exist", async () => {
      mockDb.toolPermission.findMany.mockResolvedValue([]);

      await registry.syncPermissionsToOpenClaw("new-agent");

      expect(mockConfigWriter).toHaveBeenCalledWith(
        "new-agent",
        expect.objectContaining({
          tools: expect.objectContaining({ allow: [] }),
        })
      );
    });
  });

  describe("parseToolCalls", () => {
    it("should extract tool_calls from OpenAI response format", () => {
      const response = {
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: { name: "web_search", arguments: '{"query":"test"}' },
                },
              ],
            },
          },
        ],
      };

      const calls = registry.parseToolCalls(response);

      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual(
        expect.objectContaining({
          id: "call_1",
          name: "web_search",
          arguments: { query: "test" },
        })
      );
    });

    it("should return empty array when no tool_calls", () => {
      const response = {
        choices: [{ message: { content: "Just text response" } }],
      };

      const calls = registry.parseToolCalls(response);

      expect(calls).toEqual([]);
    });
  });

  describe("logToolCalls", () => {
    it("should create AuditLog entries for each tool call", async () => {
      const toolCalls = [
        { id: "call_1", name: "web_search", arguments: { query: "test" } },
        { id: "call_2", name: "read", arguments: { path: "/tmp/file.txt" } },
      ];

      await registry.logToolCalls("finance", toolCalls);

      expect(mockDb.auditLog.create).toHaveBeenCalledTimes(2);
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: "finance",
            action: "OPENCLAW_TOOL_CALL",
          }),
        })
      );
    });
  });
});
