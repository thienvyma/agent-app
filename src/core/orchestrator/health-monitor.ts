/**
 * HealthMonitor — periodic health checks with auto-restart.
 *
 * Monitors all deployed agents via engine.getStatus().
 * Auto-restarts ERROR agents (max 3 retries before escalation).
 *
 * @module core/orchestrator/health-monitor
 */

import type { PrismaClient } from "@prisma/client";
import type { IAgentEngine } from "@/core/adapter/i-agent-engine";
import type { AgentStatus } from "@/types/agent";
import { AgentOrchestrator } from "./agent-orchestrator";

/** Health check report */
export interface HealthReport {
  timestamp: Date;
  healthy: string[];
  unhealthy: Array<{ id: string; status: string }>;
  restarted: string[];
  escalated: string[];
}

/** Default check interval (30 seconds) */
const DEFAULT_INTERVAL = 30_000;

/**
 * Monitors agent health and auto-restarts on failure.
 */
export class HealthMonitor {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private retryCounts: Map<string, number> = new Map();

  constructor(
    private readonly orchestrator: AgentOrchestrator,
    private readonly engine: IAgentEngine,
    private readonly db: PrismaClient,
    private readonly interval: number = DEFAULT_INTERVAL
  ) {}

  /**
   * Start periodic health checks.
   */
  start(): void {
    if (this.intervalHandle) return; // Already running
    this.intervalHandle = setInterval(() => {
      this.checkAll().catch((err) => {
        console.error("[HealthMonitor] Check failed:", err);
      });
    }, this.interval);
  }

  /**
   * Stop periodic health checks.
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Check all deployed agents and auto-restart any in ERROR state.
   *
   * @returns HealthReport with healthy/unhealthy/restarted/escalated agents
   */
  async checkAll(): Promise<HealthReport> {
    const report: HealthReport = {
      timestamp: new Date(),
      healthy: [],
      unhealthy: [],
      restarted: [],
      escalated: [],
    };

    const agents = await this.engine.listAgents();

    for (const agent of agents) {
      if (agent.status === "RUNNING" || agent.status === "IDLE") {
        report.healthy.push(agent.id);
        this.retryCounts.delete(agent.id); // Reset on healthy
      } else if (agent.status === "ERROR") {
        report.unhealthy.push({ id: agent.id, status: agent.status });

        const escalated = await this.autoRestart(agent.id);
        if (escalated) {
          report.escalated.push(agent.id);
        } else {
          report.restarted.push(agent.id);
        }
      }
    }

    return report;
  }

  /**
   * Auto-restart an agent with retry logic.
   *
   * @param agentId - Agent to restart
   * @param maxRetries - Max attempts before escalation (default 3)
   * @returns true if escalated (all retries exhausted), false if restarted OK
   */
  async autoRestart(
    agentId: string,
    maxRetries: number = 3
  ): Promise<boolean> {
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;
      try {
        await this.orchestrator.redeploy(agentId);
        this.retryCounts.delete(agentId);
        return false; // Restarted successfully
      } catch {
        // Continue retrying
      }
    }

    // All retries exhausted — escalate
    await this.db.auditLog.create({
      data: {
        agentId,
        action: "ESCALATION",
        details: {
          reason: `Agent ${agentId} failed after ${maxRetries} restart attempts`,
          maxRetries,
        },
      },
    });

    return true; // Escalated
  }
}
