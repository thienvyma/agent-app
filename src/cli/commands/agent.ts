/**
 * CLI commands for agent management.
 *
 * ae agent create --dept ID --role ROLE --name NAME --model MODEL --sop "..."
 * ae agent list [--company-id ID]
 *
 * @module cli/commands/agent
 */

import { Command } from "commander";
import { prisma } from "@/lib/prisma";
import { CompanyManager } from "@/core/company/company-manager";
import { formatOutput, OutputFormat } from "@/cli/utils/output";

const manager = new CompanyManager(prisma);

export const agentCommand = new Command("agent")
  .description("Manage AI agents");

agentCommand
  .command("create")
  .description("Create a new agent")
  .requiredOption("--dept <deptId>", "Department ID")
  .requiredOption("--name <name>", "Agent name")
  .requiredOption("--role <role>", "Agent role (ceo, marketing, finance)")
  .requiredOption("--model <model>", "LLM model (e.g., qwen2.5:7b)")
  .option("--sop <sop>", "Standard Operating Procedure", "")
  .option("--tools <tools>", "Comma-separated tools", "")
  .option("--skills <skills>", "Comma-separated skills", "")
  .option("--always-on", "Run agent continuously", false)
  .option("-f, --format <format>", "Output format", "json")
  .action(async (options: {
    dept: string; name: string; role: string; model: string;
    sop: string; tools: string; skills: string; alwaysOn: boolean;
    format: string;
  }) => {
    try {
      const agent = await manager.createAgent(options.dept, {
        name: options.name,
        role: options.role,
        model: options.model,
        sop: options.sop,
        tools: options.tools ? options.tools.split(",").map((t) => t.trim()) : [],
        skills: options.skills ? options.skills.split(",").map((s) => s.trim()) : [],
        isAlwaysOn: options.alwaysOn,
      });

      console.log(formatOutput(
        { id: agent.id, name: agent.name, role: agent.role, status: "created" } as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to create agent",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

agentCommand
  .command("list")
  .description("List all agents")
  .option("-f, --format <format>", "Output format: json or table", "json")
  .action(async (options: { format: string }) => {
    try {
      const agents = await prisma.agent.findMany({
        include: { department: true },
        orderBy: { name: "asc" },
      });

      const data = agents.map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        department: a.department.name,
        model: a.model,
        status: a.status,
        isAlwaysOn: a.isAlwaysOn,
      }));

      console.log(formatOutput(
        { agents: data, total: data.length } as unknown as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to list agents",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });
