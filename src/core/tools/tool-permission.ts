/**
 * ToolPermissionService — per-agent ACL for tool access.
 *
 * Controls which agents can use which tools.
 * CEO gets ALL access; new agents get NONE.
 *
 * @module core/tools/tool-permission
 */

import type { PrismaClient } from "@prisma/client";

/**
 * Service for managing tool permissions (grant/revoke/check).
 */
export class ToolPermissionService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Grant an agent permission to use a tool.
   *
   * @param agentId - Agent to grant
   * @param toolName - Tool to grant access to
   * @param grantedBy - Who granted (for audit trail)
   */
  async grant(agentId: string, toolName: string, grantedBy: string): Promise<void> {
    await this.db.toolPermission.create({
      data: {
        agentId,
        toolName,
        grantedBy,
      },
    });
  }

  /**
   * Revoke agent's permission. Idempotent — no error if already revoked.
   */
  async revoke(agentId: string, toolName: string): Promise<void> {
    await this.db.toolPermission.deleteMany({
      where: { agentId, toolName },
    });
  }

  /**
   * Check if agent has permission to use a tool.
   *
   * @returns true if permitted, false otherwise
   */
  async check(agentId: string, toolName: string): Promise<boolean> {
    const permission = await this.db.toolPermission.findUnique({
      where: { agentId_toolName: { agentId, toolName } },
    });
    return permission !== null;
  }

  /**
   * List all tools granted to an agent.
   */
  async getAgentTools(agentId: string): Promise<string[]> {
    const permissions = await this.db.toolPermission.findMany({
      where: { agentId },
      select: { toolName: true },
    });
    return permissions.map((p: { toolName: string }) => p.toolName);
  }

  /**
   * List all agents that have access to a tool.
   */
  async getToolAgents(toolName: string): Promise<string[]> {
    const permissions = await this.db.toolPermission.findMany({
      where: { toolName },
      select: { agentId: true },
    });
    return permissions.map((p: { agentId: string }) => p.agentId);
  }
}
