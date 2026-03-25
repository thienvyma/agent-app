/**
 * CostTracker — tracks token usage per agent and calculates costs.
 *
 * In-memory counters with configurable model pricing.
 * Production: would use Redis INCRBY for fast atomic counters.
 *
 * @module core/cost/cost-tracker
 */

/** Model pricing table (USD per 1M tokens) */
const MODEL_PRICING: Record<string, number> = {
  "qwen2.5:7b": 0,        // Local Ollama — free
  "llama3.1:8b": 0,       // Local Ollama — free
  "gpt-4o": 5.0,          // OpenAI cloud
  "gpt-4o-mini": 0.15,    // OpenAI cloud (cheap)
  "claude-3.5": 3.0,      // Anthropic cloud
  "claude-3-haiku": 0.25, // Anthropic cloud (cheap)
};

/** Per-agent usage counters */
interface AgentCounter {
  totalTokens: number;
  byModel: Record<string, number>;
  requestCount: number;
}

/** Per-agent report entry */
export interface AgentCostEntry {
  agentId: string;
  totalTokens: number;
  estimatedCostUSD: number;
  byModel: Record<string, number>;
  requestCount: number;
}

/** Full cost report */
export interface CostReport {
  period: string;
  perAgent: AgentCostEntry[];
  totalTokens: number;
  totalCostUSD: number;
}

/** Single agent usage */
export interface AgentUsage {
  totalTokens: number;
  byModel: Record<string, number>;
  requestCount: number;
  estimatedCostUSD: number;
}

/**
 * Tracks token usage per agent with model-based pricing.
 */
export class CostTracker {
  private readonly counters = new Map<string, AgentCounter>();

  /**
   * Record token usage for an agent.
   *
   * @param agentId - Agent that consumed tokens
   * @param tokenCount - Number of tokens used
   * @param model - Model name for pricing lookup
   */
  trackUsage(agentId: string, tokenCount: number, model: string): void {
    let counter = this.counters.get(agentId);

    if (!counter) {
      counter = { totalTokens: 0, byModel: {}, requestCount: 0 };
      this.counters.set(agentId, counter);
    }

    counter.totalTokens += tokenCount;
    counter.byModel[model] = (counter.byModel[model] ?? 0) + tokenCount;
    counter.requestCount += 1;
  }

  /**
   * Get usage stats for a single agent.
   *
   * @param agentId - Agent ID
   * @returns Usage breakdown with estimated cost
   */
  getAgentUsage(agentId: string): AgentUsage {
    const counter = this.counters.get(agentId);

    if (!counter) {
      return { totalTokens: 0, byModel: {}, requestCount: 0, estimatedCostUSD: 0 };
    }

    return {
      totalTokens: counter.totalTokens,
      byModel: { ...counter.byModel },
      requestCount: counter.requestCount,
      estimatedCostUSD: this.calculateCost(counter.byModel),
    };
  }

  /**
   * Generate cost report across all agents.
   *
   * @param period - Report period label (default: "today")
   * @returns Full cost report with per-agent breakdown
   */
  getReport(period: string = "today"): CostReport {
    const perAgent: AgentCostEntry[] = [];
    let totalTokens = 0;
    let totalCostUSD = 0;

    for (const [agentId, counter] of this.counters) {
      const cost = this.calculateCost(counter.byModel);
      perAgent.push({
        agentId,
        totalTokens: counter.totalTokens,
        estimatedCostUSD: cost,
        byModel: { ...counter.byModel },
        requestCount: counter.requestCount,
      });
      totalTokens += counter.totalTokens;
      totalCostUSD += cost;
    }

    // Sort by tokens descending
    perAgent.sort((a, b) => b.totalTokens - a.totalTokens);

    return { period, perAgent, totalTokens, totalCostUSD };
  }

  /**
   * Get total tokens used today across all agents.
   *
   * @returns Total token count
   */
  getTotalToday(): number {
    let total = 0;
    for (const counter of this.counters.values()) {
      total += counter.totalTokens;
    }
    return total;
  }

  /**
   * Reset all daily counters (called at midnight).
   */
  resetDaily(): void {
    this.counters.clear();
  }

  /**
   * Calculate estimated USD cost from model usage.
   */
  private calculateCost(byModel: Record<string, number>): number {
    let cost = 0;
    for (const [model, tokens] of Object.entries(byModel)) {
      const pricePerMillion = MODEL_PRICING[model] ?? 0;
      cost += (tokens / 1_000_000) * pricePerMillion;
    }
    return cost;
  }
}
