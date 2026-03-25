/**
 * CorrectionLogManager — in-memory correction storage.
 *
 * Stores owner feedback corrections for agents.
 * Used by FeedbackLoop and PromptInjector for self-learning.
 *
 * @module core/feedback/correction-log
 */

/** Correction entry */
export interface CorrectionEntry {
  id: string;
  agentId: string;
  taskContext: string;
  wrongOutput: string;
  correction: string;
  ruleExtracted: string;
  createdAt: Date;
}

/** Input for creating a correction */
export interface CreateCorrectionInput {
  agentId: string;
  taskContext: string;
  wrongOutput: string;
  correction: string;
  ruleExtracted: string;
}

/** Correction stats */
export interface CorrectionStats {
  total: number;
  byAgent: Record<string, number>;
}

/**
 * Manages correction logs in memory.
 * DB adapter (Prisma) deferred to production.
 */
export class CorrectionLogManager {
  private entries: CorrectionEntry[] = [];
  private nextId = 1;

  /**
   * Create a new correction entry.
   *
   * @param data - Correction input
   * @returns Created correction entry
   */
  create(data: CreateCorrectionInput): CorrectionEntry {
    const entry: CorrectionEntry = {
      id: `corr-${this.nextId++}`,
      ...data,
      createdAt: new Date(),
    };

    this.entries.push(entry);
    return entry;
  }

  /**
   * Get all corrections for a specific agent.
   *
   * @param agentId - Agent ID
   * @returns Corrections for the agent
   */
  getByAgent(agentId: string): CorrectionEntry[] {
    return this.entries.filter((e) => e.agentId === agentId);
  }

  /**
   * Find corrections relevant to a query (keyword matching).
   * In production, this would use vector similarity search.
   *
   * @param query - Search query
   * @param limit - Max results
   * @returns Relevant corrections sorted by relevance
   */
  getRelevant(query: string, limit: number): CorrectionEntry[] {
    const queryWords = query.toLowerCase().split(/\s+/);

    const scored = this.entries.map((entry) => {
      const text = `${entry.taskContext} ${entry.ruleExtracted}`.toLowerCase();
      const score = queryWords.filter((w) => text.includes(w)).length;
      return { entry, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.entry);
  }

  /**
   * Get correction statistics.
   *
   * @returns Total count and per-agent breakdown
   */
  getStats(): CorrectionStats {
    const byAgent: Record<string, number> = {};

    for (const entry of this.entries) {
      byAgent[entry.agentId] = (byAgent[entry.agentId] ?? 0) + 1;
    }

    return { total: this.entries.length, byAgent };
  }

  /**
   * Get all entries (for export/debug).
   */
  getAll(): CorrectionEntry[] {
    return [...this.entries];
  }
}
