/**
 * ServiceContainer — Dependency Injection container for the full pipeline.
 *
 * Creates and wires all 8 pipeline dependencies:
 *   1. ApprovalPolicy    → check rules
 *   2. ContextBuilder    → inject memory/knowledge
 *   3. PromptInjector    → inject correction rules (via ContextBuilder)
 *   4. IAgentEngine      → OpenClaw or Mock
 *   5. CostTracker       → token counting
 *   6. BudgetManager     → budget check
 *   7. ConversationLogger→ save to memory
 *   8. RealtimeHub       → push SSE events
 *
 * Supports mock and real service injection via config.
 *
 * @module lib/service-container
 */

import { MockAdapter } from "@/core/adapter/mock-adapter";
import { OpenClawAdapter } from "@/core/adapter/openclaw-adapter";
import { OpenClawClient } from "@/core/adapter/openclaw-client";
import { CostTracker } from "@/core/cost/cost-tracker";
import { BudgetManager } from "@/core/cost/budget-manager";
import { RealtimeHub } from "@/core/realtime/realtime-hub";
import { AgentPipeline } from "@/core/orchestrator/agent-pipeline";
import type { IAgentEngine } from "@/core/adapter/i-agent-engine";

/** Container configuration */
export interface ContainerConfig {
  /** Use MockAdapter instead of OpenClawAdapter */
  useMock?: boolean;
  /** Patterns that require approval (for ApprovalPolicy) */
  blockedPatterns?: string[];
  /** OpenClaw Gateway URL (default: from env or localhost:18789) */
  openclawUrl?: string;
}

/** All resolved pipeline dependencies */
export interface ServiceContainer {
  engine: IAgentEngine;
  contextBuilder: { build(agentId: string): Promise<string> };
  costTracker: CostTracker;
  budgetManager: BudgetManager;
  messageBus: { publish(channel: string, message: unknown): void };
  approvalPolicy: { evaluate(taskDescription: string): { decision: string; matchedRules: string[] } };
  conversationLogger: { log(agentId: string, role: string, content: string): Promise<void> };
  realtimeHub: RealtimeHub;
}

/**
 * Create a fully wired service container.
 *
 * @param config - Container configuration
 * @returns All pipeline dependencies, ready to inject
 */
export function createServiceContainer(config: ContainerConfig = {}): ServiceContainer {
  const { useMock = true, blockedPatterns = [], openclawUrl } = config;

  // 1. Engine (IAgentEngine) — OpenClawAdapter: internal Map + /v1/chat/completions
  const engine: IAgentEngine = useMock
    ? new MockAdapter()
    : new OpenClawAdapter(new OpenClawClient(openclawUrl));

  // 2. ContextBuilder (mock — returns empty context)
  const contextBuilder = {
    build: async (_agentId: string): Promise<string> => {
      return "Context: company knowledge base";
    },
  };

  // 3. CostTracker
  const costTracker = new CostTracker();

  // 4. BudgetManager
  const budgetManager = new BudgetManager(costTracker);

  // 5. MessageBus (simple in-memory)
  const publishedMessages: { channel: string; message: unknown }[] = [];
  const messageBus = {
    publish: (channel: string, message: unknown): void => {
      publishedMessages.push({ channel, message });
    },
  };

  // 6. ApprovalPolicy
  const approvalPolicy = {
    evaluate: (taskDescription: string): { decision: string; matchedRules: string[] } => {
      const lower = taskDescription.toLowerCase();
      const matched = blockedPatterns.filter((p) => lower.includes(p.toLowerCase()));
      return {
        decision: matched.length > 0 ? "approval-required" : "approved",
        matchedRules: matched,
      };
    },
  };

  // 7. ConversationLogger (in-memory)
  const conversationLogger = {
    log: async (_agentId: string, _role: string, _content: string): Promise<void> => {
      // In production: save to DB via Prisma
    },
  };

  // 8. RealtimeHub
  const realtimeHub = new RealtimeHub();

  return {
    engine,
    contextBuilder,
    costTracker,
    budgetManager,
    messageBus,
    approvalPolicy,
    conversationLogger,
    realtimeHub,
  };
}

/**
 * Create an AgentPipeline from a service container.
 *
 * @param container - Resolved service container
 * @returns Fully wired AgentPipeline
 */
export function createPipelineFromContainer(container: ServiceContainer): AgentPipeline {
  return new AgentPipeline({
    engine: container.engine,
    contextBuilder: container.contextBuilder,
    costTracker: container.costTracker,
    budgetManager: container.budgetManager,
    messageBus: container.messageBus,
    approvalPolicy: container.approvalPolicy,
    conversationLogger: container.conversationLogger,
    realtimeHub: container.realtimeHub,
  });
}
