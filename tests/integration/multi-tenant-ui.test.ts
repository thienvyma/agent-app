/**
 * S57 — Multi-Tenant Company Management UI Tests.
 *
 * TDD: Tests written FIRST (Red) → then code → tests PASS (Green).
 *
 * @module tests/integration/multi-tenant-ui
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// 1. API ROUTE EXISTENCE
// ══════════════════════════════════════════════

describe("S57 Multi-Tenant — API Route", () => {
  it("should have /api/company route", () => {
    const routePath = path.join(process.cwd(), "src", "app", "api", "company", "route.ts");
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("should export GET and POST handlers", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "api", "company", "route.ts"),
      "utf-8"
    );
    expect(content).toContain("export async function GET");
    expect(content).toContain("export async function POST");
  });

  it("should use Prisma for company CRUD", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "api", "company", "route.ts"),
      "utf-8"
    );
    expect(content).toContain("prisma.company");
  });
});

// ══════════════════════════════════════════════
// 2. COMPANIES UI PAGE
// ══════════════════════════════════════════════

describe("S57 Multi-Tenant — Companies UI Page", () => {
  const companiesPagePath = path.join(
    process.cwd(), "src", "app", "(dashboard)", "settings", "companies", "page.tsx"
  );

  it("should exist at /settings/companies", () => {
    expect(fs.existsSync(companiesPagePath)).toBe(true);
  });

  it("should fetch from /api/company", () => {
    const content = fs.readFileSync(companiesPagePath, "utf-8");
    expect(content).toContain("/api/company");
  });

  it("should have create company form", () => {
    const content = fs.readFileSync(companiesPagePath, "utf-8");
    expect(content).toContain("New Company");
    expect(content).toContain("Company name");
  });

  it("should NOT use direct file access", () => {
    const content = fs.readFileSync(companiesPagePath, "utf-8");
    expect(content).not.toContain("import * as fs");
    expect(content).not.toContain("writeFileSync");
  });
});

// ══════════════════════════════════════════════
// 3. SETTINGS PAGE — COMPANIES TAB
// ══════════════════════════════════════════════

describe("S57 Multi-Tenant — Settings Page Tab", () => {
  const settingsPagePath = path.join(
    process.cwd(), "src", "app", "(dashboard)", "settings", "page.tsx"
  );

  it("should have 'companies' in Tab type", () => {
    const content = fs.readFileSync(settingsPagePath, "utf-8");
    expect(content).toContain("companies");
  });

  it("should import Companies page dynamically", () => {
    const content = fs.readFileSync(settingsPagePath, "utf-8");
    expect(content).toContain("companies/page");
  });

  it("should have Companies tab in TABS array", () => {
    const content = fs.readFileSync(settingsPagePath, "utf-8");
    expect(content).toContain("Companies");
  });
});

// ══════════════════════════════════════════════
// 4. TENANT MANAGER CORE MODULE
// ══════════════════════════════════════════════

describe("S57 Multi-Tenant — TenantManager Core", () => {
  it("should export TenantManager class", () => {
    const { TenantManager } = require("../../src/core/tenant/tenant-manager");
    expect(typeof TenantManager).toBe("function");
  });

  it("should support CRUD operations", () => {
    const { TenantManager } = require("../../src/core/tenant/tenant-manager");
    const mgr = new TenantManager();

    const tenant = mgr.create({ name: "Test Co", slug: "test-co" });
    expect(tenant.id).toBeDefined();
    expect(tenant.name).toBe("Test Co");
    expect(tenant.plan).toBe("trial");

    const found = mgr.get(tenant.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Test Co");

    const all = mgr.list();
    expect(all.length).toBe(1);

    mgr.update(tenant.id, { plan: "business" });
    const updated = mgr.get(tenant.id);
    expect(updated!.plan).toBe("business");
    expect(updated!.maxAgents).toBe(15);

    mgr.delete(tenant.id);
    expect(mgr.list().length).toBe(0);
  });
});
