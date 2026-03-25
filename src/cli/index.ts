#!/usr/bin/env node

/**
 * Agentic Enterprise CLI — `ae` command entry point.
 *
 * Usage: ae <command> [options]
 *
 * Commands are added progressively per phase:
 *   Phase 2:  ae status
 *   Phase 6:  ae company, ae agent
 *   Phase 7:  ae agent deploy/undeploy
 *   Phase 8:  ae tool, ae audit
 *   Phase 9:  ae task
 *   Phase 10: ae memory
 *   Phase 13: ae message
 *   Phase 14: ae trigger
 *   Phase 15: ae approve
 *   Phase 18: ae cost
 *
 * @module cli/index
 */

import { Command } from "commander";
import { getStatusData } from "./commands/status";
import { formatOutput, OutputFormat } from "./utils/output";
import { companyCommand } from "./commands/company";
import { agentCommand } from "./commands/agent";
import { toolCommand, auditCommand } from "./commands/tool";
import { taskCommand } from "./commands/task";
import { registerMemoryCommands } from "./commands/memory";
import { messageCommand } from "./commands/message";
import { realtimeCommand } from "./commands/realtime";
import { feedbackCommand } from "./commands/feedback";
import { pipelineCommand } from "./commands/pipeline";

const program = new Command();

program
  .name("ae")
  .description("🏢 Agentic Enterprise — AI-powered business automation CLI")
  .version("0.1.0");

// === ae status ===
program
  .command("status")
  .description("Show system status: services, agents, tasks")
  .option("-f, --format <format>", "Output format: json or table", "json")
  .action(async (options: { format: string }) => {
    try {
      const data = await getStatusData();
      const format = (options.format as OutputFormat) || "json";
      console.log(formatOutput(data, format));
    } catch (error) {
      console.error(
        JSON.stringify({
          error: "Failed to get status",
          details: error instanceof Error ? error.message : String(error),
        })
      );
      process.exit(1);
    }
  });

// === ae company (Phase 6) ===
program.addCommand(companyCommand);

// === ae agent (Phase 6-7) ===
program.addCommand(agentCommand);

// === ae tool (Phase 8) ===
program.addCommand(toolCommand);

// === ae audit (Phase 8) ===
program.addCommand(auditCommand);

// === ae task (Phase 9) ===
program.addCommand(taskCommand);

// === ae memory (Phase 10) ===
registerMemoryCommands(program);

// === ae message (Phase 13) ===
program.addCommand(messageCommand);

// === ae realtime (Phase 19) ===
program.addCommand(realtimeCommand);

// === ae feedback (Phase 26) ===
program.addCommand(feedbackCommand);

// === ae pipeline (Phase 16) ===
program.addCommand(pipelineCommand);

const costCmd = program
  .command("cost")
  .description("Cost tracking & budget management (Phase 18)");

costCmd
  .command("report")
  .description("Show per-agent cost breakdown")
  .option("--period <period>", "Report period: day|week|month", "day")
  .action(async (options: { period: string }) => {
    try {
      const { CostTracker } = await import("@/core/cost/cost-tracker");
      const tracker = new CostTracker();
      const report = tracker.getReport(options.period);
      console.log(JSON.stringify(report, null, 2));
    } catch (error) {
      console.error("Error generating report:", error);
      process.exit(1);
    }
  });

const budgetCmd = costCmd
  .command("budget")
  .description("Budget management");

budgetCmd
  .command("set <agentId> <maxTokens>")
  .description("Set daily token budget for an agent")
  .action(async (agentId: string, maxTokens: string) => {
    try {
      console.log(JSON.stringify({
        action: "setBudget",
        agentId,
        maxTokensPerDay: parseInt(maxTokens, 10),
        message: "Budget set (requires running app context)",
      }, null, 2));
    } catch (error) {
      console.error("Error setting budget:", error);
      process.exit(1);
    }
  });

budgetCmd
  .command("list")
  .description("List all agents with budget status")
  .action(async () => {
    try {
      console.log(JSON.stringify({
        message: "Budget list (requires running app context with BudgetManager)",
        commands: [
          "ae cost report — per-agent cost breakdown",
          "ae cost budget set <agentId> <maxTokens> — set daily limit",
          "ae cost budget list — all agents budget status",
        ],
      }, null, 2));
    } catch (error) {
      console.error("Error listing budgets:", error);
      process.exit(1);
    }
  });

const triggerCmd = program
  .command("trigger")
  .description("External trigger management (Phase 14)");

triggerCmd
  .command("list")
  .description("List all registered triggers")
  .action(async () => {
    try {
      // In real usage, registry would be loaded from app context
      console.log(JSON.stringify({
        message: "Trigger list (requires running app context)",
        usage: "Use the TriggerRegistry API programmatically",
        commands: [
          "ae trigger list — show all triggers",
          "ae trigger fire <triggerId> — manually fire a trigger",
        ],
      }, null, 2));
    } catch (error) {
      console.error("Error listing triggers:", error);
      process.exit(1);
    }
  });

triggerCmd
  .command("fire <triggerId>")
  .description("Manually fire a trigger")
  .option("--payload <json>", "JSON payload", "{}")
  .action(async (triggerId: string, options: { payload: string }) => {
    try {
      console.log(JSON.stringify({
        action: "fire",
        triggerId,
        payload: JSON.parse(options.payload),
        message: "Trigger fired (requires running app context with TriggerRegistry)",
      }, null, 2));
    } catch (error) {
      console.error("Error firing trigger:", error);
      process.exit(1);
    }
  });

const approveCmd = program
  .command("approve")
  .description("Approval workflow — HITL (Phase 15)");

approveCmd
  .command("list")
  .description("List pending approval requests")
  .action(async () => {
    try {
      const { prisma: db } = await import("@/lib/prisma");
      const { ApprovalQueue } = await import("@/core/approval/approval-queue");
      const queue = new ApprovalQueue(db);

      const pending = await queue.getPending();
      const stats = await queue.getStats();

      console.log(JSON.stringify({
        stats,
        pending: pending.map((p) => ({
          id: p.id,
          task: p.task.description,
          reason: p.reason,
          policy: p.policy,
          createdAt: p.createdAt,
        })),
      }, null, 2));
    } catch (error) {
      console.error("Error listing approvals:", error);
      process.exit(1);
    }
  });

approveCmd
  .command("accept <id>")
  .description("Approve a pending request")
  .option("--response <text>", "Optional response message")
  .action(async (id: string, options: { response?: string }) => {
    try {
      const { prisma: db } = await import("@/lib/prisma");
      const { ApprovalEngine } = await import("@/core/approval/approval-engine");
      const engine = new ApprovalEngine(db);

      await engine.approve(id, options.response);
      console.log(JSON.stringify({ status: "approved", id }));
    } catch (error) {
      console.error("Error approving:", error);
      process.exit(1);
    }
  });

approveCmd
  .command("reject <id>")
  .description("Reject a pending request with feedback")
  .requiredOption("--feedback <text>", "Rejection feedback (creates CorrectionLog)")
  .action(async (id: string, options: { feedback: string }) => {
    try {
      const { prisma: db } = await import("@/lib/prisma");
      const { ApprovalEngine } = await import("@/core/approval/approval-engine");
      const engine = new ApprovalEngine(db);

      await engine.reject(id, options.feedback);
      console.log(JSON.stringify({ status: "rejected", id, feedback: options.feedback }));
    } catch (error) {
      console.error("Error rejecting:", error);
      process.exit(1);
    }
  });

program.parse();
