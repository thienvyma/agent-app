/**
 * CLI: ae pipeline — Pipeline status and execution commands.
 *
 * Commands:
 * - ae pipeline status  — show all 8 pipeline steps
 * - ae pipeline execute — run full pipeline for an agent
 *
 * @module cli/commands/pipeline
 */

import { Command } from "commander";

/** Pipeline step definition */
interface PipelineStep {
  step: number;
  name: string;
  module: string;
  description: string;
}

/** Pipeline status data */
interface PipelineStatusData {
  steps: PipelineStep[];
  totalSteps: number;
}

/** Pipeline execution result */
interface ExecutionResult {
  agentId: string;
  message: string;
  tokenUsed: number;
  budgetStatus: string;
  contextInjected: boolean;
}

/** Formatted execution for CLI */
interface FormattedExecution {
  agent: string;
  response: string;
  tokens: number;
  budgetStatus: string;
  contextInjected: boolean;
}

/** The 8 pipeline steps */
const PIPELINE_STEPS: PipelineStep[] = [
  { step: 1, name: "ApprovalPolicy", module: "approval-engine", description: "Check if task requires owner approval" },
  { step: 2, name: "ContextBuilder", module: "context-builder", description: "Build context from memory + corrections" },
  { step: 3, name: "IAgentEngine", module: "openclaw-adapter", description: "Send message to AI engine" },
  { step: 4, name: "CostTracker", module: "cost-tracker", description: "Track token usage" },
  { step: 5, name: "BudgetManager", module: "budget-manager", description: "Check budget limits" },
  { step: 6, name: "ConversationLogger", module: "conversation-logger", description: "Log conversation to memory" },
  { step: 7, name: "MessageBus", module: "message-bus", description: "Publish inter-agent messages" },
  { step: 8, name: "RealtimeHub", module: "realtime-hub", description: "Emit events for dashboard" },
];

/**
 * Get pipeline status with all 8 steps.
 */
export function getPipelineStatusData(): PipelineStatusData {
  return {
    steps: PIPELINE_STEPS,
    totalSteps: PIPELINE_STEPS.length,
  };
}

/**
 * Format pipeline execution result for CLI.
 */
export function formatPipelineExecution(result: ExecutionResult): FormattedExecution {
  return {
    agent: result.agentId,
    response: result.message,
    tokens: result.tokenUsed,
    budgetStatus: result.budgetStatus,
    contextInjected: result.contextInjected,
  };
}

/** Commander command */
export const pipelineCommand = new Command("pipeline")
  .description("🔧 Agent pipeline management (Phase 16)");

pipelineCommand
  .command("status")
  .description("Show all 8 pipeline steps and their modules")
  .action(() => {
    const data = getPipelineStatusData();
    console.log(JSON.stringify(data, null, 2));
  });

pipelineCommand
  .command("execute <agentId> <message>")
  .description("Execute full pipeline for an agent")
  .option("--model <model>", "Model name", "qwen2.5:7b")
  .action(async (agentId: string, message: string, options: { model: string }) => {
    try {
      console.log(JSON.stringify({
        action: "pipeline.execute",
        agentId,
        message,
        model: options.model,
        note: "Requires running app context with fully wired AgentPipeline",
        steps: PIPELINE_STEPS.map((s) => s.name),
      }, null, 2));
    } catch (error) {
      console.error("Error executing pipeline:", error);
      process.exit(1);
    }
  });
