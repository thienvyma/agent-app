/**
 * Core TypeScript types for the agent system.
 *
 * These types define the contract between the wrapper layer
 * and any engine implementation (OpenClaw, LangChain, custom).
 *
 * @module types/agent
 */

/**
 * Configuration for creating/deploying an agent.
 *
 * @property id - Unique identifier (e.g., "agent-ceo-001")
 * @property name - Human-readable name
 * @property role - Role in the company (ceo, cfo, marketer, etc.)
 * @property sop - Standard Operating Procedure instructions
 * @property model - LLM model to use (e.g., "qwen2.5:7b")
 * @property tools - List of tool names the agent can use
 * @property skills - List of skill names (OpenClaw SKILL.md)
 * @property isAlwaysOn - Whether agent runs continuously
 * @property cronSchedule - Cron expression for scheduled runs
 * @property systemPrompt - Custom system prompt (injected by ContextBuilder in Phase 12)
 */
export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  sop: string;
  model: string;
  tools: string[];
  skills: string[];
  isAlwaysOn: boolean;
  cronSchedule?: string;
  systemPrompt?: string;
}

/**
 * Runtime status of a deployed agent.
 *
 * @property status - Current lifecycle state
 * @property lastActivity - Timestamp of last action
 * @property tokenUsage - Cumulative tokens consumed
 * @property errorLog - Last error message if status is ERROR
 */
export interface AgentStatus {
  id: string;
  name: string;
  status: "IDLE" | "RUNNING" | "ERROR" | "DEPLOYING" | "PAUSED_BUDGET";
  lastActivity: Date;
  tokenUsage: number;
  errorLog?: string;
}

/**
 * Response from an agent after processing a message.
 *
 * @property agentId - Which agent responded
 * @property message - The agent's text response
 * @property toolCalls - Tool invocations made during response
 * @property tokenUsed - Tokens consumed for this response
 * @property timestamp - When the response was generated
 */
export interface AgentResponse {
  agentId: string;
  message: string;
  toolCalls?: ToolCall[];
  tokenUsed: number;
  timestamp: Date;
}

/**
 * Record of a single tool invocation by an agent.
 *
 * @property toolName - Name of the tool called
 * @property input - Parameters passed to the tool
 * @property output - Result returned by the tool
 * @property success - Whether the tool call succeeded
 */
export interface ToolCall {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  success: boolean;
}
