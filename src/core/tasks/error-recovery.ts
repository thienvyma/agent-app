/**
 * ErrorRecovery — retry, reassign, escalate, and partial save.
 *
 * When a task fails:
 *   retryCount < 3 → RETRY (resend to same agent)
 *   retryCount >= 3 + alternate agent → REASSIGN
 *   no alternate → ESCALATE to CEO/owner
 *   Always: save partial result if available
 *
 * @module core/tasks/error-recovery
 */

import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

/** Recovery action taken */
export enum RecoveryAction {
  RETRY = "RETRY",
  REASSIGN = "REASSIGN",
  ESCALATE = "ESCALATE",
  ABORT = "ABORT",
}

/** Task shape expected by ErrorRecovery */
interface FailedTask {
  id: string;
  retryCount: number;
  assignedToId: string | null;
  status: string;
  assignedTo?: {
    role: string;
    departmentId: string;
  };
}

/**
 * Handles task failures with retry → reassign → escalate strategy.
 */
export class ErrorRecovery {
  private readonly maxRetries = 3;

  constructor(private readonly db: PrismaClient) {}

  /**
   * Handle a task failure.
   *
   * @param task - Failed task record
   * @param error - The error that caused failure
   * @returns RecoveryAction taken
   */
  async handleFailure(
    task: FailedTask,
    error: Error
  ): Promise<RecoveryAction> {
    const currentRetry = task.retryCount ?? 0;

    // Strategy 1: Retry (retryCount < maxRetries)
    if (currentRetry < this.maxRetries) {
      await this.db.task.update({
        where: { id: task.id },
        data: {
          retryCount: currentRetry + 1,
          status: "PENDING",
        },
      });

      await this.db.auditLog.create({
        data: {
          agentId: task.assignedToId ?? "system",
          action: "ERROR",
          details: {
            taskId: task.id,
            recovery: RecoveryAction.RETRY,
            retryCount: currentRetry + 1,
            error: error.message,
          } as Prisma.InputJsonValue,
        },
      });

      return RecoveryAction.RETRY;
    }

    // Strategy 2: Reassign (find alternate agent with same role)
    if (task.assignedTo) {
      const alternates = await this.db.agent.findMany({
        where: {
          role: task.assignedTo.role,
          id: { not: task.assignedToId ?? undefined },
          departmentId: task.assignedTo.departmentId,
        },
      });

      if (alternates.length > 0) {
        const alternate = alternates[0]!;
        await this.db.task.update({
          where: { id: task.id },
          data: {
            assignedToId: alternate.id,
            retryCount: 0, // Reset for new agent
            status: "PENDING",
          },
        });

        await this.db.auditLog.create({
          data: {
            agentId: alternate.id,
            action: "ERROR",
            details: {
              taskId: task.id,
              recovery: RecoveryAction.REASSIGN,
              previousAgent: task.assignedToId,
              error: error.message,
            } as Prisma.InputJsonValue,
          },
        });

        return RecoveryAction.REASSIGN;
      }
    }

    // Strategy 3: Escalate (no alternate available)
    await this.db.task.update({
      where: { id: task.id },
      data: { status: "FAILED" },
    });

    await this.db.auditLog.create({
      data: {
        agentId: task.assignedToId ?? "system",
        action: "ESCALATION",
        details: {
          taskId: task.id,
          recovery: RecoveryAction.ESCALATE,
          reason: `Task failed after ${this.maxRetries} retries, no alternate agent`,
          error: error.message,
        } as Prisma.InputJsonValue,
      },
    });

    return RecoveryAction.ESCALATE;
  }

  /**
   * Save partial result even when task fails.
   */
  async partialSave(taskId: string, partialResult: string): Promise<void> {
    await this.db.task.update({
      where: { id: taskId },
      data: { result: partialResult },
    });
  }

  /**
   * Explicitly escalate a task to CEO/owner.
   */
  async escalate(taskId: string, reason: string): Promise<void> {
    await this.db.task.update({
      where: { id: taskId },
      data: { status: "FAILED" },
    });

    await this.db.auditLog.create({
      data: {
        agentId: "system",
        action: "ESCALATION",
        details: { taskId, reason } as Prisma.InputJsonValue,
      },
    });
  }
}
