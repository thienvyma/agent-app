/**
 * TenantManager — multi-tenant CRUD and plan management.
 *
 * Manages tenants with plan-based limits (agents, tokens).
 * In production, backed by Prisma. MVP uses in-memory store.
 *
 * @module core/tenant/tenant-manager
 */

/** Tenant plan types */
export type TenantPlan = "trial" | "free" | "starter" | "business" | "enterprise";

/** Plan limits configuration */
const PLAN_LIMITS: Record<TenantPlan, { maxAgents: number; maxTokensPerDay: number }> = {
  trial: { maxAgents: 2, maxTokensPerDay: 10000 },
  free: { maxAgents: 3, maxTokensPerDay: 50000 },
  starter: { maxAgents: 5, maxTokensPerDay: 200000 },
  business: { maxAgents: 15, maxTokensPerDay: 1000000 },
  enterprise: { maxAgents: 999, maxTokensPerDay: 999999999 },
};

/** Tenant entity */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  maxAgents: number;
  maxTokensPerDay: number;
  status: "active" | "suspended" | "trial";
  createdAt: Date;
}

/** Create tenant input */
interface CreateTenantInput {
  name: string;
  slug: string;
  plan?: TenantPlan;
}

/** Tenant stats */
interface TenantStats {
  tenantId: string;
  agentsTotal: number;
  agentsRunning: number;
  tasksToday: number;
  tokensToday: number;
}

/**
 * Manages tenant lifecycle and plan enforcement.
 */
export class TenantManager {
  private tenants: Tenant[] = [];
  private nextId = 1;

  /**
   * Create a new tenant.
   *
   * @param input - Tenant data
   * @returns Created tenant
   * @throws If slug already exists
   */
  create(input: CreateTenantInput): Tenant {
    // Check slug uniqueness
    if (this.tenants.some((t) => t.slug === input.slug)) {
      throw new Error("slug already exists");
    }

    const plan = input.plan ?? "trial";
    const limits = PLAN_LIMITS[plan];

    const tenant: Tenant = {
      id: `tenant-${this.nextId++}`,
      name: input.name,
      slug: input.slug,
      plan,
      maxAgents: limits.maxAgents,
      maxTokensPerDay: limits.maxTokensPerDay,
      status: plan === "trial" ? "trial" : "active",
      createdAt: new Date(),
    };

    this.tenants.push(tenant);
    return tenant;
  }

  /**
   * Get tenant by ID.
   */
  get(id: string): Tenant | null {
    return this.tenants.find((t) => t.id === id) ?? null;
  }

  /**
   * Get tenant by slug.
   */
  getBySlug(slug: string): Tenant | null {
    return this.tenants.find((t) => t.slug === slug) ?? null;
  }

  /**
   * List all tenants.
   */
  list(): Tenant[] {
    return [...this.tenants];
  }

  /**
   * Update a tenant (plan change auto-adjusts limits).
   */
  update(id: string, data: Partial<Pick<Tenant, "name" | "plan" | "status">>): Tenant {
    const tenant = this.tenants.find((t) => t.id === id);
    if (!tenant) throw new Error("Tenant not found");

    if (data.name) tenant.name = data.name;
    if (data.status) tenant.status = data.status;

    if (data.plan) {
      tenant.plan = data.plan;
      const limits = PLAN_LIMITS[data.plan];
      tenant.maxAgents = limits.maxAgents;
      tenant.maxTokensPerDay = limits.maxTokensPerDay;
    }

    return tenant;
  }

  /**
   * Delete a tenant.
   */
  delete(id: string): void {
    this.tenants = this.tenants.filter((t) => t.id !== id);
  }

  /**
   * Get tenant statistics.
   */
  getStats(tenantId: string): TenantStats {
    return {
      tenantId,
      agentsTotal: 0,
      agentsRunning: 0,
      tasksToday: 0,
      tokensToday: 0,
    };
  }
}
