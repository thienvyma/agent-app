/**
 * ConversationLogger — auto-log conversations, task results,
 * and owner corrections into VectorStore.
 *
 * Every conversation = company knowledge.
 * Every correction = learning opportunity (Phase 26 Self-Learning).
 *
 * @module core/memory/conversation-logger
 */

import type { VectorStore } from "@/core/memory/vector-store";
import type { EmbeddingService } from "@/core/memory/embedding-service";
import { VectorType } from "@/types/memory";

/** Message in a conversation */
interface Message {
  role: string;
  content: string;
}

/** Task result to log */
interface TaskLog {
  id: string;
  description: string;
  result: string;
  agentId: string;
}

/** Owner correction to log */
interface CorrectionLog {
  originalOutput: string;
  correctedOutput: string;
  ruleExtracted: string;
  agentId: string;
}

/**
 * Logs conversations, task results, and corrections into VectorStore.
 */
export class ConversationLogger {
  constructor(
    private readonly vectorStore: VectorStore,
    private readonly embedService: EmbeddingService
  ) {}

  /**
   * Log a conversation between agent and user/other agent.
   *
   * @param agentId - Agent that participated in the conversation
   * @param messages - Array of messages
   */
  async logConversation(agentId: string, messages: Message[]): Promise<void> {
    if (messages.length === 0) return;

    const text = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const embedding = await this.embedService.embed(text);

    await this.vectorStore.store(text, embedding, {
      type: VectorType.CONVERSATION,
      agentId,
      source: "conversation",
      timestamp: new Date(),
    });
  }

  /**
   * Log a task result (description + outcome).
   *
   * @param task - Task with id, description, result, agentId
   */
  async logTaskResult(task: TaskLog): Promise<void> {
    const text = `Task: ${task.description}\nResult: ${task.result}`;
    const embedding = await this.embedService.embed(text);

    await this.vectorStore.store(text, embedding, {
      type: VectorType.CONVERSATION,
      agentId: task.agentId,
      taskId: task.id,
      source: "task-result",
      timestamp: new Date(),
    });
  }

  /**
   * Log an owner correction for Self-Learning (Phase 26).
   *
   * @param correction - Original output, corrected output, extracted rule
   */
  async logCorrection(correction: CorrectionLog): Promise<void> {
    const text = [
      `Original: ${correction.originalOutput}`,
      `Corrected: ${correction.correctedOutput}`,
      `Rule: ${correction.ruleExtracted}`,
    ].join("\n");

    const embedding = await this.embedService.embed(text);

    await this.vectorStore.store(text, embedding, {
      type: VectorType.CORRECTION,
      agentId: correction.agentId,
      source: "owner-correction",
      timestamp: new Date(),
    });
  }
}
