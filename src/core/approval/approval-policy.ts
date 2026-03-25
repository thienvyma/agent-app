/**
 * ApprovalPolicy — rule-based evaluation for HITL decisions.
 *
 * Determines whether a task requires owner approval or can auto-proceed.
 * Rules are checked in priority order — first match wins.
 *
 * @module core/approval/approval-policy
 */

/** Policy evaluation result */
export interface PolicyDecision {
  decision: "auto" | "approval-required";
  reason: string;
  matchedRule?: string;
}

/** Single policy rule */
interface PolicyRule {
  name: string;
  keywords: string[];
  reason: string;
}

/** Default rules that require approval */
const DEFAULT_RULES: PolicyRule[] = [
  {
    name: "customer-facing",
    keywords: ["khách hàng", "customer", "gửi cho khách", "email khách", "báo giá", "quote"],
    reason: "Task gửi nội dung cho khách hàng — cần owner duyệt",
  },
  {
    name: "payment",
    keywords: ["thanh toán", "payment", "chuyển khoản", "transfer", "chi tiền", "hóa đơn", "invoice"],
    reason: "Task liên quan đến thanh toán/chi tiền — cần owner duyệt",
  },
  {
    name: "contract",
    keywords: ["hợp đồng", "contract", "ký kết", "signing", "đối tác", "partner"],
    reason: "Task liên quan đến hợp đồng/đối tác — cần owner duyệt",
  },
  {
    name: "major-decision",
    keywords: ["tuyển dụng", "hire", "sa thải", "fire", "restructure", "đóng cửa", "shutdown"],
    reason: "Quyết định lớn ảnh hưởng tổ chức — cần owner duyệt",
  },
  {
    name: "public-content",
    keywords: ["đăng bài", "publish", "post", "social media", "quảng cáo", "ads", "campaign"],
    reason: "Nội dung công khai — cần owner duyệt trước khi đăng",
  },
];

/**
 * Evaluates whether a task requires human approval.
 */
export class ApprovalPolicy {
  private readonly rules: PolicyRule[];

  /**
   * @param customRules - Custom rules to add (default rules always included)
   */
  constructor(customRules: PolicyRule[] = []) {
    this.rules = [...DEFAULT_RULES, ...customRules];
  }

  /**
   * Evaluate a task against policy rules.
   *
   * @param taskDescription - Task description to check
   * @param agentRole - Role of the agent (unused for now, for future role-based rules)
   * @returns PolicyDecision with decision and reason
   */
  evaluate(taskDescription: string, agentRole: string): PolicyDecision {
    const lowerDesc = taskDescription.toLowerCase();

    for (const rule of this.rules) {
      const matched = rule.keywords.some((kw) =>
        lowerDesc.includes(kw.toLowerCase())
      );

      if (matched) {
        return {
          decision: "approval-required",
          reason: rule.reason,
          matchedRule: rule.name,
        };
      }
    }

    // No rule matched → auto-approve
    return {
      decision: "auto",
      reason: `Internal task (agent: ${agentRole}) — auto-approved`,
    };
  }
}
