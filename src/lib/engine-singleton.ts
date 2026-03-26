/**
 * Engine Singleton — global engine + pipeline instances.
 *
 * Provides singleton access to:
 * - IAgentEngine (via AdapterFactory.createWithFallback)
 * - AgentPipeline (via ServiceContainer wiring)
 *
 * Used by API routes, CLI, and Telegram handlers.
 * Ensures single engine instance across the entire application.
 *
 * @module lib/engine-singleton
 */

import type { IAgentEngine } from "@/core/adapter/i-agent-engine";
import type { AgentPipeline } from "@/core/orchestrator/agent-pipeline";
import { AdapterFactory } from "@/core/adapter/adapter-factory";
import { CostTracker } from "@/core/cost/cost-tracker";
import { BudgetManager } from "@/core/cost/budget-manager";
import { RealtimeHub } from "@/core/realtime/realtime-hub";
import { AgentPipeline as AgentPipelineClass } from "@/core/orchestrator/agent-pipeline";

/** Singleton instances */
let engineInstance: IAgentEngine | null = null;
let pipelineInstance: AgentPipeline | null = null;
let costTrackerInstance: CostTracker | null = null;
let realtimeHubInstance: RealtimeHub | null = null;

/**
 * Get the global engine instance (lazy initialization).
 *
 * Uses AdapterFactory.createWithFallback():
 * - Tries OpenClaw first (if USE_MOCK_ADAPTER !== "true")
 * - Falls back to MockAdapter if unreachable
 *
 * After creation, auto-deploys all DB agents into the engine's
 * in-memory Map so they're immediately available for chat.
 *
 * @returns Global IAgentEngine instance
 */
export async function getEngine(): Promise<IAgentEngine> {
  if (!engineInstance) {
    engineInstance = await AdapterFactory.createWithFallback();

    // Auto-deploy all existing DB agents into engine cache
    try {
      const { prisma } = await import("@/lib/prisma");
      const dbAgents = await prisma.agent.findMany({
        select: {
          id: true,
          name: true,
          role: true,
          sop: true,
          model: true,
          tools: true,
          skills: true,
          isAlwaysOn: true,
          cronSchedule: true,
        },
      });

      for (const agent of dbAgents) {
        try {
          await engineInstance.deploy({
            id: agent.id,
            name: agent.name,
            role: agent.role,
            sop: agent.sop,
            model: agent.model,
            tools: agent.tools as string[],
            skills: agent.skills as string[],
            isAlwaysOn: agent.isAlwaysOn,
            cronSchedule: agent.cronSchedule ?? undefined,
          });
        } catch {
          // Agent may already exist or other deploy issue — skip
        }
      }

      console.log(`[EngineSingleton] Auto-deployed ${dbAgents.length} agents from DB`);
    } catch (err) {
      console.warn("[EngineSingleton] Failed to auto-deploy DB agents:", err);
    }
  }
  return engineInstance;
}

/**
 * Get the global pipeline instance (lazy initialization).
 *
 * Creates pipeline with:
 * - Engine from getEngine()
 * - CostTracker, BudgetManager, RealtimeHub (global instances)
 * - ContextBuilder, MessageBus, ApprovalPolicy, ConversationLogger (in-memory)
 *
 * @returns Global AgentPipeline instance
 */
export async function getPipeline(): Promise<AgentPipeline> {
  if (!pipelineInstance) {
    const engine = await getEngine();

    // Global cost tracker (shared across pipeline calls)
    if (!costTrackerInstance) {
      costTrackerInstance = new CostTracker();
    }

    // Global realtime hub (shared for SSE broadcasting)
    if (!realtimeHubInstance) {
      realtimeHubInstance = new RealtimeHub();
    }

    const budgetManager = new BudgetManager(costTrackerInstance);

    pipelineInstance = new AgentPipelineClass({
      engine,
      contextBuilder: {
        build: async (_agentId: string) => "Context: company knowledge base",
      },
      costTracker: costTrackerInstance,
      budgetManager,
      messageBus: {
        publish: (_channel: string, _message: unknown) => {
          // In production: publish to Redis/WebSocket
        },
      },
      approvalPolicy: {
        evaluate: (taskDescription: string) => {
          // Default: approve all (configurable via DB in future)
          return { decision: "approved", matchedRules: [] as string[] };
        },
      },
      conversationLogger: {
        log: async (_agentId: string, _role: string, _content: string) => {
          // In production: save to Prisma
        },
      },
      realtimeHub: realtimeHubInstance,
    });
  }

  return pipelineInstance;
}

/**
 * Get the global CostTracker instance.
 *
 * @returns CostTracker (creates if needed)
 */
export function getCostTracker(): CostTracker {
  if (!costTrackerInstance) {
    costTrackerInstance = new CostTracker();
  }
  return costTrackerInstance;
}

/**
 * Get the global RealtimeHub instance.
 *
 * @returns RealtimeHub (creates if needed)
 */
export function getRealtimeHub(): RealtimeHub {
  if (!realtimeHubInstance) {
    realtimeHubInstance = new RealtimeHub();
  }
  return realtimeHubInstance;
}

/**
 * Reset all singleton instances (for testing only).
 */
export function resetSingletons(): void {
  engineInstance = null;
  pipelineInstance = null;
  costTrackerInstance = null;
  realtimeHubInstance = null;
}
