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

program
  .command("cost")
  .description("Cost tracking and budgets (Phase 18)")
  .action(() => {
    console.log(JSON.stringify({ message: "Cost commands available from Phase 18" }));
  });

program
  .command("trigger")
  .description("External triggers (Phase 14)")
  .action(() => {
    console.log(JSON.stringify({ message: "Trigger commands available from Phase 14" }));
  });

program
  .command("approve")
  .description("Approval workflow (Phase 15)")
  .action(() => {
    console.log(JSON.stringify({ message: "Approve commands available from Phase 15" }));
  });

program.parse();
