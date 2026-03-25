/**
 * FeedbackLoop — processes owner rejections into learned rules.
 *
 * Flow:
 * 1. Owner rejects task output
 * 2. FeedbackLoop extracts a rule from the feedback
 * 3. Rule stored as CorrectionLog entry
 * 4. PromptInjector injects rule into future prompts
 *
 * @module core/feedback/feedback-loop
 */

import { CorrectionLogManager } from "@/core/feedback/correction-log";

/** Rejection input */
interface RejectionInput {
  agentId: string;
  taskDescription: string;
  agentOutput: string;
  ownerFeedback: string;
}

/** Modification input */
interface ModificationInput {
  agentId: string;
  taskDescription: string;
  agentOutput: string;
  modifications: string;
}

/** Processing result */
export interface FeedbackResult {
  correctionId: string;
  ruleExtracted: string;
}

/**
 * Processes owner feedback into actionable rules.
 */
export class FeedbackLoop {
  constructor(private readonly correctionLog: CorrectionLogManager) {}

  /**
   * Process a rejection and create a correction log.
   *
   * @param input - Rejection data
   * @returns Feedback processing result
   */
  processRejection(input: RejectionInput): FeedbackResult {
    const ruleExtracted = this.formatRuleFromFeedback(
      input.taskDescription,
      input.agentOutput,
      input.ownerFeedback
    );

    const entry = this.correctionLog.create({
      agentId: input.agentId,
      taskContext: input.taskDescription,
      wrongOutput: input.agentOutput,
      correction: input.ownerFeedback,
      ruleExtracted,
    });

    return {
      correctionId: entry.id,
      ruleExtracted,
    };
  }

  /**
   * Process a modification (partial correction).
   *
   * @param input - Modification data
   * @returns Feedback processing result
   */
  processModification(input: ModificationInput): FeedbackResult {
    const ruleExtracted = this.formatRuleFromFeedback(
      input.taskDescription,
      input.agentOutput,
      input.modifications
    );

    const entry = this.correctionLog.create({
      agentId: input.agentId,
      taskContext: input.taskDescription,
      wrongOutput: input.agentOutput,
      correction: input.modifications,
      ruleExtracted,
    });

    return {
      correctionId: entry.id,
      ruleExtracted,
    };
  }

  /**
   * Format a rule from feedback context.
   * In production, this would call an LLM for rule extraction.
   *
   * @param context - Task description
   * @param wrongOutput - What the agent produced
   * @param correction - Owner's correction/feedback
   * @returns Extracted rule text
   */
  formatRuleFromFeedback(
    context: string,
    wrongOutput: string,
    correction: string
  ): string {
    // Extract keywords from context for rule categorization
    const contextKeywords = context
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 3)
      .join(", ");

    return `When handling [${contextKeywords}]: ${correction}. (Avoid: ${wrongOutput.slice(0, 50)})`;
  }
}
