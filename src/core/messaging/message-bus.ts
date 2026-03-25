/**
 * MessageBus — BullMQ-based inter-agent messaging.
 *
 * Supports 3 communication patterns (D3):
 * - Delegate: publish to 1 agent (default)
 * - Chain: sequential A→B→C workflow
 * - Group: broadcast to multiple agents
 *
 * Messages are persisted in DB and queued via BullMQ.
 *
 * @module core/messaging/message-bus
 */

import type { PrismaClient } from "@prisma/client";
import type { Queue } from "bullmq";
import type { BusMessage, ChainStep, ChainResult } from "@/types/message";
import type { IAgentEngine } from "@/core/adapter/i-agent-engine";
import { Prisma } from "@prisma/client";

/**
 * Inter-agent message bus with DB persistence and queue delivery.
 */
export class MessageBus {
  constructor(
    private readonly db: PrismaClient,
    private readonly queue: Queue
  ) {}

  /**
   * Publish a message: save to DB + add to delivery queue.
   *
   * @param message - Message payload
   * @returns Message ID from database
   * @throws Error if content is empty
   */
  async publish(message: BusMessage): Promise<string> {
    // Validate
    if (!message.content || message.content.trim().length === 0) {
      throw new Error("Message content is required");
    }

    // Save to DB
    const record = await this.db.message.create({
      data: {
        fromAgentId: message.fromAgentId,
        toAgentId: message.toAgentId,
        content: message.content,
        type: message.type,
        metadata: (message.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    // Add to BullMQ queue for async delivery
    await this.queue.add(
      "message",
      {
        messageId: record.id,
        toAgentId: message.toAgentId,
        content: message.content,
        type: message.type,
      },
      {
        priority: message.metadata?.priority ?? 5,
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    return record.id;
  }

  /**
   * Broadcast a message to multiple agents (Group pattern).
   *
   * @param message - Base message (toAgentId will be overridden)
   * @param agentIds - Target agent IDs
   * @returns Array of message IDs
   */
  async broadcast(message: BusMessage, agentIds: string[]): Promise<string[]> {
    const ids: string[] = [];

    for (const agentId of agentIds) {
      const id = await this.publish({
        ...message,
        toAgentId: agentId,
      });
      ids.push(id);
    }

    return ids;
  }

  /**
   * Execute a sequential chain workflow (Chain pattern).
   *
   * Each step receives the previous step's result as context.
   *
   * @param steps - Chain steps to execute in order
   * @param engine - Agent engine for sending messages
   * @param fromAgentId - Initiating agent ID
   * @returns Compiled chain result
   */
  async chain(
    steps: ChainStep[],
    engine: IAgentEngine,
    fromAgentId: string
  ): Promise<ChainResult> {
    const startTime = Date.now();
    const results: ChainResult["steps"] = [];
    let previousResult = "";

    for (const step of steps) {
      const stepStart = Date.now();

      // Build instruction with context from previous step
      const instruction = previousResult
        ? `${step.instruction}\n\nContext from previous step:\n${previousResult}`
        : step.instruction;

      // Execute via agent engine
      const response = await engine.sendMessage(step.agentId, instruction);

      let result = response.message;

      // Apply transform if provided
      if (step.transformResult) {
        result = step.transformResult(result);
      }

      results.push({
        agentId: step.agentId,
        instruction: step.instruction,
        result,
        durationMs: Date.now() - stepStart,
      });

      previousResult = result;
    }

    return {
      steps: results,
      totalDurationMs: Date.now() - startTime,
      finalResult: previousResult,
    };
  }

  /**
   * Get message history for an agent.
   *
   * @param agentId - Agent ID
   * @param limit - Max messages to return
   * @returns Messages involving this agent (sent or received)
   */
  async getHistory(agentId: string, limit: number = 20): Promise<unknown[]> {
    return this.db.message.findMany({
      where: {
        OR: [
          { fromAgentId: agentId },
          { toAgentId: agentId },
        ],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        fromAgent: { select: { id: true, name: true, role: true } },
        toAgent: { select: { id: true, name: true, role: true } },
      },
    });
  }
}
