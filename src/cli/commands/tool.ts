/**
 * CLI commands for tool management and audit.
 *
 * ae tool list
 * ae tool grant <agentId> <toolName>
 * ae tool revoke <agentId> <toolName>
 * ae tool check <agentId> <toolName>
 * ae audit search --agent <id> --action USE_TOOL
 *
 * @module cli/commands/tool
 */

import { Command } from "commander";
import { prisma } from "@/lib/prisma";
import { ToolPermissionService } from "@/core/tools/tool-permission";
import { AuditLogger } from "@/core/tools/audit-logger";
import { formatOutput, OutputFormat } from "@/cli/utils/output";

const permission = new ToolPermissionService(prisma);
const audit = new AuditLogger(prisma);

export const toolCommand = new Command("tool")
  .description("Manage tools and permissions");

toolCommand
  .command("list")
  .description("List all tool permissions")
  .option("-f, --format <format>", "Output format", "json")
  .action(async (options: { format: string }) => {
    try {
      const perms = await prisma.toolPermission.findMany({
        include: { agent: { select: { name: true } } },
        orderBy: { toolName: "asc" },
      });
      const data = perms.map((p: { agentId: string; toolName: string; grantedBy: string; agent: { name: string } }) => ({
        agentId: p.agentId,
        agentName: p.agent.name,
        toolName: p.toolName,
        grantedBy: p.grantedBy,
      }));
      console.log(formatOutput(
        { permissions: data, total: data.length } as unknown as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to list tools",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

toolCommand
  .command("grant <agentId> <toolName>")
  .description("Grant agent permission to use a tool")
  .option("-f, --format <format>", "Output format", "json")
  .action(async (agentId: string, toolName: string, options: { format: string }) => {
    try {
      await permission.grant(agentId, toolName, "cli-admin");
      console.log(formatOutput(
        { agentId, toolName, action: "granted" } as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to grant permission",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

toolCommand
  .command("revoke <agentId> <toolName>")
  .description("Revoke agent's tool permission")
  .option("-f, --format <format>", "Output format", "json")
  .action(async (agentId: string, toolName: string, options: { format: string }) => {
    try {
      await permission.revoke(agentId, toolName);
      console.log(formatOutput(
        { agentId, toolName, action: "revoked" } as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to revoke permission",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

toolCommand
  .command("check <agentId> <toolName>")
  .description("Check if agent has tool permission")
  .option("-f, --format <format>", "Output format", "json")
  .action(async (agentId: string, toolName: string, options: { format: string }) => {
    try {
      const allowed = await permission.check(agentId, toolName);
      console.log(formatOutput(
        { agentId, toolName, allowed } as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to check permission",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

// === Audit commands ===

export const auditCommand = new Command("audit")
  .description("Search audit logs");

auditCommand
  .command("search")
  .description("Search audit logs with filters")
  .option("--agent <agentId>", "Filter by agent ID")
  .option("--action <action>", "Filter by action (DEPLOY, USE_TOOL, ERROR...)")
  .option("--from <date>", "From date (YYYY-MM-DD)")
  .option("-f, --format <format>", "Output format", "json")
  .action(async (options: { agent?: string; action?: string; from?: string; format: string }) => {
    try {
      const results = await audit.search({
        agentId: options.agent,
        action: options.action as "DEPLOY" | "USE_TOOL" | "ERROR" | undefined,
        from: options.from ? new Date(options.from) : undefined,
      });
      console.log(formatOutput(
        { logs: results, total: (results as unknown[]).length } as unknown as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to search audit logs",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });
