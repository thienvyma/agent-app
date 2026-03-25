/**
 * AuditLogger — structured logging of all agent actions.
 *
 * All tool usage, deployments, errors, and task completions are logged.
 * Supports search/filter for compliance and debugging.
 *
 * @module core/tools/audit-logger
 */

import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

/** Supported audit actions */
export type AuditAction =
  | "DEPLOY"
  | "UNDEPLOY"
  | "SEND_MESSAGE"
  | "USE_TOOL"
  | "COMPLETE_TASK"
  | "ERROR"
  | "ESCALATION"
  | "DEPLOY_FAILED";

/** Entry to log */
export interface AuditEntry {
  agentId: string;
  action: AuditAction;
  details: Record<string, unknown>;
}

/** Filter for searching audit logs */
export interface AuditFilter {
  agentId?: string;
  action?: AuditAction;
  from?: Date;
  to?: Date;
  toolName?: string;
}

/**
 * Structured audit logging service.
 */
export class AuditLogger {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Log an audit entry.
   */
  async log(entry: AuditEntry): Promise<void> {
    await this.db.auditLog.create({
      data: {
        agentId: entry.agentId,
        action: entry.action,
        details: entry.details as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Search audit logs with filters.
   *
   * @param filter - Optional filters (agentId, action, dateRange, toolName)
   * @returns Matching audit log entries
   */
  async search(filter: AuditFilter): Promise<unknown[]> {
    const where: Record<string, unknown> = {};

    if (filter.agentId) where.agentId = filter.agentId;
    if (filter.action) where.action = filter.action;
    if (filter.from || filter.to) {
      where.timestamp = {
        ...(filter.from ? { gte: filter.from } : {}),
        ...(filter.to ? { lte: filter.to } : {}),
      };
    }

    return this.db.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 100,
    });
  }

  /**
   * Get recent activity for a specific agent.
   *
   * @param agentId - Agent to query
   * @param limit - Max entries to return
   */
  async getAgentActivity(agentId: string, limit: number = 20): Promise<unknown[]> {
    return this.db.auditLog.findMany({
      where: { agentId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }
}
