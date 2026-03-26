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
 * - MockAdapter (Phase 3) — in-memory mock for testing
 * - OpenClawAdapter (Phase 4, rewritten Phase 61) — CLI for management, HTTP /v1/chat/completions for chat
 *
 * @see DECISIONS.md D1: Engine — use OpenClaw via HTTP, not embedded
 *
 * @module core/adapter/i-agent-engine
 */

import { AgentConfig, AgentStatus, AgentResponse } from "@/types/agent";

export interface IAgentEngine {
  /**
   * Deploy a new agent with the given configuration.
   * Registers agent in internal tracking and prepares for messaging.
   *
   * @param config - Agent configuration
   * @returns Current status after deployment
   * @throws Error if agent with same ID is already deployed
   */
  deploy(config: AgentConfig): Promise<AgentStatus>;

  /**
   * Remove a deployed agent and free resources.
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
   * Builds system prompt from agent SOP + context, sends via engine.
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
   *
   * @param agentId - ID of the agent
   * @returns Current agent status
   * @throws Error if agent not found
   */
  getStatus(agentId: string): Promise<AgentStatus>;

  /**
   * List all currently deployed agents and their statuses.
   *
   * @returns Array of all agent statuses
   */
  listAgents(): Promise<AgentStatus[]>;

  /**
   * Check if the engine is healthy and responsive.
   * OpenClawAdapter: pings /v1/models via HTTP.
   * MockAdapter: always returns true.
   *
   * @returns true if engine is operational
   */
  healthCheck(): Promise<boolean>;
}
