/**
 * ContextBuilder — assembles task context from multiple memory tiers.
 *
 * Combines:
 * 1. OpenClaw MEMORY.md (Tier 1 — curated agent facts + daily logs)
 * 2. LightRAG (graph-enhanced knowledge)
 * 3. VectorStore (past conversations — episodic memory)
 * 4. VectorStore (corrections — procedural memory)
 *
 * Graceful degradation: if any tier is down → partial context.
 *
 * @module core/memory/context-builder
 */

import type { PrismaClient } from "@prisma/client";
import type { LightRAGClient } from "@/core/memory/lightrag-client";
import type { VectorStore } from "@/core/memory/vector-store";
import type { EmbeddingService } from "@/core/memory/embedding-service";
import { VectorType } from "@/types/memory";
import type { TaskContext, VectorResult, LightRAGResult } from "@/types/memory";

/** Memory reader interface for OpenClaw Tier-1 */
export interface MemoryReader {
  readAgentMemory(agentId: string): Promise<string>;
  readDailyLogs(agentId: string, days?: number): Promise<string>;
}

/**
 * Builds structured context for agent tasks.
 */
export class ContextBuilder {
  private memoryReader?: MemoryReader;

  constructor(
    private readonly lightrag: LightRAGClient,
    private readonly vectorStore: VectorStore,
    private readonly embedService: EmbeddingService,
    private readonly db: PrismaClient,
    memoryReader?: MemoryReader
  ) {
    this.memoryReader = memoryReader;
  }

  /**
   * Build complete task context by querying all memory tiers.
   *
   * @param taskDescription - The task to build context for
   * @param agentId - Agent that will execute the task
   * @returns Structured TaskContext
   * @throws Error if agent not found
   */
  async buildContext(
    taskDescription: string,
    agentId: string
  ): Promise<TaskContext> {
    // 1. Get agent info
    const agent = await this.db.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // 2. Read OpenClaw Tier-1 memory (best-effort)
    let openclawMemory = "";
    if (this.memoryReader) {
      try {
        const curatedMemory = await this.memoryReader.readAgentMemory(agentId);
        const dailyLogs = await this.memoryReader.readDailyLogs(agentId, 2);

        const parts: string[] = [];
        if (curatedMemory) parts.push(curatedMemory);
        if (dailyLogs) parts.push(dailyLogs);
        openclawMemory = parts.join("\n\n---\n\n");
      } catch {
        // Graceful degradation: Tier-1 unavailable
      }
    }

    // 3. Check LightRAG availability
    const lightragAvailable = await this.lightrag.healthCheck();

    // 4. Query LightRAG (graph-enhanced knowledge)
    let knowledgeResults: LightRAGResult[] = [];
    if (lightragAvailable) {
      knowledgeResults = await this.lightrag.query(taskDescription, "hybrid");
    }

    // 5. Embed task description for vector search
    const taskEmbedding = await this.embedService.embed(taskDescription);

    // 6. Search past conversations (episodic memory)
    const pastExperience: VectorResult[] = await this.vectorStore.search(
      taskEmbedding,
      5,
      { type: VectorType.CONVERSATION, agentId }
    );

    // 7. Search corrections (procedural memory / learned rules)
    const corrections: VectorResult[] = await this.vectorStore.search(
      taskEmbedding,
      3,
      { type: VectorType.CORRECTION }
    );

    return {
      agentSop: agent.sop,
      knowledgeResults,
      pastExperience,
      corrections,
      lightragAvailable,
      openclawMemory: openclawMemory || undefined,
    };
  }

  /**
   * Format TaskContext into a structured string for system prompt injection.
   *
   * @param ctx - TaskContext to format
   * @returns Formatted context string
   */
  formatContext(ctx: TaskContext): string {
    const sections: string[] = [];

    // Role / SOP
    sections.push("=== ROLE ===");
    sections.push(ctx.agentSop);

    // OpenClaw Memory (Tier 1)
    if (ctx.openclawMemory) {
      sections.push("");
      sections.push("=== OPENCLAW MEMORY ===");
      sections.push(ctx.openclawMemory);
    }

    // Knowledge (LightRAG)
    sections.push("");
    sections.push("=== RELEVANT KNOWLEDGE (LightRAG) ===");
    if (ctx.knowledgeResults.length > 0) {
      for (const result of ctx.knowledgeResults) {
        sections.push(`- ${result.content}`);
      }
    } else {
      sections.push(
        ctx.lightragAvailable
          ? "No relevant knowledge found."
          : "No knowledge graph results (LightRAG service unavailable)."
      );
    }

    // Past Experience (VectorStore)
    sections.push("");
    sections.push("=== PAST EXPERIENCE ===");
    if (ctx.pastExperience.length > 0) {
      for (const result of ctx.pastExperience) {
        sections.push(`- ${result.content}`);
      }
    } else {
      sections.push("No relevant past experience found.");
    }

    // Corrections (Procedural Memory)
    sections.push("");
    sections.push("=== RULES FROM PAST CORRECTIONS ===");
    if (ctx.corrections.length > 0) {
      for (const result of ctx.corrections) {
        sections.push(`- ${result.content}`);
      }
    } else {
      sections.push("No relevant corrections found.");
    }

    return sections.join("\n");
  }
}
