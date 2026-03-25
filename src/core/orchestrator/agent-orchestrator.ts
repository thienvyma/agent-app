/**
 * AgentOrchestrator — deploys/undeploys agents via IAgentEngine + DB sync.
 *
 * Bridge between DB (Phase 5-6) and engine (Phase 3-4).
 * Agents go from "data in DB" to "running on OpenClaw".
 * Message execution goes through AgentPipeline (Integration Session).
 *
 * @module core/orchestrator/agent-orchestrator
 */

import type { PrismaClient } from "@prisma/client";
import type { IAgentEngine } from "@/core/adapter/i-agent-engine";
import type { AgentStatus, AgentResponse } from "@/types/agent";
import { AgentConfigBuilder } from "@/core/company/agent-config-builder";
import type { AgentPipeline, PipelineResponse } from "@/core/orchestrator/agent-pipeline";

/**
 * Orchestrates agent lifecycle: deploy, undeploy, redeploy, deployAll.
 * Message execution delegated to AgentPipeline (Rule #14).
 */
export class AgentOrchestrator {
  private pipeline: AgentPipeline | null = null;

  constructor(
    private readonly engine: IAgentEngine,
    private readonly db: PrismaClient
  ) {}

  /**
   * Set the pipeline for message execution.
   * MUST be called after construction to wire all middleware.
   *
   * @param pipeline - AgentPipeline instance
   */
  setPipeline(pipeline: AgentPipeline): void {
    this.pipeline = pipeline;
  }

  /**
   * Send a message to an agent via the full pipeline.
   * Pipeline flow: context → engine → cost → budget → bus.
   * Falls back to direct engine call if pipeline not set.
   *
   * @param agentId - Target agent ID
   * @param message - Message content
   * @returns Agent response (with budget status if pipeline active)
   */
  async sendMessage(
    agentId: string,
    message: string
  ): Promise<AgentResponse | PipelineResponse> {
    if (this.pipeline) {
      return this.pipeline.execute(agentId, message);
    }
    // Fallback: direct engine call (no middleware)
    return this.engine.sendMessage(agentId, message);
  }

  /**
   * Deploy an agent: load from DB → build config → engine.deploy → update DB.
   *
   * @param agentId - Agent ID to deploy
   * @returns AgentStatus from engine
   * @throws Error if agent not found
   */
  async deploy(agentId: string): Promise<AgentStatus> {
    const agent = await this.db.agent.findUnique({
      where: { id: agentId },
      include: { department: true, toolPermissions: true },
    });

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const config = AgentConfigBuilder.fromDBAgent(agent);
    const status = await this.engine.deploy(config);

    await this.db.agent.update({
      where: { id: agentId },
      data: { status: "RUNNING" },
    });

    await this.db.auditLog.create({
      data: {
        agentId,
        action: "DEPLOY",
        details: { status: status.status, model: config.model },
      },
    });

    return status;
  }

  /**
   * Undeploy an agent: engine.undeploy → update DB status to IDLE.
   *
   * @param agentId - Agent ID to undeploy
   */
  async undeploy(agentId: string): Promise<void> {
    await this.engine.undeploy(agentId);

    await this.db.agent.update({
      where: { id: agentId },
      data: { status: "IDLE" },
    });

    await this.db.auditLog.create({
      data: {
        agentId,
        action: "UNDEPLOY",
        details: { timestamp: new Date().toISOString() },
      },
    });
  }

  /**
   * Redeploy: undeploy + deploy (atomic).
   *
   * @param agentId - Agent ID to redeploy
   * @returns Updated AgentStatus
   */
  async redeploy(agentId: string): Promise<AgentStatus> {
    try {
      await this.undeploy(agentId);
    } catch {
      // Agent might not be deployed yet — continue to deploy
    }
    return this.deploy(agentId);
  }

  /**
   * Deploy all always-on agents (CEO first).
   */
  async deployAll(): Promise<void> {
    const agents = await this.db.agent.findMany({
      where: { isAlwaysOn: true },
      orderBy: { role: "asc" },
    });

    for (const agent of agents) {
      try {
        await this.deploy(agent.id);
      } catch (error) {
        await this.db.auditLog.create({
          data: {
            agentId: agent.id,
            action: "DEPLOY_FAILED",
            details: {
              error: error instanceof Error ? error.message : String(error),
            },
          },
        });
      }
    }
  }
}
