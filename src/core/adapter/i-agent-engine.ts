/**
 * IAgentEngine — the ONLY boundary between the wrapper and any core engine.
 *
 * The entire application knows ONLY this interface, never OpenClaw directly.
 * This enables:
 * - Swapping engine at any time (OpenClaw → LangChain → custom)
 * - Testing without running OpenClaw (MockAdapter)
 * - Clean separation of concerns (D1)
 *
 * Implementations:
 * - MockAdapter (Phase 3) — for testing
 * - OpenClawAdapter (Phase 4) — wraps OpenClaw Gateway API
 *
 * @see docs/openclaw-integration.md Section 8 (Gateway API endpoints)
 * @see DECISIONS.md D1: Engine — use OpenClaw via HTTP, not embedded
 *
 * @module core/adapter/i-agent-engine
 */

import { AgentConfig, AgentStatus, AgentResponse } from "@/types/agent";

export interface IAgentEngine {
  /**
   * Deploy a new agent with the given configuration.
   * Maps to: POST /api/sessions + POST /api/agents in OpenClaw.
   *
   * @param config - Agent configuration
   * @returns Current status after deployment
   * @throws Error if agent with same ID is already deployed
   */
  deploy(config: AgentConfig): Promise<AgentStatus>;

  /**
   * Remove a deployed agent and free resources.
   * Maps to: DELETE /api/sessions/:key in OpenClaw.
   *
   * @param agentId - ID of the agent to undeploy
   * @throws Error if agent not found
   */
  undeploy(agentId: string): Promise<void>;

  /**
   * Restart an agent with optionally updated configuration.
   * Undeploys then re-deploys with merged config.
   *
   * @param agentId - ID of the agent to redeploy
   * @param config - Partial config to merge with existing
   * @returns Updated status
   */
  redeploy(agentId: string, config?: Partial<AgentConfig>): Promise<AgentStatus>;

  /**
   * Send a message to an agent and get a response.
   * Maps to: POST /api/sessions/:key/chat in OpenClaw.
   *
   * @param agentId - ID of the target agent
   * @param message - User/system message content
   * @param context - Optional context string (from ContextBuilder)
   * @returns Agent's response with token usage
   * @throws Error if agent not found or not running
   */
  sendMessage(
    agentId: string,
    message: string,
    context?: string
  ): Promise<AgentResponse>;

  /**
   * Get the current status of a deployed agent.
   * Maps to: GET /api/sessions/:key in OpenClaw.
   *
   * @param agentId - ID of the agent
   * @returns Current agent status
   * @throws Error if agent not found
   */
  getStatus(agentId: string): Promise<AgentStatus>;

  /**
   * List all currently deployed agents and their statuses.
   * Maps to: GET /api/sessions in OpenClaw.
   *
   * @returns Array of all agent statuses
   */
  listAgents(): Promise<AgentStatus[]>;

  /**
   * Check if the engine is healthy and responsive.
   * Maps to: GET /api/status in OpenClaw.
   *
   * @returns true if engine is operational
   */
  healthCheck(): Promise<boolean>;
}
