/**
 * Message type definitions for inter-agent communication.
 *
 * Supports 3 communication patterns (D3):
 * - Delegate: CEO → 1 agent (default)
 * - Chain: A→B→C sequential workflow
 * - Group: broadcast to multiple agents
 *
 * @module types/message
 */

import { MessageType } from "@prisma/client";

// Re-export for convenience
export { MessageType };

/** Message payload for MessageBus publish */
export interface BusMessage {
  fromAgentId: string;
  toAgentId: string;
  content: string;
  type: MessageType;
  metadata?: {
    taskId?: string;
    priority?: number;
    replyTo?: string;
    triggerId?: string;
    triggerType?: string;
    triggerName?: string;
  };
}

/** Step in a chain workflow (Pattern 2) */
export interface ChainStep {
  agentId: string;
  instruction: string;
  transformResult?: (result: string) => string;
}

/** Result of a completed chain workflow */
export interface ChainResult {
  steps: Array<{
    agentId: string;
    instruction: string;
    result: string;
    durationMs: number;
  }>;
  totalDurationMs: number;
  finalResult: string;
}

/** Callback for message subscription */
export type MessageHandler = (message: BusMessage) => Promise<void>;
