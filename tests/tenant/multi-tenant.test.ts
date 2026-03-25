/**
 * Tests for Multi-Tenant modules.
 * Phase 30: Multi-Tenant (FINAL SESSION).
 *
 * Tests: TenantManager, TenantContext, TenantBilling.
 */

import { TenantManager, type TenantPlan } from "@/core/tenant/tenant-manager";
import { TenantContext } from "@/core/tenant/tenant-context";
import { TenantBilling } from "@/core/tenant/tenant-billing";

describe("TenantManager", () => {
  let manager: TenantManager;

  beforeEach(() => {
    manager = new TenantManager();
  });

  describe("create", () => {
    it("should create a tenant with default trial plan", () => {
      const tenant = manager.create({ name: "Startup ABC", slug: "startup-abc" });
      expect(tenant.id).toBeDefined();
      expect(tenant.name).toBe("Startup ABC");
      expect(tenant.slug).toBe("startup-abc");
      expect(tenant.plan).toBe("trial");
      expect(tenant.maxAgents).toBe(2);
      expect(tenant.maxTokensPerDay).toBe(10000);
      expect(tenant.status).toBe("trial");
    });

    it("should create a tenant with specific plan", () => {
      const tenant = manager.create({ name: "Corp X", slug: "corp-x", plan: "business" });
      expect(tenant.plan).toBe("business");
      expect(tenant.maxAgents).toBe(15);
      expect(tenant.maxTokensPerDay).toBe(1000000);
    });

    it("should reject duplicate slugs", () => {
      manager.create({ name: "A", slug: "same-slug" });
      expect(() => manager.create({ name: "B", slug: "same-slug" })).toThrow("slug already exists");
    });
  });

  describe("get / list", () => {
    it("should get tenant by id", () => {
      const created = manager.create({ name: "Test", slug: "test" });
      const found = manager.get(created.id);
      expect(found?.name).toBe("Test");
    });

    it("should list all tenants", () => {
      manager.create({ name: "A", slug: "a" });
      manager.create({ name: "B", slug: "b" });
      expect(manager.list()).toHaveLength(2);
    });
  });

  describe("update", () => {
    it("should update tenant plan", () => {
      const tenant = manager.create({ name: "Grow", slug: "grow" });
      const updated = manager.update(tenant.id, { plan: "starter" });
      expect(updated.plan).toBe("starter");
      expect(updated.maxAgents).toBe(5);
    });
  });

  describe("delete", () => {
    it("should remove tenant", () => {
      const tenant = manager.create({ name: "Temp", slug: "temp" });
      manager.delete(tenant.id);
      expect(manager.get(tenant.id)).toBeNull();
    });
  });

  describe("getStats", () => {
    it("should return tenant statistics", () => {
      const tenant = manager.create({ name: "Stats", slug: "stats" });
      const stats = manager.getStats(tenant.id);
      expect(stats.tenantId).toBe(tenant.id);
      expect(stats.agentsTotal).toBe(0);
      expect(stats.tokensToday).toBe(0);
    });
  });

  describe("plan limits", () => {
    it("should enforce plan limits correctly", () => {
      const plans: TenantPlan[] = ["trial", "free", "starter", "business", "enterprise"];
      const expectedAgents = [2, 3, 5, 15, 999];

      plans.forEach((plan, i) => {
        const tenant = manager.create({ name: `Plan ${plan}`, slug: `plan-${plan}`, plan });
        expect(tenant.maxAgents).toBe(expectedAgents[i]);
      });
    });
  });
});

describe("TenantContext", () => {
  describe("getSchemaName", () => {
    it("should generate schema name from tenant id", () => {
      const schema = TenantContext.getSchemaName("tenant-001");
      expect(schema).toBe("t_tenant_001");
    });
  });

  describe("getRedisPrefix", () => {
    it("should generate Redis key prefix", () => {
      const prefix = TenantContext.getRedisPrefix("tenant-001");
      expect(prefix).toBe("t:tenant-001:");
    });
  });

  describe("validateAccess", () => {
    it("should allow same-tenant access", () => {
      expect(TenantContext.validateAccess("t1", "t1")).toBe(true);
    });

    it("should block cross-tenant access", () => {
      expect(TenantContext.validateAccess("t1", "t2")).toBe(false);
    });
  });

  describe("scopeRedisKey", () => {
    it("should scope Redis key with tenant prefix", () => {
      const key = TenantContext.scopeRedisKey("tenant-001", "sessions:ceo");
      expect(key).toBe("t:tenant-001:sessions:ceo");
    });
  });
});

describe("TenantBilling", () => {
  let billing: TenantBilling;

  beforeEach(() => {
    billing = new TenantBilling();
  });

  describe("trackUsage", () => {
    it("should track token usage for a tenant", () => {
      billing.trackUsage("t1", "agent-ceo", 500);
      billing.trackUsage("t1", "agent-mkt", 300);

      const usage = billing.getDailyUsage("t1");
      expect(usage.totalTokens).toBe(800);
      expect(usage.perAgent).toHaveLength(2);
    });
  });

  describe("checkQuota", () => {
    it("should return OK when within quota", () => {
      billing.trackUsage("t1", "ceo", 5000);
      const quota = billing.checkQuota("t1", 50000);
      expect(quota.status).toBe("ok");
      expect(quota.percentUsed).toBe(10);
    });

    it("should return warning when near limit", () => {
      billing.trackUsage("t1", "ceo", 42000);
      const quota = billing.checkQuota("t1", 50000);
      expect(quota.status).toBe("warning");
    });

    it("should return exceeded when over limit", () => {
      billing.trackUsage("t1", "ceo", 55000);
      const quota = billing.checkQuota("t1", 50000);
      expect(quota.status).toBe("exceeded");
    });
  });

  describe("generateInvoice", () => {
    it("should generate monthly invoice", () => {
      billing.trackUsage("t1", "ceo", 10000);
      billing.trackUsage("t1", "mkt", 20000);

      const invoice = billing.generateInvoice("t1", "2026-03");
      expect(invoice.tenantId).toBe("t1");
      expect(invoice.period).toBe("2026-03");
      expect(invoice.totalTokens).toBe(30000);
      expect(invoice.lineItems).toHaveLength(2);
      expect(invoice.status).toBe("draft");
    });
  });
});
