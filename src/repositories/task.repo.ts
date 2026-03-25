/**
 * TaskRepository — CRUD for Tasks + Subtasks + Approval.
 *
 * @module repositories/task
 */

import { type TaskStatus } from "@prisma/client";
import { getPrisma } from "./base";

export class TaskRepository {
  private prisma = getPrisma();

  async create(data: { description: string; priority?: number; assignedToId?: string; parentTaskId?: string }) {
    return this.prisma.task.create({ data });
  }

  async findById(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: { assignedTo: true, subTasks: true, approvalRequest: true, correctionLog: true },
    });
  }

  async list(filters?: { status?: TaskStatus; assignedToId?: string }) {
    return this.prisma.task.findMany({
      where: filters,
      include: { assignedTo: true, approvalRequest: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  }

  async updateStatus(id: string, status: TaskStatus) {
    const data: { status: TaskStatus; completedAt?: Date } = { status };
    if (status === "COMPLETED" || status === "FAILED") data.completedAt = new Date();
    return this.prisma.task.update({ where: { id }, data });
  }

  async updateResult(id: string, result: string, tokenUsage: number) {
    return this.prisma.task.update({ where: { id }, data: { result, tokenUsage } });
  }

  async delete(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  async getSubTasks(parentId: string) {
    return this.prisma.task.findMany({ where: { parentTaskId: parentId } });
  }

  async getStats() {
    const [total, completed, failed, pending] = await Promise.all([
      this.prisma.task.count(),
      this.prisma.task.count({ where: { status: "COMPLETED" } }),
      this.prisma.task.count({ where: { status: "FAILED" } }),
      this.prisma.task.count({ where: { status: "PENDING" } }),
    ]);
    return { total, completed, failed, pending, inProgress: total - completed - failed - pending };
  }
}
