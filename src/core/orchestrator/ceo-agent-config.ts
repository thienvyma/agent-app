/**
 * CEO Agent Config — always-on agent with delegation and escalation.
 *
 * CEO is the only agent that runs 24/7 with a cron schedule.
 * All owner commands go through CEO → delegation to sub-agents.
 *
 * @module core/orchestrator/ceo-agent-config
 */

/** Rule for delegating tasks to specific agent roles */
export interface DelegationRule {
  /** Keywords that trigger this rule */
  keywords: string[];
  /** Target agent role to delegate to */
  targetRole: string;
  /** Whether owner approval is needed before delegation */
  requireApproval: boolean;
}

/** Policy for escalating issues to the owner */
export interface EscalationPolicy {
  /** Max restart attempts before escalation */
  maxRetries: number;
  /** Whether to notify owner on escalation */
  notifyOwner: boolean;
  /** Notification channels */
  channels: string[];
}

/** Full CEO agent configuration */
export interface CEOAgentConfig {
  /** Cron poll interval in milliseconds (default: 5 min = 300000) */
  pollIntervalMs: number;
  /** Rules for task delegation to sub-agents */
  delegationRules: DelegationRule[];
  /** How to handle failures */
  escalationPolicy: EscalationPolicy;
}

/**
 * Build default CEO config with standard delegation rules.
 *
 * @returns CEOAgentConfig with marketing/finance/support rules
 */
export function buildDefaultCEOConfig(): CEOAgentConfig {
  return {
    pollIntervalMs: 300_000, // 5 minutes

    delegationRules: [
      {
        keywords: ["marketing", "quang cao", "quảng cáo", "content", "social", "facebook", "tiktok", "campaign"],
        targetRole: "marketing",
        requireApproval: false,
      },
      {
        keywords: ["finance", "tai chinh", "tài chính", "bao cao", "báo cáo", "revenue", "budget", "chi phi", "chi phí", "expense"],
        targetRole: "finance",
        requireApproval: false,
      },
      {
        keywords: ["support", "ho tro", "hỗ trợ", "khach hang", "khách hàng", "customer", "ticket", "complaint"],
        targetRole: "support",
        requireApproval: false,
      },
      {
        keywords: ["design", "thiet ke", "thiết kế", "ui", "ux", "logo", "banner", "graphics"],
        targetRole: "design",
        requireApproval: false,
      },
      {
        keywords: ["hire", "tuyen dung", "tuyển dụng", "nhan su", "nhân sự", "salary", "hr", "onboard"],
        targetRole: "hr",
        requireApproval: true, // HR decisions need approval
      },
    ],

    escalationPolicy: {
      maxRetries: 3,
      notifyOwner: true,
      channels: ["telegram"],
    },
  };
}

/**
 * Find the matching delegation rule for a task description.
 *
 * @param config - CEO config with delegation rules
 * @param taskDescription - Task description text
 * @returns Matching DelegationRule, or undefined if no match
 */
export function findDelegationRule(
  config: CEOAgentConfig,
  taskDescription: string
): DelegationRule | undefined {
  const lowerDesc = taskDescription.toLowerCase();
  return config.delegationRules.find((rule) =>
    rule.keywords.some((keyword) => lowerDesc.includes(keyword))
  );
}
