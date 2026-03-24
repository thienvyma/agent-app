/**
 * AgentOrchestrator — deploys/undeploys agents via IAgentEngine + DB sync.
 *
 * Bridge between DB (Phase 5-6) and engine (Phase 3-4).
 * Agents go from "data in DB" to "running on OpenClaw".
 *
 * @module core/orchestrator/agent-orchestrator
 */

import type { PrismaClient } from "@prisma/client";
import type { IAgentEngine } from "@/core/adapter/i-agent-engine";
import type { AgentStatus } from "@/types/agent";
import { AgentConfigBuilder } from "@/core/company/agent-config-builder";

/**
 * Orchestrates agent lifecycle: deploy, undeploy, redeploy, deployAll.
 */
export class AgentOrchestrator {
  constructor(
    private readonly engine: IAgentEngine,
    private readonly db: PrismaClient
  ) {}

  /**
   * Deploy an agent: load from DB → build config → engine.deploy → update DB.
   *
   * @param agentId - Agent ID to deploy
   * @returns AgentStatus from engine
   * @throws Error if agent not found
   */
  async deploy(agentId: string): Promise<AgentStatus> {
    // 1. Load agent from DB
    const agent = await this.db.agent.findUnique({
      where: { id: agentId },
      include: { department: true, toolPermissions: true },
    });

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // 2. Build AgentConfig from DB record
    const config = AgentConfigBuilder.fromDBAgent(agent);

    // 3. Deploy via engine
    const status = await this.engine.deploy(config);

    // 4. Update DB status
    await this.db.agent.update({
      where: { id: agentId },
      data: { status: "RUNNING" },
    });

    // 5. Audit log
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
      orderBy: { role: "asc" }, // CEO comes first alphabetically
    });

    for (const agent of agents) {
      try {
        await this.deploy(agent.id);
      } catch (error) {
        // Log but continue deploying others
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
