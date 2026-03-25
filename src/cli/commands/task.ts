/**
 * CLI commands for task management.
 *
 * ae task assign <agentId> "description"
 * ae task list [--status pending|running|completed|failed]
 * ae task status <taskId>
 * ae task retry <taskId>
 *
 * @module cli/commands/task
 */

import { Command } from "commander";
import { prisma } from "@/lib/prisma";
import { formatOutput, OutputFormat } from "@/cli/utils/output";
import type { TaskStatus } from "@prisma/client";

export const taskCommand = new Command("task")
  .description("Manage tasks");

taskCommand
  .command("assign <agentId> <description>")
  .description("Create and assign a task to an agent")
  .option("--company <companyId>", "Company ID")
  .option("-f, --format <format>", "Output format", "json")
  .action(async (agentId: string, description: string, options: { company?: string; format: string }) => {
    try {
      const task = await prisma.task.create({
        data: {
          description,
          status: "IN_PROGRESS",
          assignedToId: agentId,
        },
      });
      console.log(formatOutput(
        { id: task.id, description, agentId, status: "IN_PROGRESS" } as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to assign task",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

taskCommand
  .command("list")
  .description("List tasks")
  .option("--status <status>", "Filter by status (PENDING, IN_PROGRESS, COMPLETED, FAILED)")
  .option("-f, --format <format>", "Output format", "json")
  .action(async (options: { status?: string; format: string }) => {
    try {
      const where = options.status ? { status: options.status as TaskStatus } : {};
      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignedTo: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      const data = tasks.map((t) => ({
        id: t.id,
        description: t.description.substring(0, 60),
        status: t.status,
        priority: t.priority,
        retryCount: t.retryCount,
        agent: t.assignedTo?.name ?? "unassigned",
      }));
      console.log(formatOutput(
        { tasks: data, total: data.length } as unknown as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to list tasks",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

taskCommand
  .command("status <taskId>")
  .description("Show task status and sub-tasks")
  .option("-f, --format <format>", "Output format", "json")
  .action(async (taskId: string, options: { format: string }) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignedTo: { select: { name: true, role: true } },
          subTasks: {
            include: { assignedTo: { select: { name: true } } },
          },
        },
      });
      if (!task) {
        console.error(JSON.stringify({ error: `Task ${taskId} not found` }));
        process.exit(1);
      }
      console.log(formatOutput(
        {
          id: task.id,
          description: task.description,
          status: task.status,
          agent: task.assignedTo?.name ?? "unassigned",
          retryCount: task.retryCount,
          subTasks: (task.subTasks as Array<{ id: string; description: string; status: string; assignedTo: { name: string } | null }>).map((s) => ({
            id: s.id,
            description: s.description.substring(0, 40),
            status: s.status,
            agent: s.assignedTo?.name ?? "unassigned",
          })),
        } as unknown as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to get task status",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

taskCommand
  .command("retry <taskId>")
  .description("Retry a failed task")
  .option("-f, --format <format>", "Output format", "json")
  .action(async (taskId: string, options: { format: string }) => {
    try {
      const task = await prisma.task.update({
        where: { id: taskId },
        data: { status: "PENDING", retryCount: { increment: 1 } },
      });
      console.log(formatOutput(
        { id: task.id, action: "retried", status: "PENDING" } as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to retry task",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });
