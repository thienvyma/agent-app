/**
 * ApprovalRepository — CRUD for ApprovalRequests.
 *
 * @module repositories/approval
 */

import { type ApprovalStatus } from "@prisma/client";
import { getPrisma } from "./base";

export class ApprovalRepository {
  private prisma = getPrisma();

  async create(taskId: string, policy: string, reason: string) {
    return this.prisma.approvalRequest.create({ data: { taskId, policy, reason } });
  }

  async findById(id: string) {
    return this.prisma.approvalRequest.findUnique({
      where: { id },
      include: { task: { include: { assignedTo: true } } },
    });
  }

  async findByTaskId(taskId: string) {
    return this.prisma.approvalRequest.findUnique({ where: { taskId } });
  }

  async listPending() {
    return this.prisma.approvalRequest.findMany({
      where: { status: "PENDING" },
      include: { task: { include: { assignedTo: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async resolve(id: string, status: ApprovalStatus, ownerResponse?: string) {
    return this.prisma.approvalRequest.update({
      where: { id },
      data: { status, ownerResponse, resolvedAt: new Date() },
    });
  }

  async getStats() {
    const [pending, approved, rejected] = await Promise.all([
      this.prisma.approvalRequest.count({ where: { status: "PENDING" } }),
      this.prisma.approvalRequest.count({ where: { status: "APPROVED" } }),
      this.prisma.approvalRequest.count({ where: { status: "REJECTED" } }),
    ]);
    return { pending, approved, rejected };
  }
}
