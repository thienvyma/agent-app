/**
 * CLI commands for company management.
 *
 * ae company create --name "..."
 * ae company info [--id ID]
 *
 * @module cli/commands/company
 */

import { Command } from "commander";
import { prisma } from "@/lib/prisma";
import { CompanyManager } from "@/core/company/company-manager";
import { HierarchyEngine } from "@/core/company/hierarchy-engine";
import { formatOutput, OutputFormat } from "@/cli/utils/output";

const manager = new CompanyManager(prisma);
const hierarchy = new HierarchyEngine(prisma);

export const companyCommand = new Command("company")
  .description("Manage company structure");

companyCommand
  .command("create")
  .description("Create a new company")
  .requiredOption("--name <name>", "Company name")
  .option("--description <desc>", "Company description")
  .option("-f, --format <format>", "Output format: json or table", "json")
  .action(async (options: { name: string; description?: string; format: string }) => {
    try {
      const company = await manager.createCompany({
        name: options.name,
        description: options.description,
      });
      console.log(formatOutput(
        { id: company.id, name: company.name, status: "created" } as Record<string, unknown>,
        options.format as OutputFormat
      ));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to create company",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

companyCommand
  .command("info")
  .description("Show company org chart")
  .option("--id <id>", "Company ID (defaults to first company)")
  .option("-f, --format <format>", "Output format: json or table", "json")
  .action(async (options: { id?: string; format: string }) => {
    try {
      let companyId = options.id;

      // Default to first company if no ID given
      if (!companyId) {
        const first = await prisma.company.findFirst();
        if (!first) {
          console.error(JSON.stringify({ error: "No companies found" }));
          process.exit(1);
          return;
        }
        companyId = first.id;
      }

      const tree = await hierarchy.getOrgTree(companyId);
      console.log(formatOutput(tree as unknown as Record<string, unknown>, options.format as OutputFormat));
    } catch (error) {
      console.error(JSON.stringify({
        error: "Failed to get company info",
        details: error instanceof Error ? error.message : String(error),
      }));
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });
