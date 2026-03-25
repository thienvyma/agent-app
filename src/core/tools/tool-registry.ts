/**
 * ToolRegistry — register and execute tools with permission checks.
 *
 * Each tool has a definition (name, description, parameters, handler).
 * Execution checks ToolPermission before running and logs to AuditLog.
 *
 * @module core/tools/tool-registry
 */

import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

/** Definition of a tool */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  endpoint?: string;
  handler?: (input: unknown) => Promise<unknown>;
}

/** Result of tool execution */
export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
}

/**
 * Registry for tool definitions + execution with permission checks.
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor(private readonly db: PrismaClient) {}

  /**
   * Register a tool definition.
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name.
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools.
   */
  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool with permission check + audit logging.
   *
   * 1. Check tool exists
   * 2. Check agent has permission
   * 3. Execute handler
   * 4. Log to AuditLog
   *
   * @throws Error if tool not found
   * @throws Error if permission denied
   */
  async executeTool(
    agentId: string,
    toolName: string,
    input: unknown
  ): Promise<ToolResult> {
    // 1. Check tool exists
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    // 2. Check permission
    const permission = await this.db.toolPermission.findUnique({
      where: { agentId_toolName: { agentId, toolName } },
    });

    if (!permission) {
      throw new Error(
        `Permission denied: agent ${agentId} cannot use tool ${toolName}`
      );
    }

    // 3. Execute
    let result: ToolResult;
    try {
      if (tool.handler) {
        const data = await tool.handler(input);
        result = { success: true, data };
      } else {
        // No handler — tool is external (endpoint-based)
        result = {
          success: true,
          data: { message: `Tool ${toolName} invoked (external endpoint)` },
        };
      }
    } catch (error) {
      result = {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // 4. Audit log
    await this.db.auditLog.create({
      data: {
        agentId,
        action: "USE_TOOL",
        details: {
          toolName,
          input: input as Prisma.InputJsonValue,
          output: result.data as Prisma.InputJsonValue,
          success: result.success,
          ...(result.error ? { error: result.error } : {}),
        } as Prisma.InputJsonValue,
      },
    });

    return result;
  }
}
