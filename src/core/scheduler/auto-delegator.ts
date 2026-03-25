/**
 * AutoDelegator — role-based task assignment.
 *
 * BUILD: OpenClaw does NOT have business role logic.
 * Maps task keywords to departments and picks the best available agent.
 *
 * @module core/scheduler/auto-delegator
 */

/** Agent info for delegation */
interface AgentInfo {
  id: string;
  role: string;
  department: string;
  status: string;
  budgetRemaining: number;
}

/** Delegator configuration */
interface DelegatorConfig {
  agents: AgentInfo[];
}

/** Delegation suggestion */
interface DelegationSuggestion {
  agentId: string;
  role: string;
  department: string;
  confidence: number;
  reason: string;
}

/** Delegation result */
interface DelegationResult {
  assignedTo: string;
  reason: string;
  confidence: number;
}

/** Keyword → department mapping */
const KEYWORD_MAP: Record<string, string> = {
  // Marketing
  content: "marketing",
  marketing: "marketing",
  blog: "marketing",
  "social media": "marketing",
  quang: "marketing",
  seo: "marketing",
  brand: "marketing",
  // Finance
  finance: "finance",
  roi: "finance",
  cost: "finance",
  budget: "finance",
  "bao gia": "finance",
  invoice: "finance",
  luong: "finance",
  // Engineering
  code: "engineering",
  deploy: "engineering",
  bug: "engineering",
  api: "engineering",
  database: "engineering",
  // Executive
  "chien luoc": "executive",
  strategy: "executive",
  "ke hoach": "executive",
  plan: "executive",
  decision: "executive",
};

/**
 * Auto-delegates tasks to the most suitable agent.
 */
export class AutoDelegator {
  private agents: AgentInfo[];

  constructor(config: DelegatorConfig) {
    this.agents = config.agents;
  }

  /**
   * Suggest the best agent for a task.
   *
   * @param description - Task description
   * @returns Suggestion with agent and confidence
   */
  getSuggestion(description: string): DelegationSuggestion {
    const descLower = description.toLowerCase();

    // Score each department by keyword matches
    const departmentScores: Record<string, number> = {};

    for (const [keyword, dept] of Object.entries(KEYWORD_MAP)) {
      if (descLower.includes(keyword)) {
        departmentScores[dept] = (departmentScores[dept] ?? 0) + 1;
      }
    }

    // Find best department
    let bestDept = "executive"; // Default: CEO handles unknown tasks
    let bestScore = 0;

    for (const [dept, score] of Object.entries(departmentScores)) {
      if (score > bestScore) {
        bestDept = dept;
        bestScore = score;
      }
    }

    // Find best agent in department (running + has budget)
    const candidates = this.agents
      .filter((a) => a.department === bestDept && a.status === "running" && a.budgetRemaining > 0);

    // Fallback to CEO if no candidates
    const agent = candidates[0] ?? this.agents.find((a) => a.department === "executive" && a.status === "running") ?? this.agents[0]!;

    const confidence = bestScore > 0 ? Math.min(0.5 + bestScore * 0.15, 0.95) : 0.3;

    return {
      agentId: agent.id,
      role: agent.role,
      department: agent.department,
      confidence,
      reason: `${agent.role} handles ${bestDept} tasks (matched ${bestScore} keywords)`,
    };
  }

  /**
   * Delegate a task to the best available agent.
   *
   * @param description - Task description
   * @returns Delegation result
   */
  delegateTask(description: string): DelegationResult {
    const suggestion = this.getSuggestion(description);

    return {
      assignedTo: suggestion.agentId,
      reason: suggestion.reason,
      confidence: suggestion.confidence,
    };
  }
}
