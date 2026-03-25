/**
 * ApprovalEngine — manages HITL approval workflow.
 *
 * Flow: Agent completes task → PolicyEngine flags → ApprovalRequest created
 * → Owner approves/rejects/modifies → task resumes or CorrectionLog created.
 *
 * @module core/approval/approval-engine
 */

import type { PrismaClient } from "@prisma/client";
import { ApprovalStatus } from "@prisma/client";

/**
 * Manages approval requests for human-in-the-loop workflow.
 */
export class ApprovalEngine {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Create a new approval request for a task.
   *
   * @param taskId - Task requiring approval
   * @param agentId - Agent that completed the task
   * @param policy - Policy rule that triggered approval
   * @param reason - Human-readable reason for approval
   * @returns Created ApprovalRequest
   */
  async requestApproval(
    taskId: string,
    agentId: string,
    policy: string,
    reason: string
  ) {
    const request = await this.db.approvalRequest.create({
      data: {
        taskId,
        status: ApprovalStatus.PENDING,
        policy,
        reason,
      },
    });

    return request;
  }

  /**
   * Approve a pending request.
   *
   * @param approvalId - Approval request ID
   * @param response - Optional owner response message
   */
  async approve(approvalId: string, response?: string): Promise<void> {
    await this.db.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: ApprovalStatus.APPROVED,
        ownerResponse: response ?? null,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Reject a request and create a CorrectionLog for self-learning.
   *
   * @param approvalId - Approval request ID
   * @param feedback - Owner's correction feedback
   * @throws Error if approval not found
   */
  async reject(approvalId: string, feedback: string): Promise<void> {
    // Load approval with task details
    const approval = await this.db.approvalRequest.findUnique({
      where: { id: approvalId },
      include: { task: true },
    });

    if (!approval) {
      throw new Error(`Approval request ${approvalId} not found`);
    }

    // Update status
    await this.db.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: ApprovalStatus.REJECTED,
        ownerResponse: feedback,
        resolvedAt: new Date(),
      },
    });

    // Create CorrectionLog for self-learning (Phase 26)
    await this.db.correctionLog.create({
      data: {
        taskId: approval.taskId,
        agentId: approval.task.assignedToId ?? "unknown",
        context: approval.task.description,
        wrongOutput: approval.task.result ?? "",
        correction: feedback,
        ruleExtracted: `From rejection: ${feedback}`,
      },
    });
  }

  /**
   * Modify a request — owner wants changes before final approval.
   *
   * @param approvalId - Approval request ID
   * @param modifications - What the owner wants changed
   */
  async modify(approvalId: string, modifications: string): Promise<void> {
    await this.db.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: ApprovalStatus.MODIFIED,
        ownerResponse: modifications,
        resolvedAt: new Date(),
      },
    });
  }
}
