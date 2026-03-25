/**
 * ApprovalQueue — query pending approvals and stats.
 *
 * Read-only view into the approval workflow state.
 *
 * @module core/approval/approval-queue
 */

import type { PrismaClient } from "@prisma/client";
import { ApprovalStatus } from "@prisma/client";

/** Approval stats summary */
export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  modified: number;
}

/**
 * Provides read access to approval requests.
 */
export class ApprovalQueue {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Get all pending approval requests.
   *
   * @returns Pending requests with task details
   */
  async getPending() {
    return this.db.approvalRequest.findMany({
      where: { status: ApprovalStatus.PENDING },
      include: {
        task: {
          select: {
            id: true,
            description: true,
            assignedToId: true,
            result: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Get approval requests for a specific agent's tasks.
   *
   * @param agentId - Agent ID to filter by
   * @returns Requests for tasks assigned to this agent
   */
  async getByAgent(agentId: string) {
    return this.db.approvalRequest.findMany({
      where: {
        task: { assignedToId: agentId },
      },
      include: {
        task: {
          select: { id: true, description: true, result: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get approval stats summary.
   *
   * @returns Counts by status
   */
  async getStats(): Promise<ApprovalStats> {
    const [pending, approved, rejected, modified] = await Promise.all([
      this.db.approvalRequest.count({ where: { status: ApprovalStatus.PENDING } }),
      this.db.approvalRequest.count({ where: { status: ApprovalStatus.APPROVED } }),
      this.db.approvalRequest.count({ where: { status: ApprovalStatus.REJECTED } }),
      this.db.approvalRequest.count({ where: { status: ApprovalStatus.MODIFIED } }),
    ]);

    return { pending, approved, rejected, modified };
  }
}
