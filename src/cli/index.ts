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
 *   Phase 12: ae memory
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

// === Placeholder command groups (added in future phases) ===
program
  .command("agent")
  .description("Manage AI agents (Phase 6-7)")
  .action(() => {
    console.log(JSON.stringify({ message: "Agent commands available from Phase 6" }));
  });

program
  .command("task")
  .description("Manage tasks (Phase 9)")
  .action(() => {
    console.log(JSON.stringify({ message: "Task commands available from Phase 9" }));
  });

program
  .command("company")
  .description("Manage company structure (Phase 6)")
  .action(() => {
    console.log(JSON.stringify({ message: "Company commands available from Phase 6" }));
  });

program
  .command("memory")
  .description("Knowledge base operations (Phase 10-12)")
  .action(() => {
    console.log(JSON.stringify({ message: "Memory commands available from Phase 10" }));
  });

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
