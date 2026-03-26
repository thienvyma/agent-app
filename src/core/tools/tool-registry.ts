/**
 * ToolRegistry — register and execute tools with permission checks.
 *
 * Each tool has a definition (name, description, parameters, handler).
 * Execution checks ToolPermission before running and logs to AuditLog.
 *
 * Phase 71: Added OpenClaw sync (syncPermissionsToOpenClaw),
 * tool_calls parsing (parseToolCalls), and native tool auditing (logToolCalls).
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

/** Parsed tool call from LLM response */
export interface ParsedToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** Optional dependencies for OpenClaw integration */
export interface ToolRegistryOptions {
  /** Writer function to sync permissions to OpenClaw config */
  configWriter?: (
    agentId: string,
    config: { tools: { allow: string[] } }
  ) => Promise<void>;
}

/**
 * Registry for tool definitions + execution with permission checks.
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private configWriter?: ToolRegistryOptions["configWriter"];

  constructor(
    private readonly db: PrismaClient,
    options?: ToolRegistryOptions
  ) {
    this.configWriter = options?.configWriter;
  }

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

  // ══════════════════════════════════════════════
  // Phase 71: OpenClaw Tool Integration
  // ══════════════════════════════════════════════

  /**
   * Sync DB ToolPermissions to OpenClaw per-agent tools config.
   *
   * Reads all ToolPermission rows for the agent → generates
   * `tools.allow` list → writes to OpenClaw config via configWriter.
   *
   * @param agentId - Agent to sync permissions for
   */
  async syncPermissionsToOpenClaw(agentId: string): Promise<void> {
    const permissions = await this.db.toolPermission.findMany({
      where: { agentId },
    });

    const allowed = permissions.map(
      (p: { toolName: string }) => p.toolName
    );

    if (this.configWriter) {
      await this.configWriter(agentId, { tools: { allow: allowed } });
    }
  }

  /**
   * Parse tool_calls from an OpenAI-compatible chat response.
   *
   * Extracts structured tool calls from choices[0].message.tool_calls,
   * parsing JSON arguments into objects.
   *
   * @param response - Raw chat completion response
   * @returns Array of parsed tool calls
   */
  parseToolCalls(response: Record<string, unknown>): ParsedToolCall[] {
    try {
      const choices = response.choices as Array<Record<string, unknown>> | undefined;
      if (!choices || choices.length === 0) return [];

      const message = choices[0]?.message as Record<string, unknown> | undefined;
      if (!message) return [];

      const toolCalls = message.tool_calls as Array<Record<string, unknown>> | undefined;
      if (!toolCalls || toolCalls.length === 0) return [];

      return toolCalls.map((tc) => {
        const fn = tc.function as Record<string, string> | undefined;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(fn?.arguments ?? "{}") as Record<string, unknown>;
        } catch {
          args = {};
        }

        return {
          id: (tc.id as string) ?? "",
          name: fn?.name ?? "",
          arguments: args,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Log OpenClaw native tool calls to Prisma AuditLog.
   *
   * Creates an OPENCLAW_TOOL_CALL entry for each tool call,
   * providing audit trail for native tool usage.
   *
   * @param agentId - Agent that made the tool calls
   * @param toolCalls - Parsed tool calls to log
   */
  async logToolCalls(
    agentId: string,
    toolCalls: ParsedToolCall[]
  ): Promise<void> {
    for (const tc of toolCalls) {
      await this.db.auditLog.create({
        data: {
          agentId,
          action: "OPENCLAW_TOOL_CALL",
          details: {
            toolCallId: tc.id,
            toolName: tc.name,
            arguments: tc.arguments as Prisma.InputJsonValue,
          } as Prisma.InputJsonValue,
        },
      });
    }
  }
}

