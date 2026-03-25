/**
 * AgentRepository — CRUD for Agents + Sessions.
 * Replaces in-memory agent storage.
 *
 * @module repositories/agent
 */

import { type AgentStatus } from "@prisma/client";
import { getPrisma } from "./base";

export class AgentRepository {
  private prisma = getPrisma();

  async create(data: {
    name: string; role: string; sop: string; model: string;
    tools?: string[]; skills?: string[]; departmentId: string;
    isAlwaysOn?: boolean; cronSchedule?: string;
  }) {
    return this.prisma.agent.create({ data: { ...data, tools: data.tools ?? [], skills: data.skills ?? [] } });
  }

  async findById(id: string) {
    return this.prisma.agent.findUnique({
      where: { id },
      include: { department: true, tasks: { take: 10, orderBy: { createdAt: "desc" } }, sessions: true },
    });
  }

  async list(filters?: { departmentId?: string; status?: AgentStatus }) {
    return this.prisma.agent.findMany({
      where: filters,
      include: { department: true },
      orderBy: { name: "asc" },
    });
  }

  async update(id: string, data: Partial<{ name: string; role: string; sop: string; model: string; status: AgentStatus; tools: string[]; skills: string[] }>) {
    return this.prisma.agent.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: AgentStatus) {
    return this.prisma.agent.update({ where: { id }, data: { status } });
  }

  async delete(id: string) {
    return this.prisma.agent.delete({ where: { id } });
  }

  // Session management
  async createSession(agentId: string, sessionKey: string) {
    return this.prisma.agentSession.create({ data: { agentId, sessionKey } });
  }

  async endSession(sessionKey: string) {
    return this.prisma.agentSession.update({
      where: { sessionKey },
      data: { status: "ended", endedAt: new Date() },
    });
  }

  async getActiveSessions() {
    return this.prisma.agentSession.findMany({ where: { status: "active" }, include: { agent: true } });
  }
}
