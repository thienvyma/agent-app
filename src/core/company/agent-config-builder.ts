/**
 * AgentConfigBuilder — converts DB agent records to IAgentEngine configs.
 *
 * Bridges the gap between Prisma Agent model and the engine interface types.
 * Also builds system prompts by combining role, SOP, tools, and context.
 *
 * @module core/company/agent-config-builder
 */

import type { AgentConfig } from "@/types/agent";

/** Minimal Prisma Agent shape needed for conversion */
interface DBAgent {
  id: string;
  name: string;
  role: string;
  sop: string;
  model: string;
  tools: string[];
  skills: string[];
  isAlwaysOn: boolean;
  cronSchedule?: string | null;
}

/**
 * Static utility for converting database agents to engine configs.
 */
export class AgentConfigBuilder {
  /**
   * Convert a Prisma Agent record to an IAgentEngine AgentConfig.
   *
   * @param agent - Prisma Agent record
   * @returns AgentConfig ready for IAgentEngine.deploy()
   */
  static fromDBAgent(agent: DBAgent): AgentConfig {
    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      sop: agent.sop,
      model: agent.model,
      tools: [...agent.tools],
      skills: [...agent.skills],
      isAlwaysOn: agent.isAlwaysOn,
      cronSchedule: agent.cronSchedule ?? undefined,
      systemPrompt: AgentConfigBuilder.buildSystemPrompt(agent),
    };
  }

  /**
   * Build a system prompt by combining:
   * - Role description
   * - SOP (Standard Operating Procedure)
   * - Available tools
   * - Injected context (from ContextBuilder in Phase 12)
   * - Constraints
   *
   * @param agent - Agent record
   * @param context - Optional runtime context (e.g., daily summary, memory)
   * @returns Complete system prompt string
   */
  static buildSystemPrompt(agent: DBAgent, context?: string): string {
    const sections: string[] = [];

    // Role header
    sections.push(`You are ${agent.name}, the ${agent.role} of the company.`);

    // SOP
    sections.push(`## Standard Operating Procedure\n${agent.sop}`);

    // Available tools
    if (agent.tools.length > 0) {
      sections.push(
        `## Available Tools\nYou have access to: ${agent.tools.join(", ")}`
      );
    }

    // Skills
    if (agent.skills.length > 0) {
      sections.push(
        `## Your Skills\n${agent.skills.join(", ")}`
      );
    }

    // Injected context
    if (context) {
      sections.push(`## Current Context\n${context}`);
    }

    // Constraints
    sections.push(
      `## Constraints
- Always respond in a professional manner
- Report to your supervisor when tasks are completed
- Escalate errors immediately
- Stay within your role boundaries`
    );

    return sections.join("\n\n");
  }
}
