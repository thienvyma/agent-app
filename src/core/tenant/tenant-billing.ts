/**
 * TenantBilling — usage tracking, quota checking, invoice generation.
 *
 * Tracks per-tenant token usage and enforces plan limits.
 * In production, persisted to database. MVP uses in-memory.
 *
 * @module core/tenant/tenant-billing
 */

/** Per-agent usage entry */
interface AgentUsage {
  agentId: string;
  tokens: number;
}

/** Daily usage report */
interface DailyUsage {
  tenantId: string;
  date: string;
  totalTokens: number;
  perAgent: AgentUsage[];
}

/** Quota check result */
interface QuotaStatus {
  status: "ok" | "warning" | "exceeded";
  used: number;
  limit: number;
  percentUsed: number;
}

/** Invoice line item */
interface InvoiceItem {
  agentId: string;
  tokens: number;
  description: string;
}

/** Monthly invoice */
interface Invoice {
  tenantId: string;
  period: string;
  totalTokens: number;
  lineItems: InvoiceItem[];
  status: "draft" | "sent" | "paid";
  generatedAt: string;
}

/** Warning threshold percentage */
const WARNING_THRESHOLD = 80;

/**
 * Tracks tenant usage and generates billing data.
 */
export class TenantBilling {
  private usage: Map<string, AgentUsage[]> = new Map();

  /**
   * Track token usage for a tenant's agent.
   *
   * @param tenantId - Tenant ID
   * @param agentId - Agent that used tokens
   * @param tokens - Number of tokens used
   */
  trackUsage(tenantId: string, agentId: string, tokens: number): void {
    const existing = this.usage.get(tenantId) ?? [];

    const agentEntry = existing.find((e) => e.agentId === agentId);
    if (agentEntry) {
      agentEntry.tokens += tokens;
    } else {
      existing.push({ agentId, tokens });
    }

    this.usage.set(tenantId, existing);
  }

  /**
   * Get daily usage report for a tenant.
   *
   * @param tenantId - Tenant ID
   * @returns Usage breakdown
   */
  getDailyUsage(tenantId: string): DailyUsage {
    const perAgent = this.usage.get(tenantId) ?? [];
    const totalTokens = perAgent.reduce((sum, a) => sum + a.tokens, 0);

    return {
      tenantId,
      date: new Date().toISOString().split("T")[0]!,
      totalTokens,
      perAgent,
    };
  }

  /**
   * Check if tenant is within quota.
   *
   * @param tenantId - Tenant ID
   * @param maxTokensPerDay - Plan limit
   * @returns Quota status (ok/warning/exceeded)
   */
  checkQuota(tenantId: string, maxTokensPerDay: number): QuotaStatus {
    const { totalTokens } = this.getDailyUsage(tenantId);
    const percentUsed = Math.round((totalTokens / maxTokensPerDay) * 100);

    let status: "ok" | "warning" | "exceeded";
    if (percentUsed >= 100) {
      status = "exceeded";
    } else if (percentUsed >= WARNING_THRESHOLD) {
      status = "warning";
    } else {
      status = "ok";
    }

    return {
      status,
      used: totalTokens,
      limit: maxTokensPerDay,
      percentUsed,
    };
  }

  /**
   * Generate monthly invoice for a tenant.
   *
   * @param tenantId - Tenant ID
   * @param period - Month (e.g., "2026-03")
   * @returns Invoice with line items
   */
  generateInvoice(tenantId: string, period: string): Invoice {
    const perAgent = this.usage.get(tenantId) ?? [];
    const totalTokens = perAgent.reduce((sum, a) => sum + a.tokens, 0);

    return {
      tenantId,
      period,
      totalTokens,
      lineItems: perAgent.map((a) => ({
        agentId: a.agentId,
        tokens: a.tokens,
        description: `Agent ${a.agentId}: ${a.tokens} tokens`,
      })),
      status: "draft",
      generatedAt: new Date().toISOString(),
    };
  }
}
