/**
 * CLI: ae feedback — Self-learning feedback commands.
 *
 * Commands:
 * - ae feedback list   — list correction logs
 * - ae feedback stats  — correction statistics
 * - ae feedback inject — preview prompt injection
 *
 * @module cli/commands/feedback
 */

import { Command } from "commander";
import { PromptInjector } from "@/core/feedback/prompt-injector";

/** Correction entry for CLI display */
interface CorrectionDisplay {
  id: string;
  agentId: string;
  taskContext: string;
  ruleExtracted: string;
  createdAt: Date;
}

/** Formatted correction for CLI */
interface FormattedCorrection {
  id: string;
  agent: string;
  context: string;
  rule: string;
  date: string;
}

/** Stats input */
interface StatsInput {
  total: number;
  byAgent: Record<string, number>;
}

/** Formatted stats */
interface FormattedFeedbackStats {
  total: number;
  topAgent: string;
  byAgent: Record<string, number>;
}

/**
 * Format correction entries for CLI.
 */
export function getFeedbackListData(entries: CorrectionDisplay[]): FormattedCorrection[] {
  return entries.map((e) => ({
    id: e.id,
    agent: e.agentId,
    context: e.taskContext,
    rule: e.ruleExtracted,
    date: e.createdAt.toISOString(),
  }));
}

/**
 * Format feedback stats for CLI.
 */
export function getFeedbackStats(stats: StatsInput): FormattedFeedbackStats {
  const topAgent = Object.entries(stats.byAgent)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? "none";

  return {
    total: stats.total,
    topAgent,
    byAgent: stats.byAgent,
  };
}

/**
 * Preview prompt injection for an agent.
 */
export function previewPromptInjection(input: {
  sop: string;
  corrections: { ruleExtracted: string; taskContext: string }[];
  knowledge: string[];
}): string {
  const injector = new PromptInjector();
  return injector.inject(input);
}

/** Commander command */
export const feedbackCommand = new Command("feedback")
  .description("🧠 Self-learning feedback management (Phase 26)");

feedbackCommand
  .command("list")
  .description("List all correction logs")
  .option("--agent <agentId>", "Filter by agent")
  .action(async (options: { agent?: string }) => {
    try {
      const { CorrectionLogManager } = await import("@/core/feedback/correction-log");
      const manager = new CorrectionLogManager();
      const entries = options.agent
        ? manager.getByAgent(options.agent)
        : manager.getAll();
      console.log(JSON.stringify(getFeedbackListData(entries), null, 2));
    } catch (error) {
      console.error("Error listing corrections:", error);
      process.exit(1);
    }
  });

feedbackCommand
  .command("stats")
  .description("Show correction statistics")
  .action(async () => {
    try {
      const { CorrectionLogManager } = await import("@/core/feedback/correction-log");
      const manager = new CorrectionLogManager();
      const stats = manager.getStats();
      console.log(JSON.stringify(getFeedbackStats(stats), null, 2));
    } catch (error) {
      console.error("Error fetching stats:", error);
      process.exit(1);
    }
  });

feedbackCommand
  .command("inject <agentId>")
  .description("Preview prompt injection for an agent")
  .option("--task <desc>", "Task description for context", "sample task")
  .action(async (agentId: string, options: { task: string }) => {
    try {
      const { CorrectionLogManager } = await import("@/core/feedback/correction-log");
      const manager = new CorrectionLogManager();
      const corrections = manager.getRelevant(options.task, 10);

      const preview = previewPromptInjection({
        sop: `[SOP for agent ${agentId}]`,
        corrections: corrections.map((c) => ({ ruleExtracted: c.ruleExtracted, taskContext: c.taskContext })),
        knowledge: [],
      });

      console.log(preview);
    } catch (error) {
      console.error("Error previewing injection:", error);
      process.exit(1);
    }
  });
