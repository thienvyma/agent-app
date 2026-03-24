/**
 * OpenClawAdapter — real implementation of IAgentEngine wrapping OpenClaw Gateway API.
 *
 * Maps IAgentEngine operations to OpenClaw HTTP endpoints:
 *   deploy     → POST /api/sessions
 *   undeploy   → DELETE /api/sessions/:key
 *   sendMessage → POST /api/sessions/:key/chat
 *   getStatus  → GET /api/sessions/:key
 *   listAgents → internal map + GET per session
 *   healthCheck → GET /api/status
 *
 * @see docs/openclaw-integration.md Section 8
 * @module core/adapter/openclaw-adapter
 */

import type { AgentConfig, AgentStatus, AgentResponse } from "@/types/agent";
import type { IAgentEngine } from "./i-agent-engine";
import { OpenClawClient } from "./openclaw-client";

/** Mapping from agent ID to OpenClaw session key */
interface SessionMapping {
  sessionKey: string;
  config: AgentConfig;
}

/**
 * OpenClaw Gateway adapter implementing IAgentEngine.
 * Manages agent↔session mappings internally.
 */
export class OpenClawAdapter implements IAgentEngine {
  /** Agent ID → OpenClaw session mapping */
  private sessions: Map<string, SessionMapping> = new Map();

  /**
   * Create adapter with an OpenClaw HTTP client.
   *
   * @param client - OpenClawClient instance
   */
  constructor(private readonly client: OpenClawClient) {}

  /**
   * Deploy agent by creating an OpenClaw session.
   *
   * @param config - Agent configuration
   * @returns AgentStatus with RUNNING state
   * @throws Error if agent already deployed
   */
  async deploy(config: AgentConfig): Promise<AgentStatus> {
    if (this.sessions.has(config.id)) {
      throw new Error(`Agent ${config.id} is already deployed`);
    }

    const response = await this.client.post("/api/sessions", {
      agent_id: config.id,
      agent_name: config.name,
      model: config.model,
      tools: config.tools,
      system_prompt: config.systemPrompt ?? config.sop,
    }) as { key: string };

    this.sessions.set(config.id, {
      sessionKey: response.key,
      config,
    });

    return {
      id: config.id,
      name: config.name,
      status: "RUNNING",
      lastActivity: new Date(),
      tokenUsage: 0,
    };
  }

  /**
   * Undeploy agent by destroying its OpenClaw session.
   *
   * @param agentId - Agent to undeploy
   * @throws Error if agent not found
   */
  async undeploy(agentId: string): Promise<void> {
    const mapping = this.sessions.get(agentId);
    if (!mapping) {
      throw new Error(`Agent ${agentId} not found`);
    }

    await this.client.delete(`/api/sessions/${mapping.sessionKey}`);
    this.sessions.delete(agentId);
  }

  /**
   * Redeploy agent with updated config.
   *
   * @param agentId - Agent to redeploy
   * @param config - Partial config to merge
   * @returns Updated AgentStatus
   */
  async redeploy(
    agentId: string,
    config?: Partial<AgentConfig>
  ): Promise<AgentStatus> {
    const mapping = this.sessions.get(agentId);
    if (!mapping) {
      throw new Error(`Agent ${agentId} not found`);
    }

    await this.undeploy(agentId);
    const mergedConfig: AgentConfig = { ...mapping.config, ...config };
    return this.deploy(mergedConfig);
  }

  /**
   * Send message to agent via OpenClaw chat endpoint.
   *
   * @param agentId - Target agent
   * @param message - Message content
   * @param context - Optional context string
   * @returns AgentResponse with normalized data
   * @throws Error if agent not found
   */
  async sendMessage(
    agentId: string,
    message: string,
    context?: string
  ): Promise<AgentResponse> {
    const mapping = this.sessions.get(agentId);
    if (!mapping) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const response = await this.client.post(
      `/api/sessions/${mapping.sessionKey}/chat`,
      {
        message,
        context: context ?? undefined,
      }
    ) as { response?: string; message?: string; token_usage?: number };

    // Update token usage tracking
    const tokenUsed = response.token_usage ?? 0;

    return {
      agentId,
      message: response.response ?? response.message ?? "",
      tokenUsed,
      timestamp: new Date(),
    };
  }

  /**
   * Get agent status from OpenClaw session details.
   *
   * @param agentId - Agent to check
   * @returns AgentStatus
   * @throws Error if agent not found
   */
  async getStatus(agentId: string): Promise<AgentStatus> {
    const mapping = this.sessions.get(agentId);
    if (!mapping) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const session = await this.client.get(
      `/api/sessions/${mapping.sessionKey}`
    ) as { status?: string };

    return {
      id: agentId,
      name: mapping.config.name,
      status: this.mapSessionStatus(session.status),
      lastActivity: new Date(),
      tokenUsage: 0,
    };
  }

  /**
   * List all deployed agents with their statuses.
   *
   * @returns Array of AgentStatus
   */
  async listAgents(): Promise<AgentStatus[]> {
    const statuses: AgentStatus[] = [];

    for (const [agentId] of this.sessions) {
      try {
        const status = await this.getStatus(agentId);
        statuses.push(status);
      } catch {
        // Agent may have been removed externally
      }
    }

    return statuses;
  }

  /**
   * Check if OpenClaw Gateway is healthy.
   *
   * @returns true if /api/status responds OK
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get("/api/status");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Map OpenClaw session status string to AgentStatus type.
   *
   * @param status - Raw status from OpenClaw
   * @returns Normalized status value
   */
  private mapSessionStatus(
    status?: string
  ): AgentStatus["status"] {
    switch (status) {
      case "active":
      case "running":
        return "RUNNING";
      case "idle":
      case "waiting":
        return "IDLE";
      case "error":
      case "failed":
        return "ERROR";
      case "deploying":
      case "starting":
        return "DEPLOYING";
      default:
        return "RUNNING";
    }
  }
}
