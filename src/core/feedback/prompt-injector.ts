/**
 * PromptInjector — injects learned rules into agent system prompts.
 *
 * Combines:
 * 1. Agent SOP (base prompt)
 * 2. Rules from past corrections (self-learning)
 * 3. Relevant knowledge documents
 *
 * This is the core integration point for the learning loop.
 *
 * @module core/feedback/prompt-injector
 */

/** Correction data for injection */
interface CorrectionData {
  ruleExtracted: string;
  taskContext: string;
}

/** Injection input */
interface InjectInput {
  sop: string;
  corrections: CorrectionData[];
  knowledge: string[];
}

/** Maximum corrections to inject (prevent prompt overflow) */
const MAX_CORRECTIONS = 50;

/**
 * Injects learned rules and knowledge into agent prompts.
 */
export class PromptInjector {
  /**
   * Build complete system prompt with injected rules and knowledge.
   *
   * @param input - SOP + corrections + knowledge
   * @returns Complete system prompt
   */
  inject(input: InjectInput): string {
    const parts: string[] = [input.sop];

    // Inject corrections (max 50, most recent first)
    const corrections = input.corrections.slice(0, MAX_CORRECTIONS);
    if (corrections.length > 0) {
      parts.push("");
      parts.push("=== RULES FROM PAST CORRECTIONS ===");
      parts.push(this.formatCorrections(corrections));
    }

    // Inject relevant knowledge
    if (input.knowledge.length > 0) {
      parts.push("");
      parts.push("=== RELEVANT KNOWLEDGE ===");
      for (const doc of input.knowledge) {
        parts.push(`- ${doc}`);
      }
    }

    return parts.join("\n");
  }

  /**
   * Format corrections as numbered rules.
   *
   * @param corrections - Correction entries
   * @returns Formatted rule list
   */
  formatCorrections(corrections: CorrectionData[]): string {
    return corrections
      .map((c, i) => `${i + 1}. ${c.ruleExtracted}`)
      .join("\n");
  }
}
