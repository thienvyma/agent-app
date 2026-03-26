/**
 * OpenClawAdapter — IAgentEngine implementation using OpenClaw Gateway.
 *
 * Uses:
 * - OpenClawClient.chatCompletion() for sending messages (HTTP /v1/chat/completions)
 * - OpenClawClient.healthCheck() for health verification
 * - OpenClaw CLI for agent management (agents add/delete)
 * - Internal Map as performance cache (NOT source of truth)
 *
 * Phase 67: Per-agent session routing — each agent gets its own
 * OpenClaw session via `?session=agent:<id>:main` query parameter.
 *
 * @module core/adapter/openclaw-adapter
 */

import type { AgentConfig, AgentStatus, AgentResponse } from "@/types/agent";
import type { IAgentEngine } from "./i-agent-engine";
import { OpenClawClient } from "./openclaw-client";
import type { ChatMessage } from "./openclaw-client";
import { execOpenClaw } from "@/lib/openclaw-cli";

/** Internal agent registration entry */
interface AgentRegistration {
  config: AgentConfig;
  deployedAt: Date;
  tokenUsage: number;
}

/**
 * OpenClaw Gateway adapter implementing IAgentEngine.
 *
 * Manages agent registrations via OpenClaw CLI (agents add/delete)
 * with in-memory Map as cache. Chat is routed to per-agent sessions.
 */
export class OpenClawAdapter implements IAgentEngine {
  /** Agent ID → registration data (cache) */
  private agents: Map<string, AgentRegistration> = new Map();

  /**
   * Create adapter with an OpenClaw HTTP client.
   *
   * @param client - OpenClawClient instance
   */
  constructor(private readonly client: OpenClawClient) {}

  /**
   * Deploy agent by registering in OpenClaw and internal cache.
   *
   * Calls `openclaw agents add <id>` to register natively.
   * Falls back to cache-only if CLI call fails.
   *
   * @param config - Agent configuration
   * @returns AgentStatus with RUNNING state
   * @throws Error if agent already deployed
   */
  async deploy(config: AgentConfig): Promise<AgentStatus> {
    if (this.agents.has(config.id)) {
      throw new Error(`Agent ${config.id} is already deployed`);
    }

    // Register in OpenClaw via CLI (best-effort)
    try {
      await execOpenClaw(["agents", "add", config.id], 5_000);
    } catch {
      // CLI failed — fallback to in-memory cache only
      console.warn(`[OpenClawAdapter] CLI agents add failed for ${config.id}, using cache-only`);
    }

    // Register in cache
    this.agents.set(config.id, {
      config,
      deployedAt: new Date(),
      tokenUsage: 0,
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
   * Undeploy agent by removing from OpenClaw and internal cache.
   *
   * Calls `openclaw agents delete <id>` to deregister natively.
   *
   * @param agentId - Agent to undeploy
   * @throws Error if agent not found
   */
  async undeploy(agentId: string): Promise<void> {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Remove from OpenClaw via CLI (best-effort)
    try {
      await execOpenClaw(["agents", "delete", agentId], 5_000);
    } catch {
      console.warn(`[OpenClawAdapter] CLI agents delete failed for ${agentId}`);
    }

    this.agents.delete(agentId);
  }

  /**
   * Redeploy agent with updated config.
   *
   * @param agentId - Agent to redeploy
   * @param config - Partial config to merge
   * @returns Updated AgentStatus
   * @throws Error if agent not found
   */
  async redeploy(
    agentId: string,
    config?: Partial<AgentConfig>
  ): Promise<AgentStatus> {
    const registration = this.agents.get(agentId);
    if (!registration) {
      throw new Error(`Agent ${agentId} not found`);
    }

    await this.undeploy(agentId);
    const mergedConfig: AgentConfig = { ...registration.config, ...config };
    return this.deploy(mergedConfig);
  }

  /**
   * Send message to agent via OpenClaw chat completion.
   *
   * Routes to per-agent session using key `agent:<id>:main`.
   *
   * @param agentId - Target agent
   * @param message - User message content
   * @param context - Optional context string (from ContextBuilder)
   * @returns AgentResponse with message and token usage
   * @throws Error if agent not found
   */
  async sendMessage(
    agentId: string,
    message: string,
    context?: string
  ): Promise<AgentResponse> {
    const registration = this.agents.get(agentId);
    if (!registration) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const { config } = registration;

    // Build system prompt from SOP + context
    const systemPrompt = this.buildSystemPrompt(config, context);

    // Build messages array
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    // Per-agent session key: agent:<id>:main
    const sessionKey = `agent:${agentId}:main`;

    // Send via HTTP client with per-agent session routing
    const response = await this.client.chatCompletion(
      {
        model: config.model,
        messages,
      },
      sessionKey
    );

    // Update internal token tracking
    registration.tokenUsage += response.tokenUsed;

    // Parse tool_calls if present in response (Phase 71)
    const toolCalls = response.rawToolCalls?.map((tc) => {
      const fn = tc.function as Record<string, string> | undefined;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(fn?.arguments ?? "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      return {
        toolName: fn?.name ?? "",
        input: args,
        output: null as unknown,
        success: true,
      };
    });

    return {
      agentId,
      message: response.message,
      tokenUsed: response.tokenUsed,
      timestamp: new Date(),
      ...(toolCalls && toolCalls.length > 0 ? { toolCalls } : {}),
    };
  }

  /**
   * Get agent status from internal cache.
   *
   * @param agentId - Agent to check
   * @returns AgentStatus
   * @throws Error if agent not found
   */
  async getStatus(agentId: string): Promise<AgentStatus> {
    const registration = this.agents.get(agentId);
    if (!registration) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return {
      id: agentId,
      name: registration.config.name,
      status: "RUNNING",
      lastActivity: new Date(),
      tokenUsage: registration.tokenUsage,
    };
  }

  /**
   * List all deployed agents with their statuses.
   *
   * @returns Array of AgentStatus
   */
  async listAgents(): Promise<AgentStatus[]> {
    const statuses: AgentStatus[] = [];

    for (const [agentId, registration] of this.agents) {
      statuses.push({
        id: agentId,
        name: registration.config.name,
        status: "RUNNING",
        lastActivity: new Date(),
        tokenUsage: registration.tokenUsage,
      });
    }

    return statuses;
  }

  /**
   * Check if OpenClaw Gateway is healthy.
   *
   * @returns true if gateway is responsive
   */
  async healthCheck(): Promise<boolean> {
    return this.client.healthCheck();
  }

  /**
   * Build system prompt from agent SOP and optional context.
   *
   * @param config - Agent configuration (contains SOP)
   * @param context - Optional context from ContextBuilder
   * @returns Complete system prompt string
   */
  private buildSystemPrompt(
    config: AgentConfig,
    context?: string
  ): string {
    const parts: string[] = [];

    // Agent identity + SOP
    if (config.sop) {
      parts.push(config.sop);
    }

    // Injected context (from memory, knowledge, corrections)
    if (context) {
      parts.push(`\n--- Context ---\n${context}`);
    }

    return parts.join("\n") || `You are ${config.name}, a ${config.role}.`;
  }
}
