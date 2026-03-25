/**
 * Remaining Repositories: Correction, Schedule, Tenant.
 * Smaller repos bundled together.
 *
 * @module repositories/extras
 */

import { getPrisma } from "./base";

// ============ CorrectionRepository (S26) ============

export class CorrectionRepository {
  private prisma = getPrisma();

  async create(data: {
    taskId: string; agentId: string; context: string;
    wrongOutput: string; correction: string; ruleExtracted: string; vectorId?: string;
  }) {
    return this.prisma.correctionLog.create({ data });
  }

  async listByAgent(agentId: string) {
    return this.prisma.correctionLog.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listAll(limit = 50) {
    return this.prisma.correctionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { task: true },
    });
  }
}

// ============ ScheduleRepository (S29) ============

export class ScheduleRepository {
  private prisma = getPrisma();

  async create(data: { name: string; cronExpression: string; agentId: string; taskTemplate: string }) {
    return this.prisma.scheduledJob.create({ data });
  }

  async list() {
    return this.prisma.scheduledJob.findMany({ orderBy: { createdAt: "desc" } });
  }

  async toggleEnabled(id: string, enabled: boolean) {
    return this.prisma.scheduledJob.update({ where: { id }, data: { enabled } });
  }

  async updateLastRun(id: string) {
    return this.prisma.scheduledJob.update({ where: { id }, data: { lastRun: new Date() } });
  }

  async delete(id: string) {
    return this.prisma.scheduledJob.delete({ where: { id } });
  }
}

// ============ TenantRepository (S30) ============

export class TenantRepository {
  private prisma = getPrisma();

  async create(data: { name: string; slug: string; plan?: string; maxAgents?: number; maxTokensPerDay?: number }) {
    return this.prisma.tenant.create({ data });
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async list() {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: "desc" } });
  }

  async update(id: string, data: Partial<{ name: string; plan: string; status: string; maxAgents: number; maxTokensPerDay: number }>) {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.tenant.delete({ where: { id } });
  }
}
