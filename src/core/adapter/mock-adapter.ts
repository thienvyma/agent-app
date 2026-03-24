/**
 * MockAdapter — in-memory implementation of IAgentEngine for testing.
 *
 * Uses a Map to store agent states. No external dependencies.
 * All operations simulate real delays with small timeouts.
 *
 * @module core/adapter/mock-adapter
 */

import { AgentConfig, AgentStatus, AgentResponse } from "@/types/agent";
import { IAgentEngine } from "./i-agent-engine";

/** Predefined mock responses based on keywords in message */
const MOCK_RESPONSES: Record<string, string> = {
  revenue: "Based on current data, our monthly revenue is $15,000.",
  report: "Here is the daily summary report for all departments.",
  strategy: "I recommend focusing on customer acquisition this quarter.",
  default: "I have processed your request. How can I help further?",
};

/**
 * Find the best mock response for a message.
 *
 * @param message - Input message to match
 * @returns Matching mock response text
 */
function findMockResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [keyword, response] of Object.entries(MOCK_RESPONSES)) {
    if (keyword !== "default" && lower.includes(keyword)) {
      return response;
    }
  }
  return MOCK_RESPONSES["default"] ?? "OK";
}

/**
 * In-memory agent engine for testing.
 * Implements IAgentEngine with a Map-based store.
 */
export class MockAdapter implements IAgentEngine {
  /** In-memory store of deployed agents */
  private agents: Map<string, AgentStatus> = new Map();

  /** Stored configs for redeploy */
  private configs: Map<string, AgentConfig> = new Map();

  /**
   * Deploy a new agent. Simulates 100ms startup delay.
   *
   * @param config - Agent configuration
   * @returns Status with RUNNING state
   * @throws Error if agent already deployed
   */
  async deploy(config: AgentConfig): Promise<AgentStatus> {
    if (this.agents.has(config.id)) {
      throw new Error(`Agent ${config.id} is already deployed`);
    }

    // Simulate deployment delay
    await this.delay(100);

    const status: AgentStatus = {
      id: config.id,
      name: config.name,
      status: "RUNNING",
      lastActivity: new Date(),
      tokenUsage: 0,
    };

    this.agents.set(config.id, status);
    this.configs.set(config.id, config);
    return status;
  }

  /**
   * Remove a deployed agent.
   *
   * @param agentId - Agent to undeploy
   * @throws Error if agent not found
   */
  async undeploy(agentId: string): Promise<void> {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.agents.delete(agentId);
    this.configs.delete(agentId);
  }

  /**
   * Redeploy an agent with updated config.
   *
   * @param agentId - Agent to redeploy
   * @param config - Partial config to merge
   * @returns Updated status
   */
  async redeploy(
    agentId: string,
    config?: Partial<AgentConfig>
  ): Promise<AgentStatus> {
    const existingConfig = this.configs.get(agentId);
    if (!existingConfig) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Undeploy first
    await this.undeploy(agentId);

    // Merge config and redeploy
    const mergedConfig: AgentConfig = { ...existingConfig, ...config };
    return this.deploy(mergedConfig);
  }

  /**
   * Send a message to a deployed agent.
   * Returns predefined responses based on message keywords.
   *
   * @param agentId - Target agent
   * @param message - Message content
   * @param _context - Optional context (unused in mock)
   * @returns AgentResponse with mock data
   * @throws Error if agent not found
   */
  async sendMessage(
    agentId: string,
    message: string,
    _context?: string
  ): Promise<AgentResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Simulate processing delay
    await this.delay(50);

    const tokenUsed = Math.floor(message.length * 1.5 + Math.random() * 50);

    // Update agent status
    agent.lastActivity = new Date();
    agent.tokenUsage += tokenUsed;

    return {
      agentId,
      message: findMockResponse(message),
      tokenUsed,
      timestamp: new Date(),
    };
  }

  /**
   * Get current status of a deployed agent.
   *
   * @param agentId - Agent to check
   * @returns Current AgentStatus
   * @throws Error if agent not found
   */
  async getStatus(agentId: string): Promise<AgentStatus> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    return agent;
  }

  /**
   * List all deployed agents.
   *
   * @returns Array of all agent statuses
   */
  async listAgents(): Promise<AgentStatus[]> {
    return Array.from(this.agents.values());
  }

  /**
   * Health check — always returns true for mock.
   *
   * @returns true
   */
  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Simulate async delay.
   *
   * @param ms - Milliseconds to wait
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
