/**
 * TaskDecomposer — breaks complex tasks into sub-tasks via CEO agent.
 *
 * Flow: Owner message → CEO analyzes → sub-tasks created → assigned by role.
 *
 * @module core/tasks/task-decomposer
 */

import type { PrismaClient } from "@prisma/client";
import type { IAgentEngine } from "@/core/adapter/i-agent-engine";
import type { HierarchyEngine } from "@/core/company/hierarchy-engine";

/** Plan produced by decomposition */
export interface DecompositionPlan {
  parentTaskId: string;
  subTasks: Array<{
    taskId: string;
    description: string;
    role: string;
    agentId: string | null;
    agentName: string | null;
    priority: number;
  }>;
}

/** Report of collected task results */
export interface TaskReport {
  parentTaskId: string;
  allCompleted: boolean;
  results: Array<{
    taskId: string;
    status: string;
    result: string | null;
  }>;
  failedCount: number;
}

/**
 * Decomposes complex tasks into sub-tasks and manages assignment.
 */
export class TaskDecomposer {
  constructor(
    private readonly engine: IAgentEngine,
    private readonly hierarchy: HierarchyEngine,
    private readonly db: PrismaClient
  ) {}

  /**
   * Decompose a complex task via CEO agent.
   *
   * 1. Send to CEO for analysis
   * 2. Parse sub-task breakdown
   * 3. Find agents by role via HierarchyEngine
   * 4. Create Task records in DB
   */
  async decompose(
    taskDescription: string,
    ceoAgentId: string,
    companyId: string
  ): Promise<DecompositionPlan> {
    // 1. Ask CEO to analyze and decompose
    const prompt = `Phân tích và chia nhỏ task sau thành các sub-task. 
Trả về JSON: { "subTasks": [{ "description": "...", "role": "marketing|finance|design|support|hr", "priority": 1 }] }

Task: ${taskDescription}`;

    const ceoResponse = await this.engine.sendMessage(ceoAgentId, prompt);

    // 2. Parse CEO response
    let subTaskDefs: Array<{ description: string; role: string; priority: number }>;
    try {
      const parsed = JSON.parse(ceoResponse.message) as { subTasks: Array<{ description: string; role: string; priority: number }> };
      subTaskDefs = parsed.subTasks;
    } catch {
      // If CEO doesn't return valid JSON, create single task
      subTaskDefs = [{ description: taskDescription, role: "ceo", priority: 1 }];
    }

    // 3. Create parent task
    const parentTask = await this.db.task.create({
      data: {
        description: taskDescription,
        status: "PENDING",
        companyId,
        createdById: ceoAgentId,
      },
    });

    // 4. Create sub-tasks and find agents
    const subTasks: DecompositionPlan["subTasks"] = [];

    for (const def of subTaskDefs) {
      // Find agent by role
      const agents = await this.hierarchy.findAgentsByRole(companyId, def.role);
      const agent = agents.length > 0 ? agents[0] : null;

      const subTask = await this.db.task.create({
        data: {
          description: def.description,
          status: "PENDING",
          priority: def.priority,
          parentTaskId: parentTask.id,
          companyId,
          createdById: ceoAgentId,
          assignedToId: agent?.id ?? null,
        },
      });

      subTasks.push({
        taskId: subTask.id,
        description: def.description,
        role: def.role,
        agentId: agent?.id ?? null,
        agentName: agent?.name ?? null,
        priority: def.priority,
      });
    }

    // 5. Audit log
    await this.db.auditLog.create({
      data: {
        agentId: ceoAgentId,
        action: "COMPLETE_TASK",
        details: {
          type: "decomposition",
          parentTaskId: parentTask.id,
          subTaskCount: subTasks.length,
        },
      },
    });

    return { parentTaskId: parentTask.id, subTasks };
  }

  /**
   * Assign a task to an agent and notify them.
   */
  async assignTask(
    taskId: string,
    agentId: string,
    description: string
  ): Promise<void> {
    // Update DB
    await this.db.task.update({
      where: { id: taskId },
      data: {
        assignedToId: agentId,
        status: "IN_PROGRESS",
      },
    });

    // Send task to agent
    await this.engine.sendMessage(
      agentId,
      `Bạn được giao task: ${description}. Hãy thực hiện và trả về kết quả.`
    );

    // Audit
    await this.db.auditLog.create({
      data: {
        agentId,
        action: "COMPLETE_TASK",
        details: { type: "assignment", taskId },
      },
    });
  }

  /**
   * Collect results from all sub-tasks of a parent task.
   */
  async collectResults(parentTaskId: string): Promise<TaskReport> {
    const subTasks = await this.db.task.findMany({
      where: { parentTaskId },
      orderBy: { priority: "asc" },
    });

    const results = subTasks.map((t: { id: string; status: string; result: string | null }) => ({
      taskId: t.id,
      status: t.status,
      result: t.result,
    }));

    const allCompleted = subTasks.every(
      (t: { status: string }) => t.status === "COMPLETED"
    );
    const failedCount = subTasks.filter(
      (t: { status: string }) => t.status === "FAILED"
    ).length;

    return {
      parentTaskId,
      allCompleted,
      results,
      failedCount,
    };
  }
}
