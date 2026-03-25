/**
 * AgentPipeline — central middleware chain for agent message execution.
 *
 * Wires ALL modules into the actual execution flow:
 *   ApprovalPolicy → ContextBuilder → IAgentEngine.sendMessage →
 *   CostTracker → BudgetManager → ConversationLogger → MessageBus
 *
 * This is the SINGLE POINT where an agent message goes through.
 * Every new module that affects the message flow MUST be integrated here.
 *
 * @see RULES.md Rule #14: Integration Verification
 * @module core/orchestrator/agent-pipeline
 */

import type { IAgentEngine } from "@/core/adapter/i-agent-engine";
import type { AgentResponse } from "@/types/agent";
import type { CostTracker } from "@/core/cost/cost-tracker";
import type { BudgetManager, BudgetStatus } from "@/core/cost/budget-manager";

/** Minimal ContextBuilder interface (from S12) */
interface IContextBuilder {
  build(agentId: string): Promise<string>;
}

/** Minimal MessageBus interface (from S13) */
interface IMessageBus {
  publish(channel: string, message: unknown): void;
}

/** Minimal ApprovalPolicy interface (from S15) */
interface IApprovalPolicy {
  evaluate(taskDescription: string): { decision: string; matchedRules: string[] };
}

/** Minimal ConversationLogger interface (from S10) */
interface IConversationLogger {
  log(agentId: string, role: string, content: string): Promise<void>;
}

/** Minimal RealtimeHub interface (from S19) */
interface IRealtimeHub {
  emit<T = unknown>(event: string, data: T): void;
}

/** Pipeline dependencies */
export interface PipelineDeps {
  engine: IAgentEngine;
  contextBuilder: IContextBuilder;
  costTracker: CostTracker;
  budgetManager: BudgetManager;
  messageBus: IMessageBus;
  approvalPolicy?: IApprovalPolicy;
  conversationLogger?: IConversationLogger;
  realtimeHub?: IRealtimeHub;
}

/** Extended response with pipeline metadata */
export interface PipelineResponse extends AgentResponse {
  budgetStatus: BudgetStatus;
  contextInjected: boolean;
}

/**
 * Central pipeline for agent message execution.
 * Every message to an agent goes through this pipeline.
 *
 * Flow:
 * 1. Check approval (ApprovalPolicy) — block if requires owner approval
 * 2. Build context (ContextBuilder) — inject memory/knowledge
 * 3. Send message (IAgentEngine) — OpenClaw processes
 * 4. Track cost (CostTracker) — count tokens
 * 5. Check budget (BudgetManager) — warn/pause if exceeded
 * 6. Log conversation (ConversationLogger) — save to memory
 * 7. Publish response (MessageBus) — notify subscribers
 */
export class AgentPipeline {
  private readonly engine: IAgentEngine;
  private readonly contextBuilder: IContextBuilder;
  private readonly costTracker: CostTracker;
  private readonly budgetManager: BudgetManager;
  private readonly messageBus: IMessageBus;
  private readonly approvalPolicy: IApprovalPolicy | null;
  private readonly conversationLogger: IConversationLogger | null;
  private readonly realtimeHub: IRealtimeHub | null;

  constructor(deps: PipelineDeps) {
    this.engine = deps.engine;
    this.contextBuilder = deps.contextBuilder;
    this.costTracker = deps.costTracker;
    this.budgetManager = deps.budgetManager;
    this.messageBus = deps.messageBus;
    this.approvalPolicy = deps.approvalPolicy ?? null;
    this.conversationLogger = deps.conversationLogger ?? null;
    this.realtimeHub = deps.realtimeHub ?? null;
  }

  /**
   * Execute a message through the full pipeline.
   *
   * @param agentId - Target agent ID
   * @param message - Message content
   * @param model - Model name for cost tracking (default: qwen2.5:7b)
   * @returns PipelineResponse with agent response + budget status
   * @throws Error if approval required or engine fails
   */
  async execute(
    agentId: string,
    message: string,
    model: string = "qwen2.5:7b"
  ): Promise<PipelineResponse> {
    // Step 1: Check approval policy (if configured)
    if (this.approvalPolicy) {
      const evaluation = this.approvalPolicy.evaluate(message);
      if (evaluation.decision === "approval-required") {
        throw new Error(
          `Approval required: matched rules [${evaluation.matchedRules.join(", ")}]`
        );
      }
    }

    // Step 2: Build context (graceful — continue without context on failure)
    let context: string | undefined;
    let contextInjected = false;
    try {
      context = await this.contextBuilder.build(agentId);
      contextInjected = true;
    } catch {
      // Context unavailable — proceed without it
      context = undefined;
    }

    // Step 3: Send message via IAgentEngine (OpenClaw)
    // This is the ONLY place in the app that calls engine.sendMessage
    const response = await this.engine.sendMessage(agentId, message, context);

    // Step 4: Track cost (only on success)
    this.costTracker.trackUsage(agentId, response.tokenUsed, model);

    // Step 5: Check budget
    const budgetCheck = this.budgetManager.checkBudget(agentId);

    // Step 6: Log conversation (if configured)
    if (this.conversationLogger) {
      try {
        await this.conversationLogger.log(agentId, "user", message);
        await this.conversationLogger.log(agentId, "assistant", response.message);
      } catch {
        // Logging failure should not block response
      }
    }

    // Step 7: Publish to MessageBus
    this.messageBus.publish("agent:response", {
      agentId: response.agentId,
      message: response.message,
      tokenUsed: response.tokenUsed,
      budgetStatus: budgetCheck.status,
      timestamp: response.timestamp,
    });

    // Step 8: Emit to RealtimeHub for SSE/dashboard (if configured)
    if (this.realtimeHub) {
      this.realtimeHub.emit("agent:response", {
        agentId: response.agentId,
        message: response.message,
        tokenUsed: response.tokenUsed,
        budgetStatus: budgetCheck.status,
        contextInjected,
      });
    }

    return {
      ...response,
      budgetStatus: budgetCheck.status,
      contextInjected,
    };
  }
}
