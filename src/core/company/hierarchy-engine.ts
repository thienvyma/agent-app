/**
 * HierarchyEngine — org chart queries and agent matching.
 *
 * Provides tree-structured views of the company hierarchy
 * and intelligent agent matching for task assignment.
 *
 * @module core/company/hierarchy-engine
 */

import { PrismaClient } from "@prisma/client";

/** Node in the org tree */
export interface OrgNode {
  id: string;
  name: string;
  type: "company" | "department" | "agent";
  status?: string;
  departments?: OrgNode[];
  agents?: OrgNode[];
}

/**
 * Engine for org chart queries and agent matching.
 */
export class HierarchyEngine {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Get full org tree for a company.
   * Returns: Company → Departments → Agents (nested)
   *
   * @param companyId - Company to get tree for
   * @returns OrgNode tree
   */
  async getOrgTree(companyId: string): Promise<OrgNode> {
    const company = await this.db.company.findUnique({
      where: { id: companyId },
      include: {
        departments: {
          include: {
            agents: true,
          },
        },
      },
    });

    if (!company) {
      throw new Error(`Company ${companyId} not found`);
    }

    return {
      id: company.id,
      name: company.name,
      type: "company",
      departments: (company.departments ?? []).map((dept) => ({
        id: dept.id,
        name: dept.name,
        type: "department" as const,
        agents: (dept.agents ?? []).map((agent) => ({
          id: agent.id,
          name: agent.name,
          type: "agent" as const,
          status: agent.status,
        })),
      })),
    };
  }

  /**
   * Find all agents with a specific role in a company.
   *
   * @param companyId - Company to search in
   * @param role - Role to filter by (e.g., "marketing")
   * @returns Matching agents
   */
  async findAgentsByRole(companyId: string, role: string) {
    return this.db.agent.findMany({
      where: {
        role,
        department: {
          companyId,
        },
      },
      include: {
        department: true,
      },
    });
  }

  /**
   * Find the best agent for a task based on keyword matching.
   *
   * Simple algorithm: count keyword matches between task description
   * and agent's role, skills, and tools. Highest score wins.
   *
   * Phase 9 TaskDecomposer uses this function.
   *
   * @param companyId - Company to search in
   * @param taskDescription - Task text to match against
   * @returns Best matching agent, or null if no match
   */
  async findBestAgent(companyId: string, taskDescription: string) {
    const agents = await this.db.agent.findMany({
      where: {
        department: {
          companyId,
        },
      },
    });

    if (agents.length === 0) return null;

    const taskWords = taskDescription.toLowerCase().split(/\s+/);
    let bestAgent = agents[0];
    let bestScore = 0;

    for (const agent of agents) {
      let score = 0;

      // Match role
      if (taskWords.some((w) => agent.role.toLowerCase().includes(w))) {
        score += 3;
      }

      // Match skills
      for (const skill of agent.skills) {
        const skillWords = skill.toLowerCase().split("_");
        if (taskWords.some((w) => skillWords.includes(w))) {
          score += 2;
        }
      }

      // Match tools
      for (const tool of agent.tools) {
        const toolWords = tool.toLowerCase().split("_");
        if (taskWords.some((w) => toolWords.includes(w))) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent ?? null;
  }
}
