/**
 * ActivityRepository — CRUD for ActivityLog + AuditLog.
 *
 * @module repositories/activity
 */

import { getPrisma } from "./base";

export class ActivityRepository {
  private prisma = getPrisma();

  // Activity Log (system events)
  async logActivity(event: string, data?: object, source?: string) {
    return this.prisma.activityLog.create({ data: { event, data: data ?? {}, source } });
  }

  async getRecentActivity(limit = 20) {
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getActivityByEvent(event: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { event },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  // Audit Log (agent actions)
  async logAudit(agentId: string, action: string, details: object) {
    return this.prisma.auditLog.create({ data: { agentId, action, details } });
  }

  async getAuditByAgent(agentId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { agentId },
      orderBy: { timestamp: "desc" },
      take: limit,
      include: { agent: { select: { name: true, role: true } } },
    });
  }

  async getAuditRecent(limit = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
      include: { agent: { select: { name: true, role: true } } },
    });
  }
}
